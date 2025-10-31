// C:\XStream\frontend\src\components\Profile.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { TopNav } from "./TopNav";
import Footer from "./Footer";
import { getAuth, onAuthStateChanged, updateProfile } from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  getDocs,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import SearchResultsModal from "../components/SearchResultsModal";
import { format } from "date-fns-tz";
import { app } from "../firebase";

const videosPerPage = 8;

// Skeleton while loading
const VideoSkeleton = () => <div className="h-48 bg-gray-800 rounded-lg animate-pulse" />;

const formatViews = (num = 0) => {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return num.toString();
};

const Profile = () => {
  const navigate = useNavigate();
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app, "gs://playmo-app-53e1b.firebasestorage.app");

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [showSearchModal, setShowSearchModal] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newAvatar, setNewAvatar] = useState(null);
  const [saving, setSaving] = useState(false);

  // Favorites state
  const [favorites, setFavorites] = useState([]);
  const [loadingFavorites, setLoadingFavorites] = useState(true);
  const [lastFavoriteDoc, setLastFavoriteDoc] = useState(null);
  const [hasMoreFavorites, setHasMoreFavorites] = useState(false);

  // 🧩 Fetch authenticated user + Firestore data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        let userData = userSnap.exists() ? userSnap.data() : {};

        // Set defaults if missing
        const updateFields = {};
        if (!userData.accountType) updateFields.accountType = "free";
        if (!userData.role) updateFields.role = "user";
        if (Object.keys(updateFields).length > 0) {
          await setDoc(userRef, updateFields, { merge: true });
          userData = { ...userData, ...updateFields };
        }

        // Format createdAt
        let createdAt = new Date();
        if (userData.createdAt) {
          createdAt =
            userData.createdAt instanceof Timestamp
              ? userData.createdAt.toDate()
              : new Date(userData.createdAt);
        } else if (firebaseUser.metadata?.creationTime) {
          createdAt = new Date(firebaseUser.metadata.creationTime);
        }

        // 🧠 Name resolution logic
        const finalName =
          userData.username ||
          userData.displayName ||
          firebaseUser.displayName ||
          "Guest";

        setUser({
          id: firebaseUser.uid,
          name: finalName,
          email: firebaseUser.email,
          avatar:
            userData.avatar ||
            firebaseUser.photoURL ||
            "/avatar/profile.png",
          username: finalName,
          createdAt,
          accountType: userData.accountType || "free",
          role: userData.role || "user",
        });

        setNewUsername(finalName);
      } else {
        navigate("/");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth, db, navigate]);

  const guestId = useMemo(() => {
    let id = localStorage.getItem("xstreamGuestId");
    if (!id) {
      id = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("xstreamGuestId", id);
    }
    return id;
  }, []);

  // 🩷 Real-time favorites
  useEffect(() => {
    if (!user) return;

    setLoadingFavorites(true);
    const favRef = collection(db, "users", user.id, "favorites");
    const favQuery = query(favRef, orderBy("addedAt", "desc"), limit(videosPerPage));

    const unsubscribe = onSnapshot(favQuery, async (snapshot) => {
      const favData = [];
      for (const docSnap of snapshot.docs) {
        const videoId = docSnap.data().videoId;
        const videoSnap = await getDoc(doc(db, "videos", videoId));
        if (videoSnap.exists()) {
          favData.push({ id: videoSnap.id, ...videoSnap.data() });
        }
      }

      setFavorites(favData);
      setLastFavoriteDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMoreFavorites(snapshot.docs.length === videosPerPage);
      setLoadingFavorites(false);
    });

    return () => unsubscribe();
  }, [user, db]);

  const fetchMoreFavorites = async () => {
    if (!user || !lastFavoriteDoc) return;
    setLoadingFavorites(true);

    const favRef = collection(db, "users", user.id, "favorites");
    const favQuery = query(
      favRef,
      orderBy("addedAt", "desc"),
      startAfter(lastFavoriteDoc),
      limit(videosPerPage)
    );

    const snapshot = await getDocs(favQuery);
    const favData = [];
    for (const docSnap of snapshot.docs) {
      const videoId = docSnap.data().videoId;
      const videoSnap = await getDoc(doc(db, "videos", videoId));
      if (videoSnap.exists()) favData.push({ id: videoSnap.id, ...videoSnap.data() });
    }

    setFavorites((prev) => [...prev, ...favData]);
    setLastFavoriteDoc(snapshot.docs[snapshot.docs.length - 1] || null);
    setHasMoreFavorites(snapshot.docs.length === videosPerPage);
    setLoadingFavorites(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-300 bg-gray-900">
        Loading your profile...
      </div>
    );
  }

  const phTime = format(user.createdAt, "MMMM dd, yyyy hh:mm a", {
    timeZone: "Asia/Manila",
  });

  // ✏️ Save profile updates
  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      let avatarUrl = user.avatar;

      if (newAvatar) {
        const avatarRef = ref(storage, `avatars/${user.id}`);
        await uploadBytes(avatarRef, newAvatar);
        avatarUrl = await getDownloadURL(avatarRef);
      }

      const userRef = doc(db, "users", user.id);
      await updateDoc(userRef, {
        displayName: newUsername,
        username: newUsername,
        avatar: avatarUrl,
        accountType: "free",
        role: "user",
      });

      // Update Firebase Auth profile displayName (important!)
      await updateProfile(auth.currentUser, { displayName: newUsername });

      setUser((prev) => ({
        ...prev,
        name: newUsername,
        username: newUsername,
        avatar: avatarUrl,
      }));

      setEditOpen(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <TopNav
        user={user}
        search={search}
        setSearch={(val) => {
          setSearch(val);
          setShowSearchModal(val.trim().length > 0);
        }}
      />

      {showSearchModal && (
        <SearchResultsModal
          searchTerm={search}
          userId={user?.id || guestId}
          onClose={() => setShowSearchModal(false)}
          onSelect={(videoId) => {
            setShowSearchModal(false);
            navigate(`/embed/${videoId}`);
          }}
        />
      )}

      <div className="min-h-screen px-4 py-8 pt-24 text-white bg-gray-900">
        <div className="max-w-2xl mx-auto">
          <h1 className="mb-6 text-3xl font-bold text-center text-pink-500">
            Your Profile
          </h1>

          {/* Profile Card */}
          <div className="p-6 bg-gray-800 shadow-lg rounded-2xl">
            <div className="flex flex-col items-center gap-4">
              <img
                src={user.avatar}
                alt="User Avatar"
                className="object-cover border-2 border-pink-500 rounded-full w-28 h-28"
              />
              <h2 className="text-xl font-semibold">{user.name}</h2>
              <p className="text-gray-400">{user.email}</p>
            </div>

            <div className="mt-6 space-y-2 text-sm text-gray-300">
              <p className="flex justify-between pb-1 border-b border-gray-700/50">
                <span className="font-medium text-pink-400/90">Username</span>
                <span className="text-gray-200">{user.username || "N/A"}</span>
              </p>

              <p className="flex justify-between pb-1 border-b border-gray-700/50">
                <span className="font-medium text-pink-400/90">Member Since</span>
                <span className="text-gray-200">{phTime}</span>
              </p>

              <p className="flex justify-between pb-1 border-b border-gray-700/50">
                <span className="font-medium text-pink-400/90">Account Type</span>
                <span className="text-gray-200 capitalize">
                  {user.accountType}
                </span>
              </p>
            </div>

            <div className="flex justify-center mt-6">
              <button
                className="px-4 py-2 text-sm font-semibold text-white transition bg-pink-600 rounded-lg hover:bg-pink-700"
                onClick={() => setEditOpen(true)}
              >
                Edit Profile
              </button>
            </div>
          </div>

          {/* Favorites */}
          <div className="mt-10">
            <h2 className="mb-4 text-xl font-bold text-pink-500">
              Favorite Videos
            </h2>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {loadingFavorites
                ? Array.from({ length: videosPerPage }).map((_, idx) => (
                    <VideoSkeleton key={idx} />
                  ))
                : favorites.map((v) => (
                    <div
                      key={v.id}
                      className="overflow-hidden transition-transform bg-gray-800 shadow-lg cursor-pointer hover:scale-105"
                      onClick={() => navigate(`/embed/${v.id}`)}
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
                        <div className="text-[10px] text-gray-300 line-clamp-2">
                          {v.description}
                        </div>
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

            {hasMoreFavorites && !loadingFavorites && (
              <div className="flex justify-center mt-6">
                <button
                  className="px-6 py-2 text-sm font-semibold text-white transition bg-pink-600 rounded-lg hover:bg-pink-700"
                  onClick={fetchMoreFavorites}
                >
                  Load More
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="flex flex-col items-center w-full max-w-md p-6 bg-gray-900 shadow-lg rounded-2xl">
            <img
              src={newAvatar ? URL.createObjectURL(newAvatar) : user.avatar}
              alt="Avatar Preview"
              className="object-cover w-24 h-24 mb-4 border-2 border-pink-500 rounded-full"
            />

            <h2 className="mb-4 text-xl font-semibold text-pink-500">
              Edit Profile
            </h2>

            <label className="block mb-2 text-sm font-medium text-gray-300">
              Username
            </label>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full p-2 mb-4 text-black rounded"
            />

            <label className="block mb-2 text-sm font-medium text-gray-300">
              Avatar
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewAvatar(e.target.files[0])}
              className="w-full mb-4 text-sm text-gray-300"
            />

            <div className="flex justify-end w-full gap-3 mt-4">
              <button
                className="px-4 py-2 text-sm font-semibold text-gray-300 bg-gray-700 rounded hover:bg-gray-600"
                onClick={() => setEditOpen(false)}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 text-sm font-semibold text-white rounded ${
                  saving ? "bg-gray-500" : "bg-pink-600 hover:bg-pink-700"
                }`}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default Profile;
