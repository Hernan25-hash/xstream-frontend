// src/components/LiveChatUser.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  limit,
  startAfter,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "../firebase";

import TopNav from "./TopNav";
import Footer from "./Footer";
import Banner from "./Banner";

// Skeleton for loading messages
const MessageSkeleton = () => (
  <div className="flex flex-col overflow-hidden bg-gray-800 rounded shadow animate-pulse">
    <div className="w-full bg-gray-700 aspect-[4/3] rounded-t"></div>
    <div className="p-2 space-y-1">
      <div className="w-3/4 h-3 bg-gray-600 rounded"></div>
      <div className="w-1/2 h-3 bg-gray-600 rounded"></div>
    </div>
  </div>
);

// Shuffle helper
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const LiveChatUser = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [user, setUser] = useState(null);
  const [visibleCount, setVisibleCount] = useState(12);
  const [lastVisible, setLastVisible] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const PAGE_SIZE = 12;
  const db = getFirestore(app);
  const auth = getAuth(app);

  // Guest ID
  const guestId = useMemo(() => {
    let id = localStorage.getItem("xstreamGuestId");
    if (!id) {
      id = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("xstreamGuestId", id);
    }
    return id;
  }, []);

  // Auth listener + fetch Firestore user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);
          const userData = userSnap.exists() ? userSnap.data() : {};

          setUser({
            id: currentUser.uid,
            name: userData.username || userData.displayName || currentUser.displayName || "User",
            username: userData.username || userData.displayName || currentUser.displayName || "User",
            email: currentUser.email,
            avatar: userData.avatar || currentUser.photoURL || "/avatar/profile.png",
          });
        } catch (err) {
          console.error("Error fetching user data:", err);
          setUser({
            id: currentUser.uid,
            name: currentUser.displayName || "User",
            username: currentUser.displayName || "User",
            email: currentUser.email,
            avatar: currentUser.photoURL || "/avatar/profile.png",
          });
        }
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, [auth, db]);

  // Fetch initial messages
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, "livechat"), orderBy("createdAt", "desc"), limit(PAGE_SIZE));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMessages(shuffleArray(msgs));
      setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [db]);

  // Load more messages
  const loadMore = async () => {
    if (!lastVisible) return;
    setLoadingMore(true);
    const nextQuery = query(
      collection(db, "livechat"),
      orderBy("createdAt", "desc"),
      startAfter(lastVisible),
      limit(PAGE_SIZE)
    );
    const snapshot = await getDocs(nextQuery);
    const moreMsgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    setMessages((prev) => shuffleArray([...prev, ...moreMsgs]));
    setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
    setVisibleCount((prev) => prev + moreMsgs.length);
    setLoadingMore(false);
  };

  // Filter messages by search
  const filteredMessages = messages.filter((msg) =>
    msg.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative min-h-screen text-white bg-gray-900">
      {/* TopNav */}
      <TopNav
        user={user || { avatar: "/avatar/profile.png" }}
        search={search}
        setSearch={setSearch}
        showCategories={false}
        availableCategories={[]}
        loading={loading}
      />

      <Banner />

      <main className="max-w-[90rem] mx-auto px-4 pt-6 pb-12">
        <h2 className="mb-4 text-2xl font-semibold">Live Chat</h2>

        {loading && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-6">
            {Array.from({ length: PAGE_SIZE }).map((_, idx) => (
              <MessageSkeleton key={idx} />
            ))}
          </div>
        )}

        {!loading && filteredMessages.length === 0 && (
          <p className="py-20 text-center text-gray-400">No messages found.</p>
        )}

        {!loading && filteredMessages.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-6">
              {filteredMessages.slice(0, visibleCount).map((msg) => (
                <a
                  key={msg.id}
                  href={msg.referralLink || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col overflow-hidden transition-transform duration-200 bg-gray-800 rounded shadow hover:scale-105"
                >
                  {msg.imageUrl && (
                    <div className="w-full aspect-[4/3]">
                      <img
                        src={msg.imageUrl}
                        alt={msg.category || "Live Chat"}
                        className="object-cover w-full h-full rounded"
                      />
                    </div>
                  )}
                  {msg.category && (
                    <p className="px-2 mt-2 text-xs text-green-400 truncate sm:text-sm">
                      Category: {msg.category}
                    </p>
                  )}
                </a>
              ))}
            </div>

            {visibleCount < filteredMessages.length && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={loadMore}
                  className="px-3 py-1 text-sm text-white transition border border-pink-600 rounded hover:bg-pink-600"
                  disabled={loadingMore}
                >
                  {loadingMore ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default LiveChatUser;
