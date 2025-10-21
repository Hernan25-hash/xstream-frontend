// src/pages/Sponsored.jsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const Sponsored = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const targetId = location.state?.videoId;
  if (!targetId) {
    navigate("/", { replace: true });
    return null;
  }

  const handleContinue = () => {
    localStorage.setItem("xstream-sponsored-cooldown", Date.now());
    navigate(`/embed/${targetId}`, { replace: true });
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen px-4 py-8 space-y-8 bg-gray-900">
      
      {/* ✅ Fixed TopNav with Continue Button */}
      <div className="fixed top-0 left-0 z-50 flex items-center justify-between w-full px-6 py-3 bg-gray-800 shadow-lg">
        <h1 className="text-lg font-semibold text-white">Click to Continue</h1>
        <button
          onClick={handleContinue}
          className="px-5 py-2 font-semibold text-white transition bg-pink-600 rounded-lg shadow hover:bg-pink-500"
        >
          Watch Here
        </button>
      </div>

      {/* Push content below TopNav */}
      <div className="pt-20"></div>

      {/* Logo */}
      <div className="flex justify-center w-full max-w-3xl">
        <img
          src="/videoAds/ACF.png"
          alt="ACF Logo"
          className="w-48 h-auto mb-4"
        />
      </div>

      {/* Video Ad */}
      <div className="flex flex-col items-center w-full max-w-3xl space-y-4">
        <div className="relative w-full overflow-hidden shadow-2xl rounded-2xl">
          <video
            src="/videoAds/ACF.mp4"
            autoPlay
            playsInline
            loop
            controls
            className="object-cover w-full h-auto rounded-2xl"
          />
        </div>

        {/* Description */}
       <div className="px-6 py-4 space-y-2 text-justify text-white bg-gray-800 rounded-lg shadow">
  <p className="text-base font-semibold">
    MAGLARO AT MAG ENJOY KASAMA ANG ATING IDOLO NA SI "BAYANI AGBAYANI" DITO LANG YAN SA SABONG INTERNATIONAL PH! 🥳
  </p>
  <p className="text-sm font-medium text-pink-400">
    Alternative links ACF and Lucky Sabong
  </p>
  <p className="text-xs text-gray-300">
    REGISTER NOW!👇👇👇
  </p>
  <a
    href="https://player88.tv/?ref=C-181C0131"
    target="_blank"
    rel="noopener noreferrer"
    className="inline-block px-5 py-2 text-sm font-semibold text-white transition bg-green-600 rounded-lg shadow hover:bg-green-500"
  >
    Register Here
  </a>
</div>

      </div>
    </div>
  );
};

export default Sponsored;
