import React from "react";
import logoImage from "../assets/logo.png";

const Awareness = ({ onEnter, onExit }) => {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-gradient-to-b from-black via-gray-900 to-black text-white min-h-screen w-full px-4">
      {/* Overlay container */}
      <div className="bg-black/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-800 max-w-lg w-full p-6 sm:p-8 md:p-10 text-center flex flex-col items-center">
        
        {/* Logo */}
        <img
          src={logoImage}
          alt="XStream Secrets Logo"
          className="w-48 sm:w-56 md:w-64 mb-6 rounded-2xl shadow-[0_0_25px_rgba(255,255,255,0.08)] select-none"
        />

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-4 text-red-500 tracking-wide">
          Age Verification
        </h1>

        {/* Description */}
        <p className="text-gray-300 text-sm sm:text-base md:text-lg leading-relaxed mb-8 sm:mb-10 text-justify">
          This website contains age-restricted materials including nudity and explicit depictions of sexual activity.
          By entering, you affirm that you are at least{" "}
          <strong>18 years of age</strong> (or the age of majority in your jurisdiction)
          and consent to viewing sexually explicit content.
        </p>

        {/* Buttons */}
        <div className="flex flex-row items-center justify-center gap-3 sm:gap-5 w-full flex-nowrap">
          <button
            onClick={onEnter}
            className="bg-red-600 hover:bg-red-700 transition-all duration-300 text-white font-semibold rounded-xl 
                       text-sm sm:text-base md:text-lg 
                       px-4 sm:px-6 md:px-10 py-2 sm:py-3 
                       shadow-lg hover:scale-105 active:scale-95"
          >
            ✅ I am 18 or older — Enter
          </button>

          <button
            onClick={onExit}
            className="border-2 border-gray-300 hover:border-red-500 hover:text-red-400 transition-all duration-300 text-white font-semibold rounded-xl 
                       text-sm sm:text-base md:text-lg 
                       px-4 sm:px-6 md:px-10 py-2 sm:py-3 
                       shadow-lg hover:scale-105 active:scale-95"
          >
            🚫 I am under 18 — Exit
          </button>
        </div>

        {/* Warning */}
        <p className="mt-8 text-red-500 font-semibold text-xs sm:text-sm uppercase tracking-wider">
          ⚠️ This platform is for adults (18+) only.
        </p>
      </div>
    </div>
  );
};

export default Awareness;
