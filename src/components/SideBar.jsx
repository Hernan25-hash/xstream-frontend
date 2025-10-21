import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUserCircle, FaCog, FaBullhorn } from "react-icons/fa";
import logo from "../assets/logo.png";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const SideBar = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const [clickedName, setClickedName] = useState("");
  const [user, setUser] = useState(null); // store authenticated user
  const [loadingAuth, setLoadingAuth] = useState(true); // prevent premature popup

  const auth = getAuth();

  // ✅ Fetch current authenticated user from Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          name: firebaseUser.displayName,
          email: firebaseUser.email,
          avatar: firebaseUser.photoURL,
        });
      } else {
        setUser(null);
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
  }, [auth]);

  // ✅ Unified click handler
  const handleNavigate = (path, name) => {
    if (loadingAuth) return; // wait until auth check completes

    if (!user) {
      // Only show popup if truly unauthenticated
      setClickedName(name);
      setShowPopup(true);
      return;
    }

    // Authenticated → navigate immediately
    setIsOpen(false);
    setTimeout(() => navigate(path), 250);
  };

  // ✅ Close sidebar when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isOpen && !e.target.closest("#sidebar")) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, setIsOpen]);

  return (
    <>
      {/* Overlay Background */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 transition-opacity duration-300 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sidebar Container */}
      <div
        id="sidebar"
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-800 text-white shadow-2xl border-r border-gray-800 backdrop-blur-md transform transition-all duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } rounded-r-2xl`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <img
              src={logo}
              alt="Logo"
              className="object-contain select-none w-14 h-14"
            />
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-2xl transition hover:text-pink-500"
          >
            ✕
          </button>
        </div>

        {/* Main Menu */}
        <div className="flex flex-col gap-3 px-5 py-5 overflow-y-auto h-[calc(100%-140px)]">
          <button
            onClick={() => handleNavigate("/profile", "Profile")}
            className="flex items-center gap-4 px-3 py-3 text-lg transition rounded-lg hover:bg-pink-600/70"
          >
            <FaUserCircle className="text-xl" />
            <span>Profile</span>
          </button>

          <button
            onClick={() => handleNavigate("/settings", "Settings")}
            className="flex items-center gap-4 px-3 py-3 text-lg transition rounded-lg hover:bg-pink-600/70"
          >
            <FaCog className="text-xl" />
            <span>Settings</span>
          </button>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 w-full p-4 text-sm text-center text-gray-400 border-t border-gray-700">
          <button
            onClick={() => handleNavigate("/advertise", "Advertise")}
            className="flex items-center justify-center w-full gap-2 py-2 transition rounded-lg hover:bg-gray-700"
          >
            <FaBullhorn className="text-base text-pink-500" />
            <span>Advertise</span>
          </button>
          <p className="mt-3 text-xs text-gray-500">© 2025 XStream</p>
        </div>
      </div>

      {/* Popup Modal */}
      {showPopup && !loadingAuth && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-md">
          <div className="relative p-[2px] rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-pink-600 shadow-[0_0_30px_rgba(236,72,153,0.3)] animate-pulse-slow">
            <div className="relative p-6 text-center bg-gray-900 border border-gray-700 shadow-xl w-80 rounded-2xl">
              <button
                onClick={() => setShowPopup(false)}
                className="absolute text-gray-400 transition top-3 right-3 hover:text-pink-500"
              >
                ✕
              </button>

              <h2 className="mb-3 text-lg font-semibold text-pink-500">
                Only authenticated users can access
              </h2>

              <p className="mb-6 text-sm text-gray-300">
                You must sign up first to enter{" "}
                <span className="font-semibold text-white">{clickedName}</span>.
              </p>

              <button
                onClick={() => {
                  setShowPopup(false);
                  setTimeout(() => navigate("/signup"), 250);
                }}
                className="px-6 py-2 text-sm font-medium text-white transition-all duration-200 rounded-lg shadow-lg bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-700 hover:to-fuchsia-700 hover:shadow-pink-500/40"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SideBar;
