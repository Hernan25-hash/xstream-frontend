// src/components/TopNav.jsx
import React, { useState, useMemo, useEffect } from "react"; // added useEffect
import { useNavigate, useLocation } from "react-router-dom";
import logoImage from "../assets/logo.png";
import SideBar from "./SideBar";
import Notifications from "./Notifications";
import Loading from "./Loading"; 
import SearchResultsModal from "./SearchResultsModal"; 

const navLinks = ["HOME", "CATEGORIES", "TOP RATED", "MOST VIEWED"];

export const TopNav = ({
  search = "",
  setSearch = () => {},
  showCategories = false,
  availableCategories = [],
  setSelectedCategory = () => {},
  setShowCategories = () => {},
  selectedCategory = null,
  user = null,
  loading = false,
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null); // added

  // ✅ Generate guestId for non-logged-in users
  const guestId = useMemo(() => {
    let id = localStorage.getItem("xstreamGuestId");
    if (!id) {
      id = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("xstreamGuestId", id);
    }
    return id;
  }, []);

  const handleNavClick = (link) => {
    switch (link) {
      case "HOME":
        setSelectedCategory(null);
        setSearch("");
        navigate("/");
        break;
      case "CATEGORIES":
        setShowCategories((v) => !v);
        break;
      case "TOP RATED":
        navigate("/toprated");
        break;
      case "MOST VIEWED":
        navigate("/mostviewed");
        break;
      default:
        break;
    }
  };

  const handleProfileClick = () => {
    if (!user) setShowPopup(true);
    else navigate("/profile");
  };

  const linkToRoute = {
    HOME: "/",
    "TOP RATED": "/toprated",
    "MOST VIEWED": "/mostviewed",
  };

  // ✅ useEffect to navigate only after modal closes
  useEffect(() => {
    if (!showSearchModal && selectedVideo) {
      navigate(`/embed/${selectedVideo}`);
      setSelectedVideo(null);
    }
  }, [showSearchModal, selectedVideo, navigate]);

  return (
    <>
      {/* === Fixed Top Header === */}
      <div className="fixed top-0 left-0 z-50 w-full bg-black shadow-md">
        {loading && <Loading />}
        <div className="relative flex items-center justify-between w-full px-3 py-2 mx-auto sm:py-3 max-w-7xl">
          {/* Sidebar Burger Button */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="flex items-center justify-center w-8 h-8 text-white rounded-md hover:bg-gray-800 sm:w-10 sm:h-10"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Centered Logo */}
          <div className="absolute transform -translate-x-1/2 left-1/2">
            <img
              src={logoImage}
              alt="Logo"
              className="w-auto select-none h-7 sm:h-9"
            />
          </div>

          {/* Right Section: Notifications + Profile */}
          <div className="relative flex items-center gap-3 sm:gap-4">
            <div className="relative">
              <button
                onClick={() => setShowNotificationMenu((prev) => !prev)}
                className="relative flex items-center justify-center w-8 h-8 text-white rounded-full hover:bg-gray-800"
              >
                <Notifications />
              </button>
              {showNotificationMenu && (
                <div className="absolute right-0 z-50 w-64 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-lg animate-fadeIn">
                  <div className="p-3 text-sm text-gray-300 border-b border-gray-700">
                    Notifications
                  </div>
                  <div className="overflow-y-auto max-h-56">
                    <div className="p-3 text-sm text-gray-400">
                      No new notifications
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar */}
            <div className="relative">
              <button
                onClick={handleProfileClick}
                className="flex items-center justify-center w-8 h-8 overflow-hidden rounded-full hover:ring-2 hover:ring-pink-600"
              >
                <img
                  src={user?.avatar || "/avatar/profile.png"}
                  alt="User Avatar"
                  className="object-cover w-full h-full"
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <SideBar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        navLinks={navLinks}
        handleNavClick={handleNavClick}
        selectedCategory={selectedCategory}
        showCategories={showCategories}
        setSelectedCategory={setSelectedCategory}
        setShowCategories={setShowCategories}
        availableCategories={availableCategories}
      />

      {/* Main Navigation + Search */}
      <div className="mt-16">
        <div className="flex flex-col items-center justify-between gap-2 mx-auto max-w-7xl sm:flex-row">
          <div className="flex flex-col items-center w-full gap-1 mt-1 sm:flex-row sm:items-center sm:gap-4 sm:w-auto sm:mt-0">
            {/* Nav Links */}
            <div className="relative flex gap-3">
              {navLinks.map((link) => (
                <button
                  key={link}
                  onClick={() => handleNavClick(link)}
                  className={`text-sm font-semibold sm:text-base transition-colors ${
                    linkToRoute[link] === location.pathname
                      ? "text-pink-600 underline underline-offset-4"
                      : "text-gray-200 hover:text-pink-600"
                  }`}
                >
                  {link}
                </button>
              ))}

              {/* Categories Dropdown */}
              {showCategories && (
                <div className="absolute top-full left-0 z-50 mt-1 bg-gray-900 rounded-md shadow-lg min-w-[160px] max-h-60 overflow-auto">
                  <div
                    onClick={() => {
                      setSelectedCategory(null);
                      setShowCategories(false);
                    }}
                    className={`px-3 py-1 cursor-pointer text-white hover:bg-pink-600 rounded-md ${
                      !selectedCategory ? "bg-pink-600" : ""
                    }`}
                  >
                    All
                  </div>
                  {availableCategories.length
                    ? availableCategories.map((cat) => (
                        <div
                          key={cat}
                          onClick={() => {
                            setSelectedCategory(cat);
                            setShowCategories(false);
                          }}
                          className={`px-3 py-1 cursor-pointer text-white hover:bg-pink-600 rounded-md ${
                            selectedCategory === cat ? "bg-pink-600" : ""
                          }`}
                        >
                          {cat}
                        </div>
                      ))
                    : (
                      <div className="px-3 py-1 text-gray-400">No categories</div>
                    )}
                </div>
              )}
            </div>

            {/* Search Box */}
            <div className="w-[91%] mx-auto mt-1 sm:w-56 sm:mt-0">
              <input
                type="text"
                placeholder="Search by description or category..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setShowSearchModal(true);
                }}
                className="w-full px-2 py-1 text-sm text-white placeholder-gray-400 transition bg-gray-800 border border-pink-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Search Results Modal */}
      {showSearchModal && (
        <SearchResultsModal
          searchTerm={search}
          userId={user?.id || guestId}
          onClose={() => setShowSearchModal(false)}
          onSelect={(videoId) => {
            setSelectedVideo(videoId); // store clicked video
            setShowSearchModal(false); // modal closes first
          }}
        />
      )}

      {/* Popup for Unauthenticated Users */}
      {showPopup && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-md animate-fadeIn">
          <div className="relative p-[2px] rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-pink-600 shadow-[0_0_25px_rgba(236,72,153,0.3)]">
            <div className="relative p-6 text-center bg-gray-900 border border-gray-700 shadow-2xl w-80 rounded-2xl">
              <button
                onClick={() => setShowPopup(false)}
                className="absolute text-gray-400 transition top-3 right-3 hover:text-pink-500"
              >
                ✕
              </button>
              <h2 className="mb-3 text-lg font-semibold text-pink-500">
                Only authenticated users can access
              </h2>
              <p className="mb-6 text-sm text-gray-300">
                You must sign up first to enter{" "}
                <span className="font-semibold text-white">Profile</span>.
              </p>
              <button
                onClick={() => {
                  setShowPopup(false);
                  setTimeout(() => navigate("/signup"), 250);
                }}
                className="px-6 py-2 text-sm font-medium text-white transition-all duration-200 rounded-lg shadow-lg bg-gradient-to-r from-pink-600 to-fuchsia-600 hover:from-pink-700 hover:to-fuchsia-700 hover:shadow-pink-500/40"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
