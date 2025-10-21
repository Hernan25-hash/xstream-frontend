import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFirestore, collection, onSnapshot, doc, getDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth"; // ✅ import auth functions
import { app } from "../firebase";
import Footer from "../components/Footer";
import { TopNav } from "../components/TopNav";
import Banner from "../components/Banner";
import NativeBannerModal from "../components/NativeBannerModal";
import SocialBar from "../components/SocialBar";

const formatViews = (num = 0) => {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return num.toString();
};
// ✅ Shuffle helper for randomizing array
const shuffleArray = (array) => {
  const arr = [...array]; // copy to avoid mutating original
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// ✅ Skeleton component for loading state
const VideoSkeleton = () => (
  <div className="overflow-hidden bg-gray-800 shadow-lg animate-pulse">
    <div className="w-full bg-gray-700 rounded-t aspect-video"></div>
    <div className="p-2 space-y-2">
      <div className="w-3/4 h-3 bg-gray-600 rounded"></div>
      <div className="w-1/2 h-3 bg-gray-600 rounded"></div>
    </div>
  </div>
);

const Dashboard = () => {
  const [showCategories, setShowCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [search, setSearch] = useState("");
  const [videos, setVideos] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [videosPerPage] = useState(12);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null); // ✅ authenticated user
  const db = getFirestore(app);
  const auth = getAuth(app); // ✅ auth instance
  const navigate = useNavigate();
// ✅ Listen for authenticated user (guests allowed)
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
    if (currentUser) {
      try {
        // Fetch user data from Firestore
        const userRef = doc(db, "users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUser(userSnap.data());
        } else {
          console.warn("No user data found in Firestore.");
          setUser({
            uid: currentUser.uid,
            email: currentUser.email,
            provider: currentUser.providerData[0]?.providerId || "email",
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          provider: currentUser.providerData[0]?.providerId || "email",
        });
      }
    } else {
      // ✅ Allow guests (no redirect)
      setUser(null);
    }
  });

  return () => unsubscribe();
}, [auth, db]);

// ✅ Fetch videos (intact)
useEffect(() => {
  const q = collection(db, "videos");
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const vids = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    const shuffledVids = shuffleArray(vids); // ✅ shuffle videos
    setVideos(shuffledVids);
    setCurrentPage(1);
    setLoading(false);
  });

  return () => unsubscribe();
}, [db]);



  const handleNavClick = (link) => {
    if (link === "HOME") {
      setSelectedCategory(null);
      setSearch("");
    } else if (link === "CATEGORIES") {
      setShowCategories(v => !v);
    } else if (link === "TOP RATED") {
      navigate("/toprated");
    } else if (link === "MOST VIEWED") {
      navigate("/mostviewed");
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
        user={user} // ✅ pass user to TopNav
      />

      <Banner />

      <main className="max-w-[90rem] mx-auto px-4 pt-2 pb-6">
        {filteredVideos.length === 0 && !loading ? (
          <div className="py-20 text-center text-gray-400">No videos found.</div>
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {loading
              ? Array.from({ length: videosPerPage }).map((_, idx) => <VideoSkeleton key={idx} />)
              : currentVideos.map(v => (
                  <div
                    key={v.id}
                    className="overflow-hidden transition-transform bg-gray-800 shadow-lg cursor-pointer hover:scale-105"
                    onClick={() => navigate("/sponsored", { state: { videoId: v.id, user } })} // ✅ pass user along
                  >
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
                      {v.duration && (
                        <span className="absolute bottom-1 left-1 px-2 py-0.5 text-xs font-semibold text-white">
                          {v.duration}
                        </span>
                      )}
                    </div>

                    <div className="p-2">
                      <div className="text-[10px] text-gray-300 line-clamp-2">{v.description}</div>
                      <div className="flex items-center gap-1 mt-0.5 text-[10px] text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>{formatViews(v.views ?? 0)}</span>
                      </div>
                    </div>
                  </div>
              ))}
          </div>
        )}

        {!loading && totalPages > 1 && (
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={paginate} />
        )}
      </main>

      <Footer />
      <NativeBannerModal cooldown={120000} />
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
