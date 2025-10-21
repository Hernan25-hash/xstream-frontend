// src/pages/MostViewed.jsx
import React, { useEffect, useState, useMemo } from "react";
import { getFirestore, collection, onSnapshot, query, orderBy, doc, getDoc } from "firebase/firestore";
import { app } from "../firebase";
import { useNavigate } from "react-router-dom";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { TopNav } from "../components/TopNav";
import Footer from "../components/Footer";
import Banner from "../components/Banner";
import SearchResultsModal from "../components/SearchResultsModal";

// ✅ Skeleton
const VideoSkeleton = () => (
  <div className="overflow-hidden bg-gray-800 shadow-lg animate-pulse">
    <div className="w-full bg-gray-700 aspect-video"></div>
    <div className="p-2 space-y-2">
      <div className="w-3/4 h-3 bg-gray-600 rounded"></div>
      <div className="w-1/2 h-3 bg-gray-600 rounded"></div>
    </div>
  </div>
);

const formatViews = (num = 0) => {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return num.toString();
};

const getGuestId = () => {
  let guestId = localStorage.getItem("xstreamGuestId");
  if (!guestId) {
    guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("xstreamGuestId", guestId);
  }
  return guestId;
};

const MostViewed = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(12);
  const [search, setSearch] = useState("");
  const [showCategories, setShowCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [user, setUser] = useState(null);

  const guestId = useMemo(() => getGuestId(), []);
  const db = getFirestore(app);
  const auth = getAuth(app);
  const navigate = useNavigate();

  // ✅ Authenticated user listener (Dashboard logic)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            setUser(userSnap.data());
          } else {
            console.warn("No user document found for:", currentUser.uid);
            setUser({
              uid: currentUser.uid,
              email: currentUser.email,
              provider: currentUser.providerData[0]?.providerId || "email",
              displayName: currentUser.displayName || "User",
              avatar: currentUser.photoURL || "/avatar/profile.png",
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setUser({
            uid: currentUser.uid,
            email: currentUser.email,
            provider: currentUser.providerData[0]?.providerId || "email",
            displayName: currentUser.displayName || "User",
            avatar: currentUser.photoURL || "/avatar/profile.png",
          });
        }
      } else {
        setUser(null); // guest
      }
    });

    return () => unsubscribe();
  }, [auth, db]);

  // ✅ Fetch videos sorted by views
  useEffect(() => {
    const q = query(collection(db, "videos"), orderBy("views", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const vids = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setVideos(vids);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [db]);

  const loadMore = () => setVisibleCount((prev) => prev + 12);

  const handleNavClick = (link) => {
    if (link === "HOME") navigate("/");
    if (link === "CATEGORIES") setShowCategories((v) => !v);
    if (link === "TOP RATED") navigate("/toprated");
    if (link === "MOST VIEWED") navigate("/mostviewed");
  };

  const availableCategories = [...new Set(videos.map((v) => v.category).filter(Boolean))];

  const filteredVideos = videos.filter((v) => {
    const matchCategory = selectedCategory ? v.category === selectedCategory : true;
    const matchSearch =
      search.trim() === ""
        ? true
        : (v.description || "").toLowerCase().includes(search.trim().toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="relative min-h-screen text-white bg-gray-900">
      {/* ✅ TopNav */}
      <TopNav
        user={user}
        search={search}
        setSearch={(val) => {
          setSearch(val);
          setShowSearchModal(val.trim().length > 0);
        }}
        handleNavClick={handleNavClick}
        showCategories={showCategories}
        availableCategories={availableCategories}
        setSelectedCategory={setSelectedCategory}
        setShowCategories={setShowCategories}
        selectedCategory={selectedCategory}
        loading={loading}
      />

      {/* ✅ Search Results Modal */}
      {showSearchModal && (
        <SearchResultsModal
          searchTerm={search}
          userId={user?.uid || guestId}
          onClose={() => setShowSearchModal(false)}
          onSelect={(videoId) => {
            setShowSearchModal(false);
            navigate(`/embed/${videoId}`);
          }}
        />
      )}

      {/* ✅ Banner */}
      <Banner />

      {/* ✅ Main Section */}
      <main className="max-w-[90rem] mx-auto px-4 pt-6 pb-12">
        <h2 className="mb-4 text-2xl font-semibold">Most Viewed Videos</h2>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {loading
            ? Array.from({ length: 12 }).map((_, idx) => <VideoSkeleton key={idx} />)
            : filteredVideos.slice(0, visibleCount).map((v) => (
                <div
                  key={v.id}
                  className="overflow-hidden transition-transform bg-gray-800 shadow-lg cursor-pointer hover:scale-105"
                  onClick={() => navigate(`/embed/${v.id}`)}
                >
                  {v.thumbnail ? (
                    <img
                      src={v.thumbnail}
                      alt={v.description || ""}
                      className="object-cover w-full aspect-video"
                    />
                  ) : (
                    <div className="w-full bg-black rounded-t-lg aspect-video" />
                  )}
                  <div className="text-[10px] text-gray-300 line-clamp-2 px-2 pt-1">
                    {v.description}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400 px-2 pb-2">
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
              ))}
        </div>

        {/* ✅ Load More Button */}
        {!loading && visibleCount < filteredVideos.length && (
          <div className="flex justify-center mt-6">
            <button
              onClick={loadMore}
              className="px-4 py-2 text-white transition border border-pink-600 rounded hover:bg-pink-600"
            >
              Load More
            </button>
          </div>
        )}
      </main>

      {/* ✅ Footer */}
      <Footer />
    </div>
  );
};

export default MostViewed;
