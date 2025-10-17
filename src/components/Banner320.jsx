import { useEffect } from "react";

const Banner320 = () => {
  useEffect(() => {
    // Clean any previous script
    const container = document.getElementById("banner320-container");
    if (container) container.innerHTML = "";

    // Define ad options
    window.atOptions = {
      key: "efcd31c57765e76b909f9cc0a27c35ca",
      format: "iframe",
      height: 50,
      width: 320,
      params: {},
    };

    // Create script
    const script = document.createElement("script");
    script.src =
      "//www.highperformanceformat.com/efcd31c57765e76b909f9cc0a27c35ca/invoke.js";
    script.async = true;

    // Append to container
    if (container) container.appendChild(script);

    // Cleanup on unmount
    return () => {
      if (container) container.innerHTML = "";
    };
  }, []);

  return (
    <div
      id="banner320-container"
      className="flex items-center justify-center bg-gray-900 rounded-lg shadow-lg"
      style={{
        width: "320px",
        height: "50px",
      }}
    ></div>
  );
};

export default Banner320;
