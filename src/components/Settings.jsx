import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged, deleteUser, signOut } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { TopNav } from "./TopNav";
import Footer from "./Footer";
import SearchResultsModal from "../components/SearchResultsModal";
import { app } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";

const Settings = () => {
  const auth = getAuth(app);
  const db = getFirestore(app);
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [popup, setPopup] = useState({ show: false, message: "", type: "success" });

  // 🧠 Fetch current user info
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : {};

        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email,
          provider: firebaseUser.providerData[0]?.providerId || "email",
          username: userData.username || firebaseUser.displayName || "Guest",
          accountType: userData.accountType || "free",
          avatar:
            userData.avatar ||
            firebaseUser.photoURL ||
            "/avatar/profile.png", // ✅ fallback image
        });
      } else {
        navigate("/");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, db, navigate]);

  const guestId = useMemo(() => {
    let id = localStorage.getItem("xstreamGuestId");
    if (!id) {
      id = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("xstreamGuestId", id);
    }
    return id;
  }, []);

  // 🧩 Popup feedback handler
  const showPopup = (message, type = "success") => {
    setPopup({ show: true, message, type });
    setTimeout(() => setPopup({ show: false, message: "", type: "success" }), 2000);
  };

  // 🚪 Logout
  const handleLogout = async () => {
    await signOut(auth);
    showPopup("Logged out successfully!", "success");
    setTimeout(() => navigate("/"), 1000);
  };

  // ❌ Delete Account
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete your account permanently?")) return;
    try {
      await deleteUser(auth.currentUser);
      showPopup("Account deleted", "success");
      setTimeout(() => navigate("/"), 1000);
    } catch (err) {
      console.error("Error deleting account:", err);
      showPopup("Failed to delete account", "error");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-300 bg-gray-900">
        Loading settings...
      </div>
    );
  }

  return (
    <>
      {/* 🌸 Top Navigation */}
      <TopNav
        user={user}
        search={search}
        setSearch={(val) => {
          setSearch(val);
          setShowSearchModal(val.trim().length > 0);
        }}
      />

      {/* 🔍 Search Modal */}
      {showSearchModal && (
        <SearchResultsModal
          searchTerm={search}
          userId={user?.id || guestId}
          onClose={() => setShowSearchModal(false)}
          onSelect={(videoId) => {
            setShowSearchModal(false);
            navigate(`/embed/${videoId}`);
          }}
        />
      )}

      {/* ⚙️ Settings Page */}
      <div className="min-h-screen px-4 py-8 pt-24 text-white bg-gray-900">
        <div className="max-w-2xl mx-auto">
          <h1 className="mb-6 text-3xl font-bold text-center text-pink-500">
            Settings
          </h1>

          <div className="p-6 space-y-6 bg-gray-800 border border-gray-700 shadow-xl rounded-2xl">
            {/* 🧑‍💼 User Info Section */}
            <div className="flex items-center gap-4 pb-4 border-b border-gray-700">
              <img
                src={user?.avatar || "/avatar/profile.png"}
                alt="User Avatar"
                className="object-cover w-16 h-16 border-2 border-pink-500 rounded-full shadow-md"
              />
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {user?.username || "Guest User"}
                </h2>
                <p className="text-sm text-gray-400">
                  {user?.email || "No email available"}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Account Type:{" "}
                  <span className="font-medium text-pink-500">
                    {user?.accountType || "free"}
                  </span>
                </p>
              </div>
            </div>

            {/* ⚙️ Action Buttons */}
            <div className="flex flex-col items-center gap-3 pt-4 border-t border-gray-700 sm:flex-row sm:justify-between">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-sm font-semibold text-gray-200 transition-all bg-gray-700 rounded-lg sm:w-auto hover:bg-gray-600"
              >
                Logout
              </button>

              <button
                onClick={handleDelete}
                className="w-full px-4 py-2 text-sm font-semibold text-white transition-all rounded-lg bg-gradient-to-r from-red-600 to-red-700 sm:w-auto hover:from-red-700 hover:to-red-800"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 💬 Popup Message */}
      <AnimatePresence>
        {popup.show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            className={`fixed z-50 px-6 py-3 text-white rounded-xl shadow-lg top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ${
              popup.type === "success" ? "bg-green-600" : "bg-red-600"
            }`}
          >
            {popup.message}
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </>
  );
};

export default Settings;
