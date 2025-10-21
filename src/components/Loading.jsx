// src/components/Loading.jsx
import React from "react";

const Loading = () => {
  return (
    <div className="relative flex items-center justify-center min-h-screen bg-gray-900">
      {/* Shimmer Top Loading Line */}
      <div className="absolute top-0 left-0 w-full h-1 overflow-hidden bg-gray-700">
        <div className="w-1/3 h-1 bg-gradient-to-r from-pink-500 via-pink-400 to-pink-500 animate-shimmer"></div>
      </div>

      {/* Optional Centered Text */}
      <p className="text-lg font-medium text-white">Loading...</p>

      {/* Animation */}
      <style>
        {`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            50% { transform: translateX(100%); }
            100% { transform: translateX(100%); }
          }
          .animate-shimmer {
            animation: shimmer 1.5s ease-in-out infinite;
          }
        `}
      </style>
    </div>
  );
};

export default Loading;
