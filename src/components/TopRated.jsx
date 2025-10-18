import React, { useEffect, useState } from "react";
import { getFirestore, collection, onSnapshot } from "firebase/firestore";
import { app } from "../firebase";
import { useNavigate } from "react-router-dom";
import { TopNav } from "../components/TopNav";
import Footer from "../components/Footer";
import Banner from "../components/Banner";

// Skeleton
const VideoSkeleton = () => (
  <div className="overflow-hidden bg-gray-800 rounded-lg shadow-lg animate-pulse">
    <div className="w-full bg-gray-700 rounded-t aspect-video"></div>
    <div className="p-2 space-y-2">
      <div className="w-3/4 h-3 bg-gray-600 rounded"></div>
      <div className="w-1/2 h-3 bg-gray-600 rounded"></div>
    </div>
  </div>
);

const TopRated = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(12);
  const [search, setSearch] = useState("");
  const [showCategories, setShowCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const navigate = useNavigate();
  const db = getFirestore(app);

  useEffect(() => {
    const q = collection(db, "videos");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const vids = snapshot.docs
        .map(doc => {
          const data = doc.data();
          const engagement = (data.hearts || 0) + (data.commentsCount || 0);
          return { id: doc.id, engagement, ...data };
        })
        .filter(v => v.engagement > 0) // ✅ Only videos with engagement
        .sort((a, b) => b.engagement - a.engagement); // ✅ Sort descending
      setVideos(vids);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [db]);

  const loadMore = () => setVisibleCount(prev => prev + 12);

  const handleNavClick = (link) => {
    if (link === "HOME") navigate("/");
    if (link === "CATEGORIES") setShowCategories(v => !v);
  };

  const availableCategories = [...new Set(videos.map(v => v.category).filter(Boolean))];

  const filteredVideos = videos.filter(v => {
    const matchCategory = selectedCategory ? v.category === selectedCategory : true;
    const matchSearch = search.trim() === "" ? true : (v.description || "").toLowerCase().includes(search.trim().toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="relative min-h-screen text-white bg-gray-900">

      {/* TopNav replaces back button */}
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

      <Banner />

      <main className="max-w-[90rem] mx-auto px-4 pt-6 pb-12">

        <h2 className="mb-4 text-2xl font-semibold">Top Rated Videos</h2>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {loading
            ? Array.from({ length: 12 }).map((_, idx) => <VideoSkeleton key={idx} />)
            : filteredVideos.slice(0, visibleCount).map(v => (
                <div
                  key={v.id}
                  className="overflow-hidden transition-transform bg-gray-800 shadow-lg cursor-pointer hover:scale-105"
                  onClick={() => navigate("/sponsored", { state: { videoId: v.id } })}
                >
                  <div className="relative">
                    {v.thumbnail ? (
                      <img
                        src={v.thumbnail}
                        alt={v.description || ""}
                        className="object-cover w-full aspect-video"
                      />
                    ) : (
                      <div className="w-full bg-black rounded-t-lg aspect-video" />
                    )}
                  </div>

                  {/* ✅ Uniform, justified, truncated description */}
                  <div className="text-[10px] text-gray-300 line-clamp-2">{v.description}</div>

                  <div className="flex items-center gap-2 text-[10px] text-gray-400 px-2 pb-2">
                    <span>❤️ {v.hearts || 0}</span>
                    <span>💬 {v.commentsCount || 0}</span>
                  </div>
                </div>
              ))}
        </div>

        {/* Load More Button */}
        {!loading && visibleCount < filteredVideos.length && (
          <div className="flex justify-center mt-6">
            <button
              onClick={loadMore}
              className="px-4 py-2 text-white transition "
            >
              Load More
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />

    </div>
  );
};

export default TopRated;
