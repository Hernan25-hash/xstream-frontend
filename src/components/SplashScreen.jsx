import React, { useEffect } from "react";
import logoImage from "../assets/logo.png";

const SplashScreen = ({ onDone }) => {
  // Simulate loading for 2 seconds, then call onDone
  useEffect(() => {
    const timer = setTimeout(onDone, 2000);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <div className="splash-screen-container">
      <img
        src={logoImage}
        alt="XStream Secrets Logo"
        className="splash-logo"
      />
      <h1 className="splash-title">
        XStream (18+)
      </h1>
      <p className="splash-subtitle">
        Welcome to XStream, the adult video embed platform.
      </p>
      <p className="splash-warning">
        <strong>Warning:</strong> This platform is for adults (18+) only.
      </p>
      {/* Loading bar */}
      <div className="splash-loading-bar-container">
        <div className="splash-loading-bar" />
      </div>
      <style>{`
        .splash-screen-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: #000;
          color: #fff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 20px; /* Added padding */
          box-sizing: border-box;
          overflow: hidden;
        }
        .splash-logo {
          width: min(90vw, 340px);
          border-radius: 24px;
          box-shadow: 0 2px 16px #0008;
          margin-bottom: 32px;
          max-width: 100%;
          display: block;
        }
        .splash-title {
          color: #d7263d;
          margin-bottom: 12px;
          font-size: 40px;
          font-weight: 700;
          text-align: center;
        }
        .splash-subtitle {
          font-size: 20px;
          margin-bottom: 0;
          text-align: center;
        }
        .splash-warning {
          font-size: 15px;
          color: #d7263d;
          margin-top: 32px;
          text-align: center;
        }
        .splash-loading-bar-container {
          width: 180px;
          height: 10px;
          background: #222;
          border-radius: 8px;
          margin-top: 40px;
          overflow: hidden;
          box-shadow: 0 2px 12px #0006;
        }
        .splash-loading-bar {
          height: 100%;
          width: 0%;
          background: linear-gradient(90deg, #d7263d 40%, #ff4e8e 100%);
          border-radius: 8px;
          animation: splash-bar-load 2s linear forwards;
        }
        @keyframes splash-bar-load {
          from { width: 0%; }
          to { width: 100%; }
        }
        @media (max-width: 600px) {
          .splash-logo {
            width: 80vw;
            max-width: 220px; /* Adjusted for better visibility */
            margin-bottom: 24px;
          }
          .splash-title {
            font-size: 28px;
          }
          .splash-subtitle {
            font-size: 16px;
          }
           .splash-warning {
            font-size: 14px;
            margin-top: 24px;
          }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
