// src/main.js
import React from "react";
import { createRoot } from "react-dom/client";
import RootApp from "./App.jsx"; // ✅ Use RootApp which wraps App in Router
import "./index.css"; // ✅ Tailwind directives imported here

// 🧠 Create root once
const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <RootApp />
    </React.StrictMode>
  );
}
