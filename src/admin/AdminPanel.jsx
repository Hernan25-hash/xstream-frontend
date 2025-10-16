import React, { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  addDoc,
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

const AdminPanel = () => {
  const [embedUrl, setEmbedUrl] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [videos, setVideos] = useState([]);

  const db = getFirestore(app);
  const auth = getAuth(app);
  const navigate = useNavigate();

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

  // 🔹 Add new video
  const handleAddVideo = async (e) => {
    e.preventDefault();
    if (!embedUrl.trim() || !category || !description.trim()) {
      alert("All fields are required.");
      return;
    }

    try {
      const newVideo = {
        url: embedUrl.trim(),
        category,
        description: description.trim(),
        added: new Date().toISOString(),
        createdAt: Timestamp.now(),
        views: 0,
        hearts: 0,
        likedBy: [],
      };

      await addDoc(collection(db, "videos"), newVideo);
      setEmbedUrl("");
      setCategory(CATEGORIES[0]);
      setDescription("");
    } catch (err) {
      console.error("Error adding video:", err);
      alert("Upload failed: " + err.message);
    }
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
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      alert("Failed to logout. Try again.");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-pink-600">Admin Panel</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-gray-800 border border-pink-600 rounded-lg hover:bg-pink-600 transition"
        >
          Logout
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8">
        {/* Add Video Form */}
        <div className="bg-gray-900 p-5 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">
            Add New Video
          </h2>

          <form onSubmit={handleAddVideo} className="flex flex-col gap-3">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="p-2 rounded bg-gray-800 border border-gray-700 text-white"
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
              className="p-2 rounded bg-gray-800 border border-gray-700 text-white"
              required
            />

            <input
              type="text"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="p-2 rounded bg-gray-800 border border-gray-700 text-white"
              required
            />

            <button
              type="submit"
              className="w-full py-2 bg-pink-600 rounded hover:bg-pink-700 transition text-white font-medium"
            >
              Add Video
            </button>
          </form>
        </div>

        {/* Uploaded Videos List */}
        <div className="bg-gray-900 p-5 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">
            Uploaded Videos ({videos.length})
          </h2>

          {videos.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No videos uploaded yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((v) => (
                <div
                  key={v.id}
                  className="bg-gray-800 rounded-lg overflow-hidden shadow-md flex flex-col"
                >
                  {/* Display Embed */}
                  <div className="relative w-full aspect-video bg-black">
                    {v.url?.includes("<iframe") ? (
                      (() => {
                        const match = v.url.match(/src=["']([^"']+)["']/);
                        return match ? (
                          <iframe
                            src={match[1]}
                            className="w-full h-full border-0 pointer-events-none opacity-70"
                            title="Embedded Video"
                          />
                        ) : (
                          <div className="text-gray-400 text-sm p-2 text-center">
                            Invalid iframe
                          </div>
                        );
                      })()
                    ) : (
                      <video
                        src={v.url}
                        className="w-full h-full object-cover opacity-70 pointer-events-none"
                      />
                    )}
                  </div>

                  {/* Video Info */}
                  <div className="p-3 flex flex-col flex-grow">
                    <p className="text-pink-500 text-sm font-semibold mb-1">
                      {v.category}
                    </p>
                    <p className="text-gray-300 text-sm line-clamp-2 mb-2">
                      {v.description}
                    </p>
                    <p className="text-gray-500 text-xs mb-3">
                      {v.added ? new Date(v.added).toLocaleDateString() : ""}
                    </p>

                    <button
                      onClick={() => handleDelete(v.id)}
                      className="mt-auto bg-red-700 hover:bg-red-800 text-white text-sm py-1 rounded transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
