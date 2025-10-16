import React, { useEffect } from "react";
import logoImage from "../assets/logo.png";

const SplashScreen = ({ onDone }) => {
  useEffect(() => {
    const timer = setTimeout(onDone, 3000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-black via-gray-900 to-black text-white z-[2000] p-6 overflow-hidden">
      {/* Logo */}
      <img
        src={logoImage}
        alt="XStream Secrets Logo"
        className="w-56 md:w-72 rounded-3xl shadow-[0_0_25px_rgba(255,255,255,0.1)] mb-8 select-none animate-fade-in"
      />

      {/* Title */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-red-500 tracking-wide mb-3 animate-slide-down">
        XStream (18+)
      </h1>

      {/* Subtitle */}
      <p className="text-gray-300 text-base sm:text-lg mb-2 animate-fade-in">
        Welcome to <span className="text-white font-semibold">XStream</span>, the adult video embed platform.
      </p>

      {/* Warning */}
      <p className="text-red-400 text-sm sm:text-base mt-4 text-center animate-fade-in">
        ⚠️ <strong>Warning:</strong> This platform is for adults (18+) only.
      </p>

      {/* Loading bar */}
      <div className="w-44 sm:w-56 h-3 bg-gray-800 rounded-full mt-10 overflow-hidden shadow-inner animate-fade-in">
        <div className="h-full bg-gradient-to-r from-red-600 to-pink-500 rounded-full animate-loading-bar" />
      </div>

      {/* Animations */}
      <style>
        {`
          @keyframes fade-in {
            0% { opacity: 0; transform: scale(0.98); }
            100% { opacity: 1; transform: scale(1); }
          }
          @keyframes slide-down {
            0% { opacity: 0; transform: translateY(-10px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          @keyframes loading-bar {
            0% { width: 0%; }
            100% { width: 100%; }
          }

          .animate-fade-in {
            animation: fade-in 1s ease-in-out forwards;
          }

          .animate-slide-down {
            animation: slide-down 0.8s ease-out forwards;
          }

          .animate-loading-bar {
            animation: loading-bar 2s linear forwards;
          }
        `}
      </style>
    </div>
  );
};

export default SplashScreen;
