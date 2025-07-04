import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SplashScreen from './components/SplashScreen';
import Awareness from './components/Awareness';
import Dashboard from './components/Dashboard';
import AdminPanel from './admin/AdminPanel';
import Login from './admin/Login';
import EmbedPage from './components/EmbedPage'; // ✅ added this

const LoginWrapper = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => 
    localStorage.getItem("xstream-admin-loggedin") === "true"
  );

  const handleSuccess = () => {
    localStorage.setItem("xstream-admin-loggedin", "true");
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("xstream-admin-loggedin");
    setIsLoggedIn(false);
  };

  return isLoggedIn ? 
    <AdminPanel onLogout={handleLogout} /> : 
    <Login onSuccess={handleSuccess} />;
};

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [showAwareness, setShowAwareness] = useState(() => {
    const progress = localStorage.getItem('xstream-progress');
    return progress !== 'dashboard';
  });
  const [showDashboard, setShowDashboard] = useState(() => {
    const progress = localStorage.getItem('xstream-progress');
    return progress === 'dashboard';
  });

  const handleSplashDone = () => {
    if (localStorage.getItem('xstream-progress') === 'dashboard') {
      setShowSplash(false);
      setShowAwareness(false);
      setShowDashboard(true);
    } else {
      setShowSplash(false);
      setShowAwareness(true);
      setShowDashboard(false);
      localStorage.setItem('xstream-progress', 'awareness');
    }
  };

  const handleAwarenessEnter = () => {
    setShowAwareness(false);
    setShowDashboard(true);
    localStorage.setItem('xstream-progress', 'dashboard');
  };

  const handleAwarenessExit = () => window.location.href = 'https://www.google.com';

  useEffect(() => {
    const progress = localStorage.getItem('xstream-progress');
    if (progress === 'dashboard') {
      setShowAwareness(false);
      setShowDashboard(true);
    }
  }, []);

  return (
    <Router>
      {showSplash && <SplashScreen onDone={handleSplashDone} />}
      {!showSplash && showAwareness && (
        <Awareness onEnter={handleAwarenessEnter} onExit={handleAwarenessExit} />
      )}
      {!showSplash && showDashboard && (
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/admin" element={<LoginWrapper />} />
          <Route path="/login" element={<LoginWrapper />} />
          <Route path="/embed/:id" element={<EmbedPage />} />
        </Routes>
      )}
    </Router>
  );
}

export default App;
