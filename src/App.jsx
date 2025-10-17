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
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";

// 🚦 Route guard for 18+ check + deep link awareness
const RequireAwareness = ({ children }) => {
  const progress = localStorage.getItem("xstream-progress");
  const location = useLocation();

  // If user has not passed the age verification
  if (progress !== "dashboard") {
    // Save intended route before redirecting
    localStorage.setItem("xstream-intended-path", location.pathname);
    return <Navigate to="/age-verification" state={{ from: location }} replace />;
  }

  return children;
};

function App() {
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

    // If user had a saved target (like /embed/:id), go there
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

          {/* 🔐 Login */}
          <Route path="/login" element={<Login />} />

          {/* 🎁 Sponsored Page */}
          <Route
            path="/sponsored"
            element={
              <RequireAwareness>
                <Sponsored />
              </RequireAwareness>
            }
          />

          {/* 🎥 Embed Page (deep link support) */}
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
  );
}

// ✅ Wrap App with Router
export default function RootApp() {
  return (
    <Router>
      <App />
    </Router>
  );
}
