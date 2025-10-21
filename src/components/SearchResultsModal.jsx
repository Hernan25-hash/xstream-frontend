import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const formatViews = (num = 0) => {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return num.toString();
};

// Skeleton for loading
const VideoSkeleton = () => (
  <div className="overflow-hidden bg-gray-800 rounded-lg shadow-lg animate-pulse">
    <div className="w-full bg-gray-700 rounded-t-lg aspect-video"></div>
    <div className="p-2 space-y-2">
      <div className="w-3/4 h-3 bg-gray-600 rounded"></div>
      <div className="w-1/2 h-3 bg-gray-600 rounded"></div>
    </div>
  </div>
);

const SearchResultsModal = ({ searchTerm, onClose, onSelect, userId }) => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(12); // initial number of videos visible

  useEffect(() => {
    if (!searchTerm.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, "videos"));
        const vids = [];
        snap.forEach((doc) => {
          const data = doc.data();
          if (
            data.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            data.category?.toLowerCase().includes(searchTerm.toLowerCase())
          ) {
            vids.push({ id: doc.id, ...data });
          }
        });
        setResults(vids);
      } catch (err) {
        console.error("Search fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [searchTerm]);

  // Handle click on video
  const handleClick = (videoId) => {
    if (onSelect) onSelect(videoId); // parent handles navigation
  };

  // Load more videos
  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 12); // load 12 more each click
  };

  return (
    <div className="fixed inset-x-0 top-[140px] sm:top-[100px] z-50 p-4 bg-black/50 backdrop-blur-sm animate-[slideFadeIn_0.3s_ease-out]">
      <div className="relative w-full max-w-[90rem] mx-auto bg-gray-900 rounded-xl p-4 max-h-[calc(100vh-160px)] overflow-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute text-xl font-bold text-gray-400 top-3 right-3 hover:text-pink-500"
        >
          ✕
        </button>

        <h3 className="mb-4 text-xl font-semibold text-pink-500">
          Search Results for "{searchTerm}"
        </h3>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, idx) => (
              <VideoSkeleton key={idx} />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="py-20 text-center text-gray-400">No videos found.</div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {results.slice(0, visibleCount).map((video) => (
                <div
                  key={video.id}
                  onClick={() => handleClick(video.id)}
                  className="overflow-hidden transition-transform bg-gray-800 rounded-lg shadow-lg cursor-pointer hover:scale-105"
                >
                  <div className="relative">
                    {video.thumbnail ? (
                      <img
                        src={video.thumbnail}
                        alt={video.description || "Video Thumbnail"}
                        className="object-cover w-full rounded-t-lg aspect-video"
                      />
                    ) : (
                      <div className="w-full bg-gray-700 rounded-t-lg aspect-video" />
                    )}
                    {video.duration && (
                      <span className="absolute bottom-1 left-1 px-2 py-0.5 text-xs font-semibold text-white bg-black/50 rounded">
                        {video.duration}
                      </span>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-[10px] text-gray-300 line-clamp-2">
                      {video.description || "No Title"}
                    </p>
                    <div className="flex items-center justify-between mt-1 text-[10px] text-gray-400">
                      <span>{video.category}</span>
                      <span className="flex items-center gap-1">
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
                        {formatViews(video.views ?? 0)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {visibleCount < results.length && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={handleLoadMore}
                  className="px-4 py-2 text-sm text-white transition"
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchResultsModal;
