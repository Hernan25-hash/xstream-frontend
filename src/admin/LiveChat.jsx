import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { app } from "../firebase";

const LiveChat = () => {
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [referralLink, setReferralLink] = useState(
    "https://chaturbate.com/in/?tour=LQps&campaign=S7hxs&track=default&room=makmak_25"
  );
  const [categoryFilter, setCategoryFilter] = useState(""); // optional category for sending

  const db = getFirestore(app);
  const auth = getAuth(app);
  const navigate = useNavigate();

  // 🔹 Fetch messages in real-time (ascending)
  useEffect(() => {
    const q = query(collection(db, "livechat"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
      }));
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [db]);

  // 🔹 Send new message
  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMsg.trim() && !imageUrl.trim() && !referralLink.trim()) return;

    try {
      await addDoc(collection(db, "livechat"), {
        text: newMsg.trim() || "",
        imageUrl: imageUrl.trim() || "",
        referralLink: referralLink.trim() || "",
        category: categoryFilter.trim() || "",
        uid: auth.currentUser?.uid || "admin",
        displayName: auth.currentUser?.displayName || "Admin",
        createdAt: serverTimestamp(),
      });

      setNewMsg("");
      setImageUrl("");
      setCategoryFilter("");
    } catch (err) {
      console.error("Error saving data:", err);
      alert("Failed to save data.");
    }
  };

  // 🔹 Filter messages by category (optional)
  const filteredMessages = categoryFilter
    ? messages.filter(
        (msg) =>
          msg.category &&
          msg.category.toLowerCase().includes(categoryFilter.toLowerCase())
      )
    : messages;

  return (
    <div className="flex flex-col min-h-screen p-3 text-white bg-gray-900 rounded-lg shadow-lg sm:p-5">
      {/* Back & Header */}
      <div className="flex items-center mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-2 py-1 text-sm bg-gray-800 rounded sm:px-3 hover:bg-gray-700"
        >
          ← Back
        </button>
        <h1 className="ml-3 text-xl font-bold text-pink-600 sm:text-2xl">
          Live Chat Admin
        </h1>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSend} className="flex flex-col gap-3 mb-5">
        <input
          type="text"
          placeholder="Message (optional)"
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          className="w-full p-2 text-sm text-black rounded sm:p-3 sm:text-base"
        />
        <input
          type="text"
          placeholder="Paste image URL"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="w-full p-2 text-sm text-black rounded sm:p-3 sm:text-base"
        />
        <input
          type="text"
          placeholder="Referral link"
          value={referralLink}
          onChange={(e) => setReferralLink(e.target.value)}
          className="w-full p-2 text-sm text-black rounded sm:p-3 sm:text-base"
        />
        <input
          type="text"
          placeholder="Category (optional)"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-full p-2 text-sm text-black rounded sm:p-3 sm:text-base"
        />
        <button
          type="submit"
          className="px-3 py-2 text-sm font-medium text-white transition bg-pink-600 rounded sm:px-4 sm:text-base hover:bg-pink-700"
        >
          Save
        </button>
      </form>

      {/* Messages Grid */}
      {filteredMessages.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-4">
          {filteredMessages.map((msg) => (
            <div
              key={msg.id}
              className="flex flex-col p-2 bg-gray-800 rounded shadow"
            >
              {msg.imageUrl && (
                <img
                  src={msg.imageUrl}
                  alt="Live Chat"
                  className="object-cover w-full h-40 rounded sm:h-48"
                />
              )}
              {msg.text && (
                <p className="mt-1 text-sm text-white break-words sm:text-base">
                  {msg.text}
                </p>
              )}
              {msg.referralLink && (
                <a
                  href={msg.referralLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 text-xs text-blue-400 break-all truncate sm:text-sm"
                >
                  {msg.referralLink}
                </a>
              )}
              {msg.category && (
                <p className="mt-1 text-xs text-green-400 truncate sm:text-sm">
                  Category: {msg.category}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-6 text-center text-gray-400">No messages found.</p>
      )}
    </div>
  );
};

export default LiveChat;
