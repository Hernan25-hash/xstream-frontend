// src/components/Loading.jsx
import React from "react";

const Loading = () => {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden text-white bg-gradient-to-br from-gray-900 via-gray-950 to-black">
      {/* 🔹 Animated Gradient Line (Top Loader) */}
      <div className="absolute top-0 left-0 w-full h-1 overflow-hidden bg-gray-800/70">
        <div className="w-1/3 h-1 bg-gradient-to-r from-pink-500 via-fuchsia-500 to-pink-500 animate-shimmer"></div>
      </div>

      {/* 🔹 Center Logo */}
      <div className="flex flex-col items-center space-y-4">
        <div className="flex items-center justify-center w-20 h-20">
          <img
            src="/logo.png"
            alt="App Logo"
            className="object-contain w-full h-full animate-pulse drop-shadow-[0_0_12px_rgba(236,72,153,0.5)]"
          />
        </div>
        <p className="text-sm tracking-wide text-gray-300 uppercase">
          Loading your experience...
        </p>

        {/* 🔹 Modern Spinner */}
        <div className="w-8 h-8 mt-2 border-2 border-pink-500 rounded-full border-t-transparent animate-spin"></div>
      </div>

      {/* 🔹 Background gradient glow (modern touch) */}
      <div className="absolute w-[400px] h-[400px] bg-pink-500/20 rounded-full blur-3xl animate-pulse"></div>

      {/* ✨ Animations */}
      <style>
        {`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(100%); }
            100% { transform: translateX(100%); }
          }
          .animate-shimmer {
            animation: shimmer 1.6s ease-in-out infinite;
          }
        `}
      </style>
    </div>
  );
};

export default Loading;
