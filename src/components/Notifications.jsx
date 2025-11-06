import React, { useEffect, useState, useRef } from "react";
import { FaBell, FaTrashAlt } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  deleteDoc,
  doc,
  addDoc,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "../firebase";

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef(null);

  // 🧠 Real-time listener for notifications
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const notifRef = collection(db, "users", user.uid, "notifications");
    const q = query(notifRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setNotifications(notifList);
      setUnreadCount(notifList.filter((n) => !n.read).length);
    });

    return () => unsubscribe();
  }, []);

  // 🔁 Real-time listener for RECEIPT updates → auto-notify user
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const receiptsRef = collection(db, "users", user.uid, "receipts");
    const unsubscribe = onSnapshot(receiptsRef, async (snapshot) => {
      for (const change of snapshot.docChanges()) {
        if (change.type === "modified") {
          const data = change.doc.data();
          const receiptId = change.doc.id;

          // Only trigger on status change
          if (data.status && ["approved", "rejected", "cancelled"].includes(data.status)) {
            const notifMessage =
              data.status === "approved"
                ? `✅ Your top-up of ₱${data.amount} has been approved!`
                : data.status === "rejected"
                ? `❌ Your top-up of ₱${data.amount} was rejected.`
                : `⚠️ Your top-up of ₱${data.amount} was cancelled.`;

            // Prevent duplicate notifications (same receipt + status)
            const existingNotifs = await getDocs(
              query(collection(db, "users", user.uid, "notifications"))
            );
            const alreadyExists = existingNotifs.docs.some(
              (n) =>
                n.data().receiptId === receiptId &&
                n.data().status === data.status
            );

            if (!alreadyExists) {
              await addDoc(collection(db, "users", user.uid, "notifications"), {
                message: notifMessage,
                read: false,
                createdAt: new Date().toISOString(),
                receiptId,
                status: data.status,
              });
            }
          }
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // 🖱️ Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ Mark all as read when opening
  const handleToggle = async () => {
    setOpen(!open);
    const user = auth.currentUser;
    if (!open && user && unreadCount > 0) {
      notifications
        .filter((n) => !n.read)
        .forEach(async (notif) => {
          const notifDoc = doc(db, "users", user.uid, "notifications", notif.id);
          await updateDoc(notifDoc, { read: true });
        });
    }
  };

  // 🗑️ Delete a single notification
  const handleDelete = async (notifId) => {
    const user = auth.currentUser;
    if (!user) return;

    const confirmDelete = confirm("Delete this notification?");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "users", user.uid, "notifications", notifId));
    } catch (error) {
      console.error("Error deleting notification:", error);
      alert("Failed to delete notification.");
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* 🔔 Notification Icon */}
      <div
        className="relative text-gray-200 transition cursor-pointer hover:text-pink-500"
        onClick={handleToggle}
      >
        <FaBell size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        )}
      </div>

      {/* 🧾 Dropdown Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 z-50 mt-3 overflow-hidden bg-gray-900 border border-gray-800 shadow-2xl w-72 sm:w-80 rounded-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <h3 className="text-sm font-semibold text-gray-100">Notifications</h3>
              {notifications.length > 0 && (
                <span className="text-xs text-gray-400">
                  {unreadCount > 0 ? `${unreadCount} unread` : "All read ✅"}
                </span>
              )}
            </div>

            {/* List */}
            <div className="overflow-y-auto max-h-64 custom-scrollbar">
              {notifications.length > 0 ? (
                notifications.map((notif) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-start justify-between px-4 py-3 text-sm border-b border-gray-800 last:border-none transition hover:bg-gray-800/60 ${
                      !notif.read ? "bg-gray-800/40" : ""
                    }`}
                  >
                    <div className="flex-1 pr-3">
                      <p className="text-gray-200 break-words">{notif.message}</p>
                      <span className="block mt-1 text-xs text-gray-500">
                        {new Date(notif.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(notif.id)}
                      className="p-1 text-gray-400 rounded hover:text-red-500 hover:bg-gray-800"
                      title="Delete notification"
                    >
                      <FaTrashAlt size={13} />
                    </button>
                  </motion.div>
                ))
              ) : (
                <div className="py-6 text-sm text-center text-gray-400">
                  No notifications yet 📭
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Notifications;
