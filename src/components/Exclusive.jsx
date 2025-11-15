import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { app } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";
import { FaLock, FaStar, FaWallet, FaClock } from "react-icons/fa";
import TopNav from "../components/TopNav";
import ReceiptModal from "../components/ReceiptModal";
import Loading from "../components/Loading";
import Transactions from "../components/Transactions";
import { setExclusiveAccessStarted, initExclusiveVisibilityHandler } from "../utils/exclusiveAccess";
import Banner from "../components/Banner";
import Footer from "../components/Footer";

const formatViews = (views) => {
  if (views >= 1_000_000) return (views / 1_000_000).toFixed(1) + "M";
  if (views >= 1_000) return (views / 1_000).toFixed(1) + "K";
  return views.toString();
};

const rates = [
  { price: 5, description: "3 Hours Access / 1 Day Validity", durationMs: 3 * 60 * 60 * 1000, validityMs: 24 * 60 * 60 * 1000 },
  { price: 10, description: "7 Hours Access / 2 Days Validity", durationMs: 7 * 60 * 60 * 1000, validityMs: 48 * 60 * 60 * 1000 },
];

const Exclusive = () => {
  const navigate = useNavigate();
  const auth = getAuth(app);
  const db = getFirestore(app);

  const [user, setUser] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [exclusiveVideos, setExclusiveVideos] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [search, setSearch] = useState("");
  const [showTopUp, setShowTopUp] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [selectedRate, setSelectedRate] = useState(null);
  const [accessExpiry, setAccessExpiry] = useState(null);
  const [timeLeft, setTimeLeft] = useState({ usage: "", validity: "" });
  const [showLockedModal, setShowLockedModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [paidInfo, setPaidInfo] = useState({ wallet: null, amount: null });
  const [showLoading, setShowLoading] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  
const [visibleCount, setVisibleCount] = useState(10); // number of videos to show initially
const loadMore = () => setVisibleCount((prev) => prev + 10);

  // 🔹 Exclusive access control (listen-only)
  const [exclusiveAccessExpiry, setExclusiveAccessExpiry] = useState(null);
  const [exclusiveAccessRemaining, setExclusiveAccessRemaining] = useState(null);
  const [exclusiveAccessStarted, setExclusiveAccessStarted] = useState(false);

  const guestId = useMemo(() => {
    let id = localStorage.getItem("xstreamGuestId");
    if (!id) {
      id = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("xstreamGuestId", id);
    }
    return id;
  }, []);

  // 🔹 Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const ref = doc(db, "users", firebaseUser.uid);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            const userData = snap.data();
            setUser({ ...firebaseUser, ...userData, avatar: userData.avatar || firebaseUser.photoURL || "/avatar/profile.png", displayName: userData.displayName || firebaseUser.displayName || "User" });
            setAccessExpiry(userData.exclusiveAccessExpiry || null);
          } else {
            setUser({ uid: firebaseUser.uid, email: firebaseUser.email, provider: firebaseUser.providerData[0]?.providerId || "email", displayName: firebaseUser.displayName || "User", avatar: firebaseUser.photoURL || "/avatar/profile.png" });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else setUser(null);

      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, [auth, db]);

  // 🔹 Realtime listener (read-only)
  useEffect(() => {
    if (!user?.uid) return;
    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (!docSnap.exists()) return;
      const data = docSnap.data();
      setExclusiveAccessExpiry(data.exclusiveAccessExpiry || null);
      setExclusiveAccessRemaining(data.exclusiveAccessRemaining ?? null);
      setExclusiveAccessStarted(data.exclusiveAccessStarted ?? false);
      setAccessExpiry(data.exclusiveAccessExpiry || null);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  // 🔹 Fetch exclusive videos
  useEffect(() => {
    const q = query(collection(db, "videos"), where("exclusive", "==", true));
    const unsub = onSnapshot(q, (snapshot) => {
      const vids = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setExclusiveVideos(vids.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
    });
    return () => unsub();
  }, [db]);

  // ✅ Accurate timer that syncs remaining time with Firestore + auto pause/resume
useEffect(() => {
  if (!exclusiveAccessExpiry || exclusiveAccessRemaining == null || !user?.uid) {
    setTimeLeft({ usage: "", validity: "" });
    return;
  }

  let remaining = exclusiveAccessRemaining;
  const expiryMs = Date.parse(exclusiveAccessExpiry);
  let lastTick = Date.now();
  let interval, saveInterval;

  const tick = () => {
    const now = Date.now();
    const validityDiff = expiryMs - now;

    if (validityDiff <= 0 || remaining <= 0) {
      setTimeLeft("Expired");
      clearInterval(interval);
      clearInterval(saveInterval);
      return;
    }

    const usageHrs = Math.floor(remaining / (1000 * 60 * 60));
    const usageMins = Math.floor((remaining / (1000 * 60)) % 60);
    const usageSecs = Math.floor((remaining / 1000) % 60);
    const validityHrs = Math.floor(validityDiff / (1000 * 60 * 60));
    const validityMins = Math.floor((validityDiff / (1000 * 60)) % 60);

    setTimeLeft({
      usage: `${usageHrs}h ${usageMins}m ${usageSecs}s`,
      validity: `${validityHrs}h ${validityMins}m`,
    });
  };

  tick(); // initial display

  if (exclusiveAccessStarted) {
    interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastTick;
      lastTick = now;
      remaining -= elapsed;
      tick();
    }, 1000);

    // 🔹 Save the remaining time back to Firestore every 10 seconds
    saveInterval = setInterval(() => {
      import("../utils/exclusiveAccess").then(({ updateExclusiveAccessRemaining }) => {
        updateExclusiveAccessRemaining(db, user.uid, remaining);
      });
    }, 10000);
  }

  // 🔹 Save once immediately when tab/window closes or reloads
  const handleBeforeUnload = async () => {
    if (remaining > 0 && user?.uid) {
      import("../utils/exclusiveAccess").then(({ updateExclusiveAccessRemaining }) => {
        updateExclusiveAccessRemaining(db, user.uid, remaining);
      });
      await setExclusiveAccessStarted(db, user.uid, false);
    }
  };

  window.addEventListener("beforeunload", handleBeforeUnload);

  return () => {
    clearInterval(interval);
    clearInterval(saveInterval);
    window.removeEventListener("beforeunload", handleBeforeUnload);
  };
}, [exclusiveAccessExpiry, exclusiveAccessRemaining, exclusiveAccessStarted, db, user?.uid]);



 // ✅ Auto pause/resume based on tab visibility — synced with Firestore
useEffect(() => {
  if (!user?.uid) return;

  // Start if valid access time exists
  if (exclusiveAccessExpiry && exclusiveAccessRemaining > 0) {
    setExclusiveAccessStarted(db, user.uid, true);
  }

  const cleanup = initExclusiveVisibilityHandler(db, user.uid);

  return () => {
    cleanup?.();
    setExclusiveAccessStarted(db, user.uid, false);
  };
}, [user?.uid, exclusiveAccessExpiry, exclusiveAccessRemaining, db]);


  const handlePaymentSuccess = () => {
  if (!selectedWallet || !selectedRate) return;

  setPaidInfo({
    wallet: selectedWallet,
    amount: selectedRate.price,
    expiry: new Date(Date.now() + selectedRate.validityMs).toISOString(), // calculate expiry
    remaining: selectedRate.durationMs, // usage duration
    description: selectedRate.description
  });

  setShowTopUp(false);
  setTimeout(() => setShowReceiptModal(true), 400);

  // reset selections
  setSelectedWallet(null);
  setSelectedRate(null);
};


  if (loadingAuth) return <Loading text="Checking authentication..." />;

  return (
    <div className="min-h-screen text-white bg-black">
      <AnimatePresence>{showLoading && <Loading text="Processing your payment..." />}</AnimatePresence>
      <TopNav search={search} setSearch={setSearch} user={user} userId={user?.uid || guestId} setShowCategories={() => {}} showCategories={false} />

      {/* Banner Section */}
      <div className="relative w-full mt-16 mb-8 overflow-hidden bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="px-6 py-12 mx-auto text-center max-w-7xl">
          <div className="flex flex-col items-center gap-2 mb-3">
            {exclusiveAccessExpiry && timeLeft !== "Expired" ? (
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-lg">
                  <FaClock className="text-xs" />
                  {timeLeft === "Expired" ? <>Expired</> : (
                    <div className="flex flex-col items-center text-xs">
                      <span>Access Time Left: {timeLeft.usage}</span>
                      <span className="text-gray-300">Validity: {timeLeft.validity}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <button onClick={() => setShowTopUp(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-lg hover:bg-pink-700">
                <FaWallet className="text-sm" /> Top-Up to Unlock Access
              </button>
            )}
          </div>

          <h1 className="mt-6 text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-fuchsia-500">
            Unlock Exclusive Premium Videos
          </h1>
          <p className="mt-2 text-gray-400">Enjoy exclusive content with timed access after top-up.</p>
        </motion.div>
      </div>

      {/* Exclusive Videos Grid */}
<div className="px-4 pb-10 sm:px-6 lg:px-10">
  {/* Title + Filter Dropdown */}
  <div className="flex flex-col items-start justify-between mb-6 sm:flex-row sm:items-center">
    <h1 className="flex items-center gap-2 text-2xl font-bold text-pink-500">
      <FaStar className="text-yellow-400" /> Exclusive Videos
    </h1>

    {/* Filter Dropdown */}
    <div className="relative mt-3 sm:mt-0">
      <select
        value={selectedCategory || "All"}
        onChange={(e) => setSelectedCategory(e.target.value === "All" ? null : e.target.value)}
        className="px-3 py-1 text-sm text-white bg-gray-800 border border-pink-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
      >
        <option value="All">All</option>
        {[...new Set(exclusiveVideos.map((v) => v.category).filter(Boolean))].map((cat) => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
    </div>
    
  </div>
  <Banner/>

  {/* Filtered Videos */}
  {exclusiveVideos.length === 0 ? (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-gray-400">
      <FaLock className="mb-3 text-4xl text-gray-600" />
      <p>No exclusive videos available yet.</p>
    </div>
  ) : (
    <>
      <motion.div
        layout
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
      >
        {exclusiveVideos
          .filter((v) => !selectedCategory || v.category === selectedCategory)
          .slice(0, visibleCount) // ✅ show limited videos
          .map((v) => (
            <motion.div
              key={v.id}
              whileHover={{ scale: 1.05 }}
              className="relative overflow-hidden transition border border-gray-800 rounded-lg bg-gray-900/80 hover:border-pink-600"
            >
              <div
                className="relative cursor-pointer"
                onClick={() => {
                  if (!accessExpiry || timeLeft === "Expired") {
                    if (paidInfo?.wallet && paidInfo?.amount) {
                      setShowTransactions(true);
                    } else {
                      setShowLockedModal(true);
                    }
                  } else {
                    navigate(`/embed/${v.id}`);
                  }
                }}
              >
                {v.thumbnail ? (
                  <img
                    src={v.thumbnail}
                    alt={v.description}
                    className="object-cover w-full aspect-video"
                  />
                ) : (
                  <div className="flex items-center justify-center w-full text-gray-500 bg-gray-800 aspect-video">
                    No Thumbnail
                  </div>
                )}
                <span className="absolute top-0 right-0 px-2 py-1 text-xs font-medium text-white bg-pink-600 rounded-bl-lg">
                  EXCLUSIVE
                </span>
              </div>
              <div className="px-2 py-3 text-sm">
                
                <p className="text-gray-300 truncate">{v.description}</p>
                <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                  <span>{formatViews(v.views ?? 0)} views</span>
                  <span>{v.duration || "N/A"}</span>
                </div>
              </div>
            </motion.div>
          ))}
      </motion.div>

      {/* ✅ Load More Button */}
      {visibleCount <
        exclusiveVideos.filter(
          (v) => !selectedCategory || v.category === selectedCategory
        ).length && (
        <div className="flex justify-center mt-8">
          <button
            onClick={() => setVisibleCount((prev) => prev + 10)}
            className="px-4 py-2 text-white transition border border-pink-600 rounded hover:bg-pink-600"
          >
            Load More
          </button>
        </div>
        
      )}
      
    </>
    
  )}
</div>
<Footer/>

   
{showTransactions && user?.uid && (
  <div className="px-4 pb-10 sm:px-6 lg:px-10">
    <h2 className="mb-4 text-xl font-bold text-pink-500">Pending / Processing Transactions</h2>
    <Transactions userId={user.uid} />
    <button
      onClick={() => setShowTransactions(false)}
      className="px-4 py-2 mt-4 text-sm font-medium text-white bg-pink-600 rounded-lg hover:bg-pink-700"
    >
      Close
    </button>
  </div>
)}



      {/* Locked Modal */}
      {showLockedModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="p-6 text-center bg-gray-900 border border-gray-700 rounded-2xl">
            <h2 className="mb-3 text-lg font-semibold text-pink-500">Access Required</h2>
            <p className="mb-4 text-sm text-gray-300">Your premium access has expired or isn’t active. Please top up to unlock exclusive videos.</p>
            <button onClick={() => { setShowLockedModal(false); setShowTopUp(true); }} className="px-4 py-2 text-sm font-medium text-white bg-pink-600 rounded-lg hover:bg-pink-700">Top Up Now</button>
          </div>
        </div>
      )}

      {/* Top-Up Modal */}
      {showTopUp && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="relative p-6 bg-gray-900 border border-gray-700 shadow-xl w-96 rounded-2xl">
            <button onClick={() => { setShowTopUp(false); setSelectedWallet(null); setSelectedRate(null); }} className="absolute text-gray-400 transition top-3 right-3 hover:text-pink-500">✕</button>
            <h2 className="mb-4 text-lg font-semibold text-center text-pink-500">Top Up Balance</h2>

            {!selectedWallet && (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-center text-gray-300">Choose your e-wallet:</p>
                <div className="flex justify-center gap-4 mt-2">
                  <img src="/e-wallet/gcash.png" alt="GCash" onClick={() => setSelectedWallet("gcash")} className="object-contain w-24 h-24 p-2 transition-all duration-200 border cursor-pointer rounded-xl hover:border-pink-500 hover:scale-105" />
                  <img src="/e-wallet/maya.png" alt="Maya" onClick={() => setSelectedWallet("maya")} className="object-contain w-24 h-24 p-2 transition-all duration-200 border cursor-pointer rounded-xl hover:border-pink-500 hover:scale-105" />
                </div>
                {user && <Transactions userId={user.uid} />}
              </div>
            )}

            {selectedWallet && !selectedRate && (
              <div className="mt-4">
                <p className="mb-2 text-sm text-center text-gray-300">Select a rate:</p>
                <div className="flex flex-col gap-3">
                  {rates.map((r, i) => (
                    <button key={i} onClick={() => setSelectedRate(r)} className="px-4 py-2 text-sm font-medium text-white transition-all border rounded-lg hover:bg-pink-600 hover:border-pink-600">
                      ₱{r.price} ({r.description})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedWallet && selectedRate && (
              <div className="flex flex-col items-center mt-4 text-center">
                <img src={`/e-wallet/${selectedWallet}.png`} alt={selectedWallet} className="object-contain mb-4 rounded-xl w-28 h-28" />
                <p className="text-sm text-gray-300">Selected: <span className="font-semibold text-white capitalize">{selectedWallet}</span></p>
                <p className="text-sm text-gray-400">Access Validity: <span className="font-semibold text-white">{selectedRate.description}</span></p>
                <p className="text-sm text-gray-400">Amount to Pay: <span className="font-semibold text-white">₱{selectedRate.price}</span></p>
                <button onClick={handlePaymentSuccess} className="px-6 py-2 mt-4 text-sm font-medium text-white transition-all duration-200 rounded-lg shadow-lg bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-700 hover:to-fuchsia-700">Pay Now</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      <AnimatePresence>
        {showReceiptModal && (
          <ReceiptModal show={showReceiptModal} onClose={() => setShowReceiptModal(false)} userId={user?.uid || guestId} wallet={paidInfo.wallet} amount={paidInfo.amount} expiry={accessExpiry} />
        )}
      </AnimatePresence>
    </div>
  );
  
};

export default Exclusive;
