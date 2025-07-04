import React from "react";
import logoImage from "../assets/logo.png";

const Awareness = ({ onEnter, onExit }) => {
  console.log("Debug: Awareness component rendering. Logo path:", logoImage);

  return (
  <div
    className="awareness-splash"
    style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: '#000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      minHeight: '100vh',
      minWidth: '100vw',
      overflow: 'auto',
      margin: 0,
      padding: 0,
    }}
  >
    <div
      style={{
        color: '#fff',
        textAlign: 'center',
        maxWidth: 480,
        width: '95vw',
        background: '#000',
        borderRadius: 24,
        padding: '40px 24px',
        boxShadow: '0 4px 32px #000a',
        margin: '0 auto',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <img
        src={logoImage}
        alt="XStream Secrets Logo"
        style={{
          width: 'min(90vw, 320px)',
          height: 'auto',
          objectFit: 'contain',
          borderRadius: 24,
          marginBottom: 32,
          maxWidth: '100%',
          display: 'block',
          boxShadow: '0 2px 24px #000a',
        }}
      />
      <h3 style={{ color: '#fff', marginBottom: 24, fontSize: 28, fontWeight: 600 }}>Age Verification</h3>
      <p style={{ fontSize: 18, marginBottom: 24, textAlign: 'justify' }}>
        This website contains age-restricted materials including nudity and explicit depictions of sexual activity. By entering, you affirm that you are at least 18 years of age or the age of majority in your jurisdiction and you consent to viewing sexually explicit content.
      </p>
      <div
        style={{
          display: 'flex',
          flexWrap: 'nowrap',
          justifyContent: 'center',
          gap: 12,
          marginBottom: 16,
          width: '100%',
        }}
      >
        <button
          style={{
            background: '#d7263d',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '12px 32px',
            fontSize: 18,
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
          onClick={onEnter}
        >
          I am 18 or older - Enter
        </button>
        <button
          style={{
            background: 'transparent',
            color: '#fff',
            border: '2px solid #fff',
            borderRadius: 8,
            padding: '12px 32px',
            fontSize: 18,
            fontWeight: 600,
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
          onClick={onExit}
        >
          I am under 18 - Exit
        </button>
      </div>
      <p style={{ color: '#d7263d', marginTop: 16, fontWeight: 600 }}>
        <strong>Warning:</strong> This platform is for adults (18+) only.
      </p>
    </div>
    <style>{`
      @media (max-width: 600px) {
        .awareness-splash > div {
          padding: 18px 2vw !important;
          max-width: 99vw !important;
        }
        .awareness-splash img {
          width: 90vw !important;
          max-width: 220px !important;
          margin-bottom: 18px !important;
        }
        .awareness-splash h3 {
          font-size: 22px !important;
        }
        .awareness-splash p {
          font-size: 15px !important;
          text-align: justify !important;
        }
        .awareness-splash button {
          font-size: 15px !important;
          padding: 10px 8vw !important;
        }
        .awareness-splash div[style*="flex-wrap: nowrap"] {
          flex-direction: column !important;
          gap: 10px !important;
        }
      }
      body {
        background: #000 !important;
      }
    `}</style>
  </div>
);
};

export default Awareness;
