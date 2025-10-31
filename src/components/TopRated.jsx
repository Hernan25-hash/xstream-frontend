// src/pages/TopRated.jsx
import React, { useEffect, useState, useMemo } from "react";
import { getFirestore, collection, onSnapshot, doc, getDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "../firebase";
import { useNavigate } from "react-router-dom";
import { TopNav } from "../components/TopNav";
import Footer from "../components/Footer";
import Banner from "../components/Banner";
import SearchResultsModal from "../components/SearchResultsModal";

// ✅ Skeleton loader
const VideoSkeleton = () => (
  <div className="overflow-hidden bg-gray-800 shadow-lg animate-pulse">
    <div className="w-full bg-gray-700 aspect-video"></div>
    <div className="p-2 space-y-2">
      <div className="w-3/4 h-3 bg-gray-600 rounded"></div>
      <div className="w-1/2 h-3 bg-gray-600 rounded"></div>
    </div>
  </div>
);

const getGuestId = () => {
  let guestId = localStorage.getItem("xstreamGuestId");
  if (!guestId) {
    guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("xstreamGuestId", guestId);
  }
  return guestId;
};

// ✅ VideoCard Component
const VideoCard = ({ video, db, navigate }) => {
  const [hearts, setHearts] = useState(video.hearts || 0);
  const [commentsCount, setCommentsCount] = useState(video.commentsCount || 0);

  useEffect(() => {
    const videoRef = doc(db, "videos", video.id);
    const unsubscribe = onSnapshot(videoRef, (snapshot) => {
      const data = snapshot.data();
      if (data) setHearts(data.hearts || 0);
    });
    return () => unsubscribe();
  }, [db, video.id]);

  useEffect(() => {
    const commentsRef = collection(db, "videos", video.id, "comments");
    const unsubscribe = onSnapshot(commentsRef, (snapshot) => {
      setCommentsCount(snapshot.size);
    });
    return () => unsubscribe();
  }, [db, video.id]);

  return (
    <div
      className="overflow-hidden transition-transform bg-gray-800 shadow-lg cursor-pointer hover:scale-105"
      onClick={() => navigate(`/embed/${video.id}`)}
    >
      <div className="relative">
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt={video.description || ""}
            className="object-cover w-full aspect-video"
          />
        ) : (
          <div className="w-full bg-black rounded-t-lg aspect-video" />
        )}
      </div>
      <div className="text-[10px] text-gray-300 line-clamp-2 px-2 pt-1">{video.description}</div>
      <div className="flex items-center gap-2 text-[10px] text-gray-400 px-2 pb-2">
        <span>❤️ {hearts}</span>
        <span>💬 {commentsCount}</span>
      </div>
    </div>
  );
};

const TopRated = () => {
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

  // ✅ Fetch authenticated user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            setUser(userSnap.data());
          } else {
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

  // ✅ Fetch top rated videos
  useEffect(() => {
    const q = collection(db, "videos");
   const unsubscribe = onSnapshot(q, (snapshot) => {
  const vids = snapshot.docs
    .map((doc) => {
      const data = doc.data();
      const engagement = (data.hearts || 0) + (data.commentsCount || 0);
      return { id: doc.id, engagement, ...data };
    })
    .filter((v) => v.engagement > 0 && !v.exclusive) // 🚫 exclude exclusive videos
    .sort((a, b) => b.engagement - a.engagement);

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

      <Banner />

      <main className="max-w-[90rem] mx-auto px-4 pt-6 pb-12">
        <h2 className="mb-4 text-2xl font-semibold">Top Rated Videos</h2>

        <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {loading
            ? Array.from({ length: 12 }).map((_, idx) => <VideoSkeleton key={idx} />)
            : filteredVideos.slice(0, visibleCount).map((v) => (
                <VideoCard key={v.id} video={v} db={db} navigate={navigate} />
              ))}
        </div>

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

      <Footer />
    </div>
  );
};

export default TopRated;
