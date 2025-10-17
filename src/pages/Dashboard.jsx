import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, onSnapshot } from "firebase/firestore";
import { app } from "../firebase";
import Footer from "../components/Footer";
import { TopNav } from "../components/TopNav";
import Banner from "../components/Banner"; // ✅ Added Banner
import NativeBannerModal from "../components/NativeBannerModal";
import SocialBar from "../components/SocialBar";

const formatViews = (num = 0) => {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return num.toString();
};


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
    <div className="relative min-h-screen text-white bg-gray-900">

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

      {/* Banner placed immediately below TopNav */}
      <Banner />

      <main className="max-w-[90rem] mx-auto px-4 pt-2 pb-6">

        {filteredVideos.length === 0 ? (
          <div className="py-20 text-center text-gray-400">No videos found.</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
  {currentVideos.map(v => (
    <div
  key={v.id}
  className="overflow-hidden transition-transform bg-gray-800 shadow-lg cursor-pointer hover:scale-105"
  onClick={() => navigate("/sponsored", { state: { videoId: v.id } })}
>
  {/* Thumbnail with Duration Overlay */}
  <div className="relative">
    {v.thumbnail ? (
      <img
        src={v.thumbnail}
        alt={v.description || "Video Thumbnail"}
        className="object-cover w-full aspect-video"
      />
    ) : (
      <div className="w-full bg-black aspect-video" />
    )}

    {/* Duration (bottom-left inside image) */}
    {v.duration && (
      <span className="absolute bottom-1 left-1 px-2 py-0.5 text-xs font-semibold text-white">
         {v.duration}
      </span>
    )}
  </div>

  <div className="p-2">
  <div className="text-[10px] text-gray-300 line-clamp-2">{v.description}</div>


  {/* Views (compact layout) */}
  <div className="flex items-center gap-1 mt-0.5 text-[10px] text-gray-400">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-3 h-3"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
    <span>{formatViews(v.views ?? 0)}</span>

  </div>
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

      {/* Native Banner Modal */}
      <NativeBannerModal cooldown={120000} /> {/* 2-minute cooldown */}
      {/* Floating SocialBar */}
<SocialBar />

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
            <button onClick={() => onPageChange(currentPage - 1)} className="px-3 py-1 text-pink-600 transition border border-pink-600 rounded hover:bg-pink-600 hover:text-white">Prev</button>
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
            <button onClick={() => onPageChange(currentPage + 1)} className="px-3 py-1 text-pink-600 transition border border-pink-600 rounded hover:bg-pink-600 hover:text-white">Next</button>
          </li>
        )}
      </ul>
    </nav>
  );
};

export default Dashboard;
