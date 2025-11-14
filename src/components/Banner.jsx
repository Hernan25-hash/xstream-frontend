// src/components/Banner.jsx
import { useEffect, useState } from "react";

// Simple unique ID generator
const generateId = () => `banner-${Math.random().toString(36).substr(2, 9)}`;

const Banner = ({ containerId }) => {
  const [screen, setScreen] = useState("desktop");
  const [uniqueId] = useState(containerId || generateId()); // ✅ auto-generate if no containerId

  // Detect screen size
  useEffect(() => {
    const updateScreen = () => {
      const width = window.innerWidth;
      if (width < 640) setScreen("mobile");
      else if (width >= 640 && width < 1024) setScreen("tablet");
      else setScreen("desktop");
    };

    updateScreen();
    window.addEventListener("resize", updateScreen);
    return () => window.removeEventListener("resize", updateScreen);
  }, []);

  // Inject ad script
  useEffect(() => {
    const loadAd = () => {
      let script;

      if (screen === "mobile") {
        window.atOptions = {
          key: "efcd31c57765e76b909f9cc0a27c35ca",
          format: "iframe",
          height: 50,
          width: 320,
          params: {},
        };
        script = document.createElement("script");
        script.src =
          "//www.highperformanceformat.com/efcd31c57765e76b909f9cc0a27c35ca/invoke.js";
      } else if (screen === "tablet") {
        window.atOptions = {
          key: "78b1b47d524714a56f16dc601d742121",
          format: "iframe",
          height: 60,
          width: 468,
          params: {},
        };
        script = document.createElement("script");
        script.src =
          "//www.highperformanceformat.com/78b1b47d524714a56f16dc601d742121/invoke.js";
      } else {
        window.atOptions = {
          key: "4e1d95767d3d2bf1b94003676f576c54",
          format: "iframe",
          height: 90,
          width: 728,
          params: {},
        };
        script = document.createElement("script");
        script.src =
          "//www.highperformanceformat.com/4e1d95767d3d2bf1b94003676f576c54/invoke.js";
      }

      script.async = true;
      const container = document.getElementById(uniqueId);
      if (container) {
        container.innerHTML = "";
        container.appendChild(script);
      }
    };

    const timer = setTimeout(loadAd, 50);
    return () => clearTimeout(timer);
  }, [screen, uniqueId]);

  return (
    <div
      className="flex justify-center w-full mb-4"
      style={{
        marginTop: screen === "mobile" ? "1.5rem" : "1rem",
        zIndex: 40,
      }}
    >
      <div
        id={uniqueId}
        className="flex items-center justify-center p-2 sm:p-3 w-full max-w-[728px]"
        style={{
          minHeight: screen === "mobile" ? "70px" : "90px",
        }}
      ></div>
    </div>
  );
};

export default Banner;
