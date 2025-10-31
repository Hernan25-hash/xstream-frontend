import React, { useEffect, useState } from "react";
import {
  getFirestore,
  collection,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { app } from "../firebase";

const db = getFirestore(app);

const AdTopUp = ({ userId, btnText = "View Top-ups" }) => {
  const [receipts, setReceipts] = useState([]);
  const [remarks, setRemarks] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [userInfo, setUserInfo] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [actionMessages, setActionMessages] = useState({}); // 🔹 Action messages

  // 🔹 Top-Up Rates
  const rates = [
    { price: 5, description: "3 hrs / 1 day", validity: 24 * 60 * 60 * 1000 },
    { price: 10, description: "7 hrs / 2 days", validity: 48 * 60 * 60 * 1000 },
  ];

  // 🔹 Fetch user info
  useEffect(() => {
    if (!userId) return;
    const unsubscribe = onSnapshot(doc(db, "users", userId), (docSnap) => {
      if (docSnap.exists()) setUserInfo({ id: docSnap.id, ...docSnap.data() });
    });
    return () => unsubscribe();
  }, [userId]);

  // 🔹 Fetch receipts with status "processing"
  useEffect(() => {
    if (!userId) return;
    const receiptsRef = collection(db, "users", userId, "receipts");
    const q = query(receiptsRef, where("status", "==", "processing"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setReceipts(data);
      setPendingCount(snapshot.size);
    });
    return () => unsubscribe();
  }, [userId]);

  // 🔹 Approve / Reject / Cancel receipt
const handleAction = async (receiptId, action) => {
  if (action !== "approved" && !remarks.trim()) {
    alert("Please add remarks");
    return;
  }

  try {
    const receiptRef = doc(db, "users", userId, "receipts", receiptId);

    await updateDoc(receiptRef, {
      status: action,
      remarks: action === "approved" ? "" : remarks,
      updatedAt: new Date(),
    });

    // 🔹 If approved, grant exclusive timed access
    if (action === "approved") {
      const userRef = doc(db, "users", userId);
      const receipt = receipts.find((r) => r.id === receiptId);
      const matchedRate = rates.find((rate) => rate.price === receipt?.amount);

      // ✅ Define usage time + validity
      let accessDurationMs = 0;
      let validityMs = 0;

      if (matchedRate?.price === 5) {
        // ₱5 → 3 hours total access, valid for 24 hours
        accessDurationMs = 3 * 60 * 60 * 1000;
        validityMs = 24 * 60 * 60 * 1000;
      } else if (matchedRate?.price === 10) {
        // ₱10 → 7 hours total access, valid for 48 hours
        accessDurationMs = 7 * 60 * 60 * 1000;
        validityMs = 48 * 60 * 60 * 1000;
      } else {
        // Default fallback
        accessDurationMs = 3 * 60 * 60 * 1000;
        validityMs = 24 * 60 * 60 * 1000;
      }

      const now = new Date();
      const expiry = new Date(now.getTime() + validityMs);

      await updateDoc(userRef, {
        exclusiveAccessExpiry: expiry.toISOString(), // Validity window end time
        exclusiveAccessRemaining: accessDurationMs,   // Remaining usable time
        exclusiveAccessStarted: true,                // Not started yet
      });

      console.log(
        `✅ Granted ${accessDurationMs / 3600000}h access (valid for ${validityMs / 3600000}h)`
      );
    }

    setRemarks("");

    // ✅ Temporary success message
    setActionMessages((prev) => ({
      ...prev,
      [receiptId]: `${action.charAt(0).toUpperCase() + action.slice(1)} successfully!`,
    }));

    setTimeout(() => {
      setActionMessages((prev) => ({ ...prev, [receiptId]: "" }));
    }, 3000);
  } catch (err) {
    console.error("Error updating receipt:", err);
    alert("Failed to update receipt");
  }
};


  // 🔹 Delete receipt
  const handleDelete = async (receiptId) => {
    if (!window.confirm("Are you sure you want to delete this receipt?")) return;
    try {
      await deleteDoc(doc(db, "users", userId, "receipts", receiptId));
    } catch (err) {
      console.error("Error deleting receipt:", err);
      alert("Failed to delete receipt");
    }
  };

  return (
    <>
      {/* 🔹 Button with badge */}
      <button
        onClick={() => setShowModal(true)}
        className="relative px-3 py-1 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700"
      >
        {btnText}
        {pendingCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-red-600 rounded-full">
            {pendingCount}
          </span>
        )}
      </button>

      {/* 🔹 Modal */}
      {showModal && userInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="w-full max-w-md p-5 bg-gray-900 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xl font-semibold text-pink-500">
                {userInfo.displayName || userInfo.email || "User"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-xl font-bold text-gray-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            {receipts.length === 0 ? (
              <p className="text-gray-400">No pending top-ups.</p>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-64">
                {receipts.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 border border-gray-800 rounded bg-gray-800/60"
                  >
                    {/* 🔹 Amount with Top-Up rate description */}
                    <p>
                      <strong>Amount:</strong> ₱{r.amount || 0}{" "}
                      {rates.find((rate) => rate.price === r.amount)?.description && (
                        <span className="text-sm text-gray-400">
                          ({rates.find((rate) => rate.price === r.amount)?.description})
                        </span>
                      )}
                    </p>

                    <p>
                      <strong>Status:</strong>{" "}
                      <span
                        className={`font-semibold ${
                          r.status === "approved"
                            ? "text-green-400"
                            : r.status === "rejected"
                            ? "text-red-400"
                            : r.status === "processing"
                            ? "text-yellow-400"
                            : "text-gray-400"
                        }`}
                      >
                        {r.status}
                      </span>
                    </p>

                    {r.receiptURL && (
                      <button
                        onClick={() => setSelectedReceipt(r.receiptURL)}
                        className="text-sm text-blue-400 underline"
                      >
                        View Receipt
                      </button>
                    )}

                    <p className="text-sm text-gray-400">
                      {r.createdAt
                        ? new Date(r.createdAt.seconds * 1000).toLocaleString()
                        : ""}
                    </p>

                    <textarea
                      placeholder="Remarks..."
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="w-full p-2 mt-2 text-sm text-white bg-gray-700 rounded"
                    />

                    <div className="flex flex-wrap justify-end gap-2 mt-2">
                      <button
                        onClick={() => handleAction(r.id, "approved")}
                        className="px-3 py-1 text-xs text-white bg-green-600 rounded hover:bg-green-700"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(r.id, "rejected")}
                        className="px-3 py-1 text-xs text-white bg-red-600 rounded hover:bg-red-700"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleAction(r.id, "cancelled")}
                        className="px-3 py-1 text-xs text-white bg-gray-600 rounded hover:bg-gray-500"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="px-3 py-1 text-xs text-white bg-pink-600 rounded hover:bg-pink-700"
                      >
                        Delete
                      </button>
                    </div>

                    {/* Temporary action message */}
                    {actionMessages[r.id] && (
                      <p className="mt-1 text-sm text-green-400">{actionMessages[r.id]}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 🔹 Inline receipt modal */}
            {selectedReceipt && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
                <div className="relative w-full max-w-sm">
                  <button
                    onClick={() => setSelectedReceipt(null)}
                    className="fixed z-50 text-xl font-bold text-gray-200 top-4 right-4 hover:text-white"
                  >
                    ✕
                  </button>
                  <img
                    src={selectedReceipt}
                    alt="Receipt"
                    className="w-full h-auto max-h-[80vh] object-contain rounded"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AdTopUp;
