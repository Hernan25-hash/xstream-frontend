import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, onSnapshot } from "firebase/firestore";
import { app } from "../firebase";
import Footer from "../components/Footer";
import { TopNav } from "../components/TopNav";

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
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const vids = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setVideos(vids);
      setCurrentPage(1);
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

  const indexOfLastVideo = currentPage * videosPerPage;
  const indexOfFirstVideo = indexOfLastVideo - videosPerPage;
  const currentVideos = filteredVideos.slice(indexOfFirstVideo, indexOfLastVideo);
  const totalPages = Math.ceil(filteredVideos.length / videosPerPage);
  const availableCategories = [...new Set(videos.map(v => v.category).filter(Boolean))];
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Extract iframe src from embed URL
  const getEmbedSrc = (url) => {
    if (!url) return "";
    const match = url.match(/src=['"]([^'"]+)['"]/);
    return match ? match[1] : url;
  };

  return (
    <div className="bg-gray-900 min-h-screen pt-28 text-white">
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

      <main className="max-w-[90rem] mx-auto px-4 py-6">
        {filteredVideos.length === 0 ? (
          <div className="text-gray-400 text-center py-20">No videos found.</div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
              {currentVideos.map(v => (
                <div
                  key={v.id}
                  className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform shadow-lg"
                  onClick={() => navigate(`/embed/${v.id}`)}
                >
                  <div className="relative aspect-video bg-black pointer-events-none">
                    <iframe
                      src={getEmbedSrc(v.url)}
                      title={v.description || "Video"}
                      className="w-full h-full border-0"
                      sandbox="allow-scripts allow-same-origin allow-presentation"
                      scrolling="no"
                      allowFullScreen
                    />
                    
                  </div>
                  <div className="p-3">
                    <div className="text-pink-500 text-xs mb-1">
                      Added: {v.added ? new Date(v.added).toLocaleString() : ""} | Category: <b>{v.category}</b>
                    </div>
                    <div className="text-gray-300 text-sm line-clamp-2">{v.description}</div>
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={paginate} />
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
};

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
  return (
    <nav className="flex justify-center mt-8">
      <ul className="flex space-x-2">
        {currentPage > 1 && (
          <li>
            <button onClick={() => onPageChange(currentPage - 1)} className="px-3 py-1 border border-pink-600 rounded text-pink-600 hover:bg-pink-600 hover:text-white transition">Prev</button>
          </li>
        )}
        {pageNumbers.map(n => (
          <li key={n}>
            <button
              onClick={() => onPageChange(n)}
              className={`px-3 py-1 border rounded transition ${
                currentPage === n ? "bg-pink-600 text-white border-pink-600" : "border-pink-600 text-pink-600 hover:bg-pink-600 hover:text-white"
              }`}
            >
              {n}
            </button>
          </li>
        ))}
        {currentPage < totalPages && (
          <li>
            <button onClick={() => onPageChange(currentPage + 1)} className="px-3 py-1 border border-pink-600 rounded text-pink-600 hover:bg-pink-600 hover:text-white transition">Next</button>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Dashboard;
