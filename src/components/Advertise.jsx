import React, { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "../firebase";
import { useNavigate } from "react-router-dom";

const Advertise = () => {
  const [user, setUser] = useState(null);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const navigate = useNavigate();

  // ✅ Fetch signed-in user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            setUser(userSnap.data());
          } else {
            setUser({
              displayName: currentUser.displayName || "Guest User",
              email: currentUser.email,
              photoURL: currentUser.photoURL || "/avatar/profile.png",
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        // Guest mode
        setUser({
          displayName: "Guest User",
          photoURL: "/avatar/profile.png",
        });
      }
    });

    return () => unsubscribe();
  }, [auth, db]);

  return (
    <div className="relative min-h-screen px-4 py-8 text-white bg-gray-900">
      {/* ✅ Fixed Back Icon */}
      <button
        onClick={() => navigate(-1)}
        className="fixed z-50 p-2 transition bg-gray-800 rounded-full shadow-lg top-4 left-4 hover:bg-pink-600"
        title="Go Back"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="max-w-3xl mx-auto">
        <h1 className="mb-6 text-3xl font-bold text-center text-pink-500">
          Advertise With Us
        </h1>

        <div className="p-6 bg-gray-800 shadow-lg rounded-2xl">
          {/* ✅ Header Section (row layout with avatar) */}
          {user && (
            <div className="flex items-center justify-center mb-8 space-x-4 text-center">
              
              {/* Profile Avatar */}
              <div className="relative flex items-center justify-center overflow-hidden rounded-full w-14 h-14 hover:ring-2 hover:ring-pink-600">
                <img
                  src={user.photoURL || user.avatar || "/avatar/profile.png"}
                  alt="User Avatar"
                  className="object-cover w-full h-full"
                />
              </div>

              <div className="text-left">
                <h2 className="text-base font-semibold text-white">
                  {user.displayName || user.username || "Guest User"}
                </h2>
                <p className="text-xs text-gray-400">Partnering with</p>
              </div>

              {/* Arrow Icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6 text-pink-500 animate-pulse"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>

              {/* XStream Logo */}
              <img
                src="/logo.png"
                alt="XStream Secrets Logo"
                className="w-20 h-auto"
              />
            </div>
          )}

          {/* ✅ Content */}
          <p className="mb-4 text-gray-300">
            Want to promote your brand or content? Partner with us to reach a
            growing audience of creative minds and professionals.
          </p>

          <ul className="pl-5 mb-6 space-y-1 text-gray-400 list-disc">
            <li>Feature your ad on our homepage</li>
            <li>Reach thousands of daily visitors</li>
            <li>Custom ad placement and analytics</li>
          </ul>

          {/* ✅ Replace Form Button with Telegram Button */}
<div className="flex justify-center mt-6">
  <a
    href="https://t.me/XStreamSecrets"
    target="_blank"
    rel="noopener noreferrer"
    className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white transition bg-pink-600 rounded-lg hover:bg-pink-700"
  >
    <img
      src="/social/telegram.png"
      alt="Telegram"
      className="w-5 h-5"
    />
    Message Us on <span className="text-blue-400">Telegram</span>
  </a>
</div>


        </div>
      </div>
    </div>
  );
};

export default Advertise;
