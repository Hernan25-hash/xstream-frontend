import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getFirestore, collection, onSnapshot } from "firebase/firestore";
import { app } from "../firebase";
import Footer from './Footer'; // Import the Footer component
import logoImage from '../assets/logo.png';  // Import logo

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
    <div className="top-nav-container">
      <div className="top-nav-wrapper">
        <div className="top-nav-content">
          <img src={logoImage} alt="Logo" style={{ height: 40 }} />
          <div className="dashboard-nav-links">
            {navLinks.map(link => (
              <a
                key={link}
                href="#"
                onClick={e => { e.preventDefault(); handleNavClick(link); }}
              >
                {link}
              </a>
            ))}
            {showCategories && (
              <div className="dashboard-category-dropdown">
                {availableCategories.map(cat => (
                  <div
                    key={cat}
                    className="dashboard-category-item"
                    onClick={() => { setSelectedCategory(cat); setShowCategories(false); }}
                    style={{ background: selectedCategory === cat ? "#e60073" : "transparent" }}
                  >
                    {cat}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="dashboard-search-bar">
          <input
            type="text"
            placeholder="Search by description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export function VideoGrid({ videos, navigate }) {
  return (
    <div className="video-grid">
      {videos.map((v, i) => (
        <div
          key={v.id || i}
          className="video-card"
          onClick={() => navigate(`/embed/${v.id}`)}
        >
          <div className="video-meta">
            Added: {v.added ? new Date(v.added).toLocaleString() : ""} | Category: <b>{v.category}</b>
          </div>
          <div className="video-thumb">
            <img src={v.thumbnail} alt="Video Thumbnail" className="video-preview" />
          </div>
          <div className="video-desc">
            <div className="video-desc-text">{v.description}</div>
          </div>
        </div>
      ))}
      <style>{`
        .top-nav-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          background: #000;
          box-shadow: 0 2px 12px #0008;
          z-index: 100;
          padding: 12px 24px;
          box-sizing: border-box;
          display: flex;
          justify-content: center;
        }
        .top-nav-wrapper {
          width: 100%;
          max-width: 1600px; /* Consistent with video-grid */
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .top-nav-content {
          display: flex;
          width: 100%;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }
        .dashboard-nav-links {
          display: flex;
          gap: 24px;
          position: relative;
        }
        .dashboard-nav-links a {
          color: #eaeaea;
          font-weight: 600;
          text-decoration: none;
        }
        .dashboard-category-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: #181818;
          border-radius: 8px;
          box-shadow: 0 4px 16px #000a;
          padding: 8px 0;
          margin-top: 4px;
        }
        .dashboard-category-item {
          padding: 10px 28px;
          color: #fff;
          cursor: pointer;
          font-size: 16px;
        }
        .dashboard-search-bar {
          margin-top: 12px;
          display: flex;
          align-items: center;
          background: #16171b;
          border-radius: 10px;
          border: 1.5px solid #e60073;
          padding: 0 10px;
          height: 36px;
          width: 100%;
          max-width: 500px;
        }
        .dashboard-search-bar input {
          background: transparent;
          border: none;
          outline: none;
          color: #fff;
          font-size: 15px;
          flex: 1;
        }

        .video-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          width: 100%;
          max-width: 1600px;
          margin: 0 auto;
        }
        .video-card {
          background: #181818;
          border-radius: 8px;
          padding: 8px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: none;
        }
        .video-card:hover {
          transform: scale(1.02);
          box-shadow: 0 0 0 2px #e60073, 0 6px 12px #0006;
        }
        .video-meta {
          margin-bottom: 8px;
          color: #e60073;
          font-size: 13px;
        }
        .video-thumb {
          position: relative;
          width: 100%;
          aspect-ratio: 16/9;
          background: #000;
          border-radius: 8px;
          overflow: hidden;
        }
        .video-preview {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          background: #000;
          border-radius: 8px;
        }
        .video-desc {
          margin-top: 8px;
          color: #fff;
          font-size: 15px;
          text-align: left;
        }
        .video-desc-text {
          color: #ccc;
          font-size: 13px;
          margin-top: 4px;
          line-height: 1.4;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          max-height: 2.8em;
        }
        @media (max-width: 1200px) {
          .video-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (max-width: 900px) {
          .video-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 600px) {
          .video-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}

const Dashboard = () => {
  const [showCategories, setShowCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [search, setSearch] = useState("");
  const [videos, setVideos] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [videosPerPage] = useState(12);
  const db = getFirestore(app);
  const navigate = useNavigate();

  useEffect(() => {
    const q = collection(db, "videos");
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const vids = [];
      querySnapshot.forEach((doc) => vids.push({ id: doc.id, ...doc.data() }));
      setVideos(vids);
      setCurrentPage(1); // Reset to first page on data change
    });
    return () => unsubscribe();
  }, [db]);

  const handleNavClick = (link) => {
    if (link === "HOME") {
      setSelectedCategory(null);
      setSearch("");
    } else if (link === "CATEGORIES") {
      setShowCategories(v => !v);
    }
  };

  const filteredVideos = videos.filter(v => {
    const matchCategory = selectedCategory ? v.category === selectedCategory : true;
    const matchSearch = search.trim() === "" ? true : (v.description || "").toLowerCase().includes(search.trim().toLowerCase());
    return matchCategory && matchSearch;
  });

  // Pagination Logic
  const indexOfLastVideo = currentPage * videosPerPage;
  const indexOfFirstVideo = indexOfLastVideo - videosPerPage;
  const currentVideos = filteredVideos.slice(indexOfFirstVideo, indexOfLastVideo);
  const totalPages = Math.ceil(filteredVideos.length / videosPerPage);

  const availableCategories = [...new Set(videos.map(v => v.category).filter(Boolean))];

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div style={{ background: "#111", color: "#fff", minHeight: "100vh", paddingTop: 150 }}>
      <TopNav 
        search={search}
        setSearch={setSearch}
        handleNavClick={handleNavClick}
        showCategories={showCategories}
        availableCategories={availableCategories}
        setSelectedCategory={setSelectedCategory}
        setShowCategories={setShowCategories}
        selectedCategory={selectedCategory}
      />

      {/* Main Video Content */}
      <div className="dashboard-content" style={{ padding: 24, boxSizing: "border-box" }}>
        {filteredVideos.length === 0 ? (
          <div style={{ color: "#aaa", fontSize: 16 }}>No videos found.</div>
        ) : (
          <>
            <VideoGrid videos={currentVideos} navigate={navigate} />
            {totalPages > 1 && (
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={paginate} />
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <nav className="pagination-container">
      <ul className="pagination">
        {currentPage > 1 && (
          <li className="page-item">
            <a onClick={() => onPageChange(currentPage - 1)} href="#!" className="page-link">
              &laquo; Prev
            </a>
          </li>
        )}
        {pageNumbers.map(number => (
          <li key={number} className={`page-item ${currentPage === number ? "active" : ""}`}>
            <a onClick={() => onPageChange(number)} href="#!" className="page-link">
              {number}
            </a>
          </li>
        ))}
        {currentPage < totalPages && (
          <li className="page-item">
            <a onClick={() => onPageChange(currentPage + 1)} href="#!" className="page-link">
              Next &raquo;
            </a>
          </li>
        )}
      </ul>
      <style>{`
        .pagination-container {
          display: flex;
          justify-content: center;
          margin-top: 24px;
        }
        .pagination {
          display: flex;
          padding: 0;
          list-style: none;
        }
        .page-item .page-link {
          color: #e60073;
          padding: 8px 12px;
          text-decoration: none;
          transition: background-color .2s;
          border: 1px solid #e60073;
          margin: 0 4px;
          border-radius: 4px;
          cursor: pointer;
        }
        .page-item.active .page-link {
          background-color: #e60073;
          color: white;
        }
        .page-item:hover:not(.active) .page-link {
          background-color: #333;
        }
      `}</style>
    </nav>
  );
};

export default Dashboard;
