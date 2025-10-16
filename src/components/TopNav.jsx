import React from "react";
import logoImage from '../assets/logo.png';

const navLinks = ["HOME", "CATEGORIES"];

export const TopNav = ({ 
  search, 
  setSearch, 
  handleNavClick, 
  showCategories, 
  availableCategories, 
  setSelectedCategory, 
  setShowCategories,
  selectedCategory
}) => {
  return (
    <>
      <div className="fixed top-0 left-0 w-full bg-black shadow-md z-50 px-4 py-3 sm:py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">

          {/* Logo on left */}
          <div className="flex items-center flex-shrink-0">
            <img 
              src={logoImage} 
              alt="Logo" 
              className="h-8 sm:h-10 w-auto select-none"
            />
          </div>

          {/* Nav links + search on right (desktop) */}
          <div className="flex flex-col sm:flex-row items-center sm:items-center gap-2 sm:gap-6 w-full sm:w-auto mt-2 sm:mt-0">

            {/* Nav Links */}
            <div className="relative flex gap-4">
              {navLinks.map(link => (
                <button
                  key={link}
                  onClick={() => handleNavClick(link)}
                  className="text-gray-200 font-semibold hover:text-pink-600 transition-colors"
                >
                  {link}
                </button>
              ))}

              {/* Categories Dropdown */}
              {showCategories && (
                <div className="absolute top-full left-0 bg-gray-900 rounded-md shadow-lg mt-1 min-w-[150px] max-h-60 overflow-auto z-50">
                  {availableCategories.length > 0 ? (
                    availableCategories.map(cat => (
                      <div
                        key={cat}
                        onClick={() => { setSelectedCategory(cat); setShowCategories(false); }}
                        className={`px-4 py-2 cursor-pointer text-white hover:bg-pink-600 rounded-md ${
                          selectedCategory === cat ? "bg-pink-600" : ""
                        }`}
                      >
                        {cat}
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-gray-400">No categories</div>
                  )}
                </div>
              )}
            </div>

            {/* Search Box */}
            <div className="w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search by description..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full sm:w-64 px-3 py-2 rounded-lg bg-gray-800 border border-pink-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-600 transition"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Spacer div so fixed nav doesn't cover content */}
      <div className="h-16 sm:h-20"></div>
    </>
  );
};
