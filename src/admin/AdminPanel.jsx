import React, { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  addDoc,
  updateDoc,
  Timestamp,
  onSnapshot,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { app } from "../firebase";

const CATEGORIES = [
  "Pinay / Filipino",
  "Japanese",
  "Korean",
  "Chinese",
  "Thai",
  "Vietnamese",
  "Indonesian",
  "Indian",
  "Malaysian",
  "Asian Mix",
];
import AdminUsers from "./AdminUsers";

const AdminPanel = () => {
  const [embedUrl, setEmbedUrl] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [views, setViews] = useState(0);
  const [duration, setDuration] = useState("");
  const [exclusive, setExclusive] = useState(false); // ✅ NEW
  const [showExclusiveIndicator, setShowExclusiveIndicator] = useState(false); // ✅ NEW
  const [editId, setEditId] = useState(null);
  const [videos, setVideos] = useState([]);

  const db = getFirestore(app);
  const auth = getAuth(app);
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const goToUsers = () => {
  navigate("/2admin/users");
  setIsSidebarOpen(false); // close sidebar after navigation
};


  // 🔹 Fetch videos live
  useEffect(() => {
    const q = collection(db, "videos");
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const vids = [];
      querySnapshot.forEach((doc) => vids.push({ id: doc.id, ...doc.data() }));
      setVideos(vids.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
    });
    return () => unsubscribe();
  }, [db]);

  // 🔹 Add or Update video
  const handleAddVideo = async (e) => {
    e.preventDefault();
    if (
      !embedUrl.trim() ||
      !category ||
      !description.trim() ||
      !thumbnailUrl.trim() ||
      !duration.trim()
    ) {
      alert("All fields are required.");
      return;
    }

    try {
      const newVideo = {
        url: embedUrl.trim(),
        category,
        description: description.trim(),
        thumbnail: thumbnailUrl.trim(),
        added: new Date().toISOString(),
        createdAt: Timestamp.now(),
        views: Number(views) || 0,
        duration: duration.trim(),
        hearts: 0,
        likedBy: [],
        exclusive: !!exclusive, // ✅ mark as exclusive if true
      };

      if (editId) {
        await updateDoc(doc(db, "videos", editId), newVideo);
        setEditId(null);
      } else {
        await addDoc(collection(db, "videos"), newVideo);
      }

      setEmbedUrl("");
      setCategory(CATEGORIES[0]);
      setDescription("");
      setThumbnailUrl("");
      setViews(0);
      setDuration("");
      setExclusive(false); // reset checkbox

      // ✅ Show confirmation when marked as exclusive
      if (exclusive) {
        setShowExclusiveIndicator(true);
        setTimeout(() => setShowExclusiveIndicator(false), 3000);
      }
    } catch (err) {
      console.error("Error adding/updating video:", err);
      alert("Operation failed: " + err.message);
    }
  };

  // 🔹 Edit video
  const handleEdit = (video) => {
    setEditId(video.id);
    setEmbedUrl(video.url);
    setCategory(video.category);
    setDescription(video.description);
    setThumbnailUrl(video.thumbnail || "");
    setViews(video.views || 0);
    setDuration(video.duration || "");
    setExclusive(video.exclusive || false);
    window.scrollTo({ top: 0, behavior: "smooth" });

    

  };

  // 🔹 Delete video
  const handleDelete = async (videoId) => {
    if (window.confirm("Are you sure you want to delete this video?")) {
      try {
        await deleteDoc(doc(db, "videos", videoId));
      } catch (error) {
        console.error("Error deleting video:", error);
        alert("Failed to delete video: " + error.message);
      }
    }
  };

  // 🔹 Logout admin
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/2login");
    } catch (error) {
      console.error("Logout error:", error);
      alert("Failed to logout. Try again.");
    }
  };

  // 🔹 Toggle exclusive button
  const toggleExclusiveMode = () => {
    setExclusive((prev) => !prev);
    setShowExclusiveIndicator(true);
    setTimeout(() => setShowExclusiveIndicator(false), 3000);
  };

  return (
    <div className="relative min-h-screen p-6 text-white bg-black">
      {/* ✅ Exclusive Mode Floating Indicator */}
      {showExclusiveIndicator && (
        <div className="absolute px-4 py-2 text-sm text-white bg-pink-600 rounded-lg shadow-lg top-4 right-4 animate-fadeIn">
          {exclusive ? "Exclusive Mode Enabled" : "Exclusive Mode Disabled"}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
  <h1 className="text-3xl font-bold text-pink-600">Admin Panel</h1>
  <div className="flex items-center gap-3">
    {/* ✅ Exclusive Toggle Button */}
    <button
      onClick={toggleExclusiveMode}
      className={`px-4 py-2 border rounded-lg transition ${
        exclusive
          ? "bg-pink-600 border-pink-600 hover:bg-pink-700"
          : "bg-gray-800 border-gray-700 hover:bg-gray-700"
      }`}
    >
      {exclusive ? "Exclusive ✓" : "Exclusive"}
    </button>

    {/* 🍔 Hamburger Menu */}
    <button
      onClick={() => setIsSidebarOpen(true)}
      className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700"
    >
      {/* simple hamburger icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6 text-white"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  </div>
</div>


      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8">
        {/* Add Video Form */}
        <div className="p-5 bg-gray-900 rounded-lg shadow-lg">
          <h2 className="pb-2 mb-4 text-xl font-semibold border-b border-gray-700">
            {editId ? "Edit Video" : "Add New Video"}
          </h2>

          <form onSubmit={handleAddVideo} className="flex flex-col gap-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="p-2 text-white bg-gray-800 border border-gray-700 rounded"
              required
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Paste embed iframe or video URL"
              value={embedUrl}
              onChange={(e) => setEmbedUrl(e.target.value)}
              className="p-2 text-white bg-gray-800 border border-gray-700 rounded"
              required
            />

            <input
              type="text"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="p-2 text-white bg-gray-800 border border-gray-700 rounded"
              required
            />

            <input
              type="text"
              placeholder="Paste your image address (thumbnail URL)"
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              className="p-2 text-white bg-gray-800 border border-gray-700 rounded"
              required
            />

            <input
              type="number"
              placeholder="Views count"
              value={views}
              onChange={(e) => setViews(e.target.value)}
              className="p-2 text-white bg-gray-800 border border-gray-700 rounded"
            />

            <input
              type="text"
              placeholder="Video duration (e.g. 1h 20m)"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="p-2 text-white bg-gray-800 border border-gray-700 rounded"
              required
            />

            {/* ✅ Exclusive optional checkbox */}
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input
                type="checkbox"
                checked={exclusive}
                onChange={(e) => setExclusive(e.target.checked)}
                className="w-4 h-4 accent-pink-600"
              />
              Mark as Exclusive
            </label>

            <button
              type="submit"
              className="w-full py-2 font-medium text-white transition bg-pink-600 rounded hover:bg-pink-700"
            >
              {editId ? "Update Video" : "Add Video"}
            </button>
          </form>
        </div>

        {/* Uploaded Videos List */}
        <div className="p-5 bg-gray-900 rounded-lg shadow-lg">
          <h2 className="pb-2 mb-4 text-xl font-semibold border-b border-gray-700">
            Uploaded Videos ({videos.length})
          </h2>

          {videos.length === 0 ? (
            <p className="py-8 text-center text-gray-500">
              No videos uploaded yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {videos.map((v) => (
                <div
                  key={v.id}
                  className="flex flex-col overflow-hidden bg-gray-800 rounded-lg shadow-md"
                >
                  {/* Display Thumbnail only */}
                  {v.thumbnail ? (
                    <img
                      src={v.thumbnail}
                      alt="Video Thumbnail"
                      className="object-cover w-full transition cursor-pointer aspect-video hover:opacity-80"
                    />
                  ) : (
                    <div className="w-full bg-black aspect-video" />
                  )}

                  {/* Video Info */}
                  <div className="flex flex-col flex-grow p-3">
                    <p className="mb-1 text-sm font-semibold text-pink-500">
                      {v.category}
                    </p>
                    <p className="mb-1 text-sm text-gray-300 line-clamp-2">
                      {v.description}
                    </p>
                    <p className="mb-1 text-xs text-gray-500">
                      Views: {v.views || 0} • Duration: {v.duration || "N/A"}
                    </p>
                    <p className="mb-1 text-xs text-gray-400">
                      {v.exclusive ? "🌟 Exclusive" : ""}
                    </p>
                    <p className="mb-3 text-xs text-gray-500">
                      {v.added ? new Date(v.added).toLocaleDateString() : ""}
                    </p>

                    <div className="flex gap-2 mt-auto">
                      <button
                        onClick={() => handleEdit(v)}
                        className="flex-1 py-1 text-sm text-white transition bg-blue-700 rounded hover:bg-blue-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(v.id)}
                        className="flex-1 py-1 text-sm text-white transition bg-red-700 rounded hover:bg-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ✅ Sidebar Overlay */}
{isSidebarOpen && (
  <div
    className="fixed inset-0 z-40 bg-black bg-opacity-50"
    onClick={() => setIsSidebarOpen(false)}
  ></div>
)}

{/* ✅ Sidebar Panel */}
<div
  className={`fixed top-0 right-0 h-full w-64 bg-gray-900 shadow-lg z-50 transform transition-transform duration-300 ${
    isSidebarOpen ? "translate-x-0" : "translate-x-full"
  }`}
>
  <div className="flex flex-col h-full">
    <div className="flex items-center justify-between p-4 border-b border-gray-700">
      <h2 className="text-xl font-semibold text-pink-500">Menu</h2>
      <button
        onClick={() => setIsSidebarOpen(false)}
        className="text-gray-400 hover:text-white"
      >
        ✕
      </button>
    </div>

    <div className="flex flex-col flex-grow p-4 space-y-3">
      <button
  onClick={goToUsers}
  className="w-full py-2 text-left text-gray-300 rounded hover:bg-gray-800"
>
  User's
</button>

      <button className="w-full py-2 text-left text-gray-300 rounded hover:bg-gray-800">
        Report's
      </button>
    </div>

    <div className="p-4 border-t border-gray-700">
      <button
        onClick={handleLogout}
        className="w-full py-2 text-white transition bg-red-600 rounded hover:bg-red-700"
      >
        Logout
      </button>
    </div>
  </div>
</div>

      </div>
    </div>
  );
};

export default AdminPanel;
