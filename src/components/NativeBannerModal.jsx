// src/components/NativeBannerModal.jsx
import { useEffect, useState } from "react";

const NativeBannerModal = ({ cooldown = 120000 }) => { // 2 minutes
  const [showModal, setShowModal] = useState(false);

  // Function to start cooldown
  const startCooldown = () => {
    const timer = setTimeout(() => setShowModal(true), cooldown);
    return () => clearTimeout(timer);
  };

  // Start initial cooldown on mount
  useEffect(() => {
    const cleanup = startCooldown();
    return cleanup;
  }, [cooldown]);

  // Inject ad script when modal is visible
  useEffect(() => {
    if (!showModal) return;

    const script = document.createElement("script");
    script.src = "//pl27861784.effectivegatecpm.com/28fa37fb77484587282bd4ad25c04dd2/invoke.js";
    script.async = true;
    script.setAttribute("data-cfasync", "false");

    const container = document.getElementById("container-28fa37fb77484587282bd4ad25c04dd2");
    if (container) container.appendChild(script);

    return () => {
      if (container) container.innerHTML = ""; // cleanup
    };
  }, [showModal]);

  // Handle close and start new cooldown
  const handleClose = () => {
    setShowModal(false);
    startCooldown();
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center transition-opacity bg-black/50 backdrop-blur-sm">
      <div className="relative w-11/12 max-w-md p-6 animate-fadeIn">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute z-50 text-2xl font-bold text-gray-400 transition top-3 right-3 hover:text-white"
        >
          &times;
        </button>

        {/* Ad container */}
        <div
          id="container-28fa37fb77484587282bd4ad25c04dd2"
          className="relative z-0 w-full h-auto"
        ></div>
      </div>
    </div>
  );
};

export default NativeBannerModal;
