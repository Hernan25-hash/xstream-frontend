import { useEffect } from "react";

const SocialBar = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "//pl27867228.effectivegatecpm.com/2d/85/6f/2d856f6c6074fb8a74c6ead4b4a48d4f.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return null; // 🧹 No container — script only
};

export default SocialBar;
