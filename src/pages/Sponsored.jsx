// src/pages/Sponsored.jsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

const promos = [
  {
    src: "/ads/promo.png",
    title: "LIPAT and GET FREE 500",
    link: "https://player88.tv/?ref=C-181C0131",
    content: [
      "MECHANICS",
      "LIPAT and GET FREE 500 — NO CASH-IN REQUIRED!",
      "1. Open to all new players from other playing app/site.",
      "2. Should register using the link below.",
      "3. After registering, please verify your account immediately.",
      "4. To qualify, simply provide a screenshot showing the app or site you previously played on.",
      "5. One account per device only. Can only claim once.",
      "6. You may claim your free 500 on our official FB PAGE or through our LIVECHAT found on the app.",
      "7. Giveaway betting requirement is x3 rollover. Example: Giveaway received 500 x3 = 1500 (Total required bet before withdrawal)",
    ],
  },
  {
    src: "/ads/promo2.jpg",
    title: "RAFFLE BONANZA",
    link: "https://player88.tv/?ref=C-181C0131",
    content: [
      "MECHANICS",
      "Raffle Bonanza — 10 winners will be picked to win 1,000 credits every hour!",
      "Draw Period: October 10, 2025 at 6PM to October 17, 2025 at 6PM.",
      "Player will receive one (1) raffle ticket for every ₱100 bet, regardless of the game they play.",
      "Raffle draws will take place every hour. Each hourly draw will randomly select ten (10) lucky winners. Each winner will be awarded 1,000 credits.",
      "A player can only win once per draw; multiple wins within the same draw are not permitted.",
      "Only tickets generated up to the 55th minute of each hour will be eligible for that hour’s draw.",
      "Promo period: OCTOBER 9, 2025 UNTIL FURTHER NOTICE",
    ],
  },
];

const Sponsored = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const targetId = location.state?.videoId;
  if (!targetId) {
    navigate("/", { replace: true });
    return null;
  }

  const [modalOpen, setModalOpen] = useState(false);
  const [currentPromo, setCurrentPromo] = useState(null);

  const handleView = (promo) => {
    setCurrentPromo(promo);
    setModalOpen(true);
  };

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

      {/* Promo Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {promos.map((promo, idx) => (
          <div
            key={idx}
            className="relative flex flex-col items-center w-full max-w-sm mx-auto overflow-hidden bg-gray-800 shadow-2xl rounded-2xl"
          >
            <img
              src={promo.src}
              alt={promo.title}
              className="object-contain w-full h-64 rounded-t-2xl"
            />
            <div className="flex flex-col items-center w-full px-4 py-4">
              <h2 className="mb-2 text-xl font-bold text-white">{promo.title}</h2>
              <div className="flex w-full space-x-2">
                <button
                  className="flex-1 px-4 py-2 font-semibold text-white transition bg-blue-600 rounded-lg shadow hover:bg-blue-500"
                  onClick={() => handleView(promo)}
                >
                  View
                </button>
                <a
                  href={promo.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-4 py-2 font-semibold text-center text-white transition bg-green-600 rounded-lg shadow hover:bg-green-500"
                >
                  Register
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalOpen && currentPromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-70">
          <div className="relative w-full max-w-3xl px-6 py-6 overflow-y-auto bg-gray-800 rounded-2xl shadow-2xl max-h-[90vh]">
            <button
              className="absolute text-2xl font-bold text-white top-4 right-4 hover:text-pink-500"
              onClick={() => setModalOpen(false)}
            >
              &times;
            </button>

            <img
              src={currentPromo.src}
              alt={currentPromo.title}
              className="object-contain w-full h-auto mb-4 rounded-2xl"
            />

            <div className="space-y-3 text-justify text-white">
              {currentPromo.content.map((line, idx) => (
                <p key={idx} className="text-sm text-gray-200">{line}</p>
              ))}
            </div>

            <a
              href={currentPromo.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full px-4 py-3 mt-6 font-semibold text-center text-white transition bg-green-600 rounded-lg shadow hover:bg-green-500"
            >
              Register Now
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sponsored;
