import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import SplashScreen from "./components/SplashScreen";
import Awareness from "./components/Awareness";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./admin/AdminPanel";
import Login from "./admin/Login";
import EmbedPage from "./components/EmbedPage";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute"; // ✅ new import

// 🚦 Route guard for 18+ check
const RequireAwareness = ({ children }) => {
  const progress = localStorage.getItem("xstream-progress");
  const location = useLocation();

  if (progress !== "dashboard") {
    return <Navigate to="/age-verification" state={{ from: location }} replace />;
  }
  return children;
};

function App() {
  const [showSplash, setShowSplash] = useState(true);

  // Splash complete handler
  const handleSplashDone = () => {
    setShowSplash(false);
    const progress = localStorage.getItem("xstream-progress");
    if (progress !== "dashboard") {
      window.history.replaceState({}, "", "/age-verification");
    }
  };

  // Awareness handlers
  const handleAwarenessEnter = () => {
    localStorage.setItem("xstream-progress", "dashboard");
    window.location.href = "/";
  };
  const handleAwarenessExit = () => {
    window.location.href = "https://www.google.com";
  };

  // Auto remove splash after 2.5s
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Router>
      <div className="bg-black text-white min-h-screen">
        {showSplash ? (
          <SplashScreen onDone={handleSplashDone} />
        ) : (
          <Routes>
            {/* 🧠 Age Verification */}
            <Route
              path="/age-verification"
              element={
                <Awareness
                  onEnter={handleAwarenessEnter}
                  onExit={handleAwarenessExit}
                />
              }
            />

            {/* 🏠 Dashboard */}
            <Route
              path="/"
              element={
                <RequireAwareness>
                  <Dashboard />
                </RequireAwareness>
              }
            />

            {/* 🔑 Admin Protected Route */}
            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute>
                  <AdminPanel />
                </ProtectedAdminRoute>
              }
            />

            {/* 🔐 Login (separate route for admins) */}
            <Route path="/login" element={<Login />} />

            {/* 🎥 Embed */}
            <Route
              path="/embed/:id"
              element={
                <RequireAwareness>
                  <EmbedPage />
                </RequireAwareness>
              }
            />

            {/* Default redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}

export default App;
