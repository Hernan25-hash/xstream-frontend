// src/App.jsx
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";

import SplashScreen from "./components/SplashScreen";
import Awareness from "./components/Awareness";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./admin/AdminPanel";
import Login from "./admin/Login";
import EmbedPage from "./components/EmbedPage";
import Sponsored from "./pages/Sponsored";
import TopRated from "./components/TopRated";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import MostViewed from "./components/MostViewed";
import Profile from "./components/Profile";
import Settings from "./components/Settings";
import Advertise from "./components/Advertise";
import SignUp from "./pages/SignUp";
import ResetPassword from "./pages/ResetPassword"; // ✅ Import ResetPassword

// 🚦 Route guard for 18+ check + deep link awareness
const RequireAwareness = ({ children }) => {
  const progress = localStorage.getItem("xstream-progress");
  const location = useLocation();

  if (progress !== "dashboard") {
    localStorage.setItem("xstream-intended-path", location.pathname);
    return <Navigate to="/age-verification" state={{ from: location }} replace />;
  }

  return children;
};

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);
  const navigate = useNavigate();

  // ✅ Splash complete handler
  const handleSplashDone = () => {
    setShowSplash(false);
    const progress = localStorage.getItem("xstream-progress");

    if (!progress) {
      localStorage.setItem("xstream-progress", "awareness");
      navigate("/age-verification", { replace: true });
    }
  };

  // ✅ Awareness handlers
  const handleAwarenessEnter = () => {
    localStorage.setItem("xstream-progress", "dashboard");
    const intendedPath = localStorage.getItem("xstream-intended-path");
    if (intendedPath) {
      navigate(intendedPath, { replace: true });
      localStorage.removeItem("xstream-intended-path");
    } else {
      navigate("/", { replace: true });
    }
  };

  const handleAwarenessExit = () => {
    window.location.href = "https://www.google.com";
  };

  // ✅ Auto remove splash after 2.5s
  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen text-white bg-black">
      {showSplash ? (
        <SplashScreen onDone={handleSplashDone} />
      ) : (
        <Routes>
          {/* Age Verification */}
          <Route
            path="/age-verification"
            element={
              <Awareness
                onEnter={handleAwarenessEnter}
                onExit={handleAwarenessExit}
              />
            }
          />

          {/* Dashboard */}
          <Route
            path="/"
            element={
              <RequireAwareness>
                <Dashboard />
              </RequireAwareness>
            }
          />

          {/* Top Rated */}
          <Route
            path="/toprated"
            element={
              <RequireAwareness>
                <TopRated />
              </RequireAwareness>
            }
          />

          {/* Most Viewed */}
          <Route
            path="/mostviewed"
            element={
              <RequireAwareness>
                <MostViewed />
              </RequireAwareness>
            }
          />

          {/* Profile */}
          <Route
            path="/profile"
            element={
              <RequireAwareness>
                <Profile />
              </RequireAwareness>
            }
          />

          {/* Settings */}
          <Route
            path="/settings"
            element={
              <RequireAwareness>
                <Settings />
              </RequireAwareness>
            }
          />

          {/* Advertise */}
          <Route
            path="/advertise"
            element={
              <RequireAwareness>
                <Advertise />
              </RequireAwareness>
            }
          />

          {/* Admin Protected */}
          <Route
            path="/admin"
            element={
              <ProtectedAdminRoute>
                <AdminPanel />
              </ProtectedAdminRoute>
            }
          />

          {/* Admin Login */}
          <Route path="/login" element={<Login />} />

          {/* Sponsored */}
          <Route
            path="/sponsored"
            element={
              <RequireAwareness>
                <Sponsored />
              </RequireAwareness>
            }
          />

          {/* Embed Page */}
          <Route
            path="/embed/:id"
            element={
              <RequireAwareness>
                <EmbedPage />
              </RequireAwareness>
            }
          />

          {/* Sign Up */}
          <Route
            path="/signup"
            element={
              <RequireAwareness>
                <SignUp />
              </RequireAwareness>
            }
          />

          {/* ✅ Reset Password */}
          <Route
            path="/reset-password"
            element={
              <RequireAwareness>
                <ResetPassword />
              </RequireAwareness>
            }
          />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </div>
  );
}

// ✅ RootApp wraps AppContent inside Router
export default function RootApp() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}
