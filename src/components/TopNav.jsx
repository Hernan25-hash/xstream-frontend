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
      <div className="fixed top-0 left-0 z-50 w-full px-3 py-2 bg-black shadow-md sm:py-3">
        <div className="flex flex-col items-center justify-between gap-2 mx-auto max-w-7xl sm:flex-row">

          {/* Logo on left */}
          <div className="flex items-center flex-shrink-0">
            <img 
              src={logoImage} 
              alt="Logo" 
              className="w-auto select-none h-7 sm:h-9"
            />
          </div>

          {/* Nav links + search on right (desktop) */}
          <div className="flex flex-col items-center w-full gap-1 mt-1 sm:flex-row sm:items-center sm:gap-4 sm:w-auto sm:mt-0">

            {/* Nav Links */}
            <div className="relative flex gap-3">
              {navLinks.map(link => (
                <button
                  key={link}
                  onClick={() => handleNavClick(link)}
                  className="text-sm font-semibold text-gray-200 transition-colors hover:text-pink-600 sm:text-base"
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
                        className={`px-3 py-1 cursor-pointer text-white hover:bg-pink-600 rounded-md ${
                          selectedCategory === cat ? "bg-pink-600" : ""
                        }`}
                      >
                        {cat}
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-1 text-gray-400">No categories</div>
                  )}
                </div>
              )}
            </div>

            {/* Search Box */}
            <div className="w-full mt-1 sm:w-auto sm:mt-0">
              <input
                type="text"
                placeholder="Search by description..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full px-2 py-1 text-sm text-white placeholder-gray-400 transition bg-gray-800 border border-pink-600 rounded-lg sm:w-56 focus:outline-none focus:ring-2 focus:ring-pink-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Spacer div so fixed nav doesn't cover content */}
      <div className="h-14 sm:h-16"></div>
    </>
  );
};
