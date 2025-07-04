import React, { useState, useEffect } from "react";
import { getFirestore, collection, addDoc, Timestamp, onSnapshot, doc, deleteDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { app } from "../firebase";

const CATEGORIES = [
  "Pinay / Filipino", "Japanese", "Korean", "Chinese", "Thai",
  "Vietnamese", "Indonesian", "Indian", "Malaysian", "Asian Mix",
];

const AdminPanel = () => {
  const [embedUrl, setEmbedUrl] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [previewThumb, setPreviewThumb] = useState(null);
  const [videos, setVideos] = useState([]);
  
  const db = getFirestore(app);
  const storage = getStorage(app);
  const auth = getAuth(app);
  const navigate = useNavigate();

  useEffect(() => {
    const q = collection(db, "videos");
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const vids = [];
      querySnapshot.forEach((doc) => {
        vids.push({ id: doc.id, ...doc.data() });
      });
      setVideos(vids.sort((a, b) => b.createdAt - a.createdAt)); // Sort by newest first
    });
    return () => unsubscribe();
  }, [db]);

  const handleAddVideo = async (e) => {
    e.preventDefault();
    if (!embedUrl.trim() || !category || !description.trim() || !thumbnailFile) {
      alert("All fields including thumbnail are required.");
      return;
    }

    try {
      const thumbRef = ref(storage, `thumbnails/${Date.now()}_${thumbnailFile.name}`);
      const snap = await uploadBytes(thumbRef, thumbnailFile);
      const thumbURL = await getDownloadURL(snap.ref);

      const newVideo = {
        url: embedUrl.trim(),
        category,
        description: description.trim(),
        thumbnail: thumbURL,
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
      setThumbnailFile(null);
      setPreviewThumb(null);
    } catch (err) {
      console.error("Error adding video:", err);
      alert("Upload failed: " + err.message);
    }
  };

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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/admin");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <button onClick={handleLogout} className="admin-logout-btn">
          Logout
        </button>
      </div>

      <div className="admin-main-content">
        <div className="admin-form-container">
          <h2 className="admin-section-title">Add New Video</h2>
          <form onSubmit={handleAddVideo} className="admin-form">
            <select value={category} onChange={e => setCategory(e.target.value)} required>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>

            <input
              type="text"
              placeholder="Paste embed iframe or video URL"
              value={embedUrl}
              onChange={e => setEmbedUrl(e.target.value)}
              required
            />

            <input
              type="text"
              placeholder="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
            />

            <label htmlFor="thumbnail-upload" className="admin-thumbnail-label">
              {previewThumb ? "Change Thumbnail" : "Upload Thumbnail"}
            </label>
            <input
              id="thumbnail-upload"
              type="file"
              accept=".webp,.png,.jpg,.jpeg"
              onChange={e => {
                if (e.target.files[0]) {
                  setThumbnailFile(e.target.files[0]);
                  setPreviewThumb(URL.createObjectURL(e.target.files[0]));
                }
              }}
              required
              style={{ display: 'none' }}
            />

            {previewThumb && (
              <img src={previewThumb} alt="Thumbnail Preview" className="admin-thumb-preview" />
            )}

            <button type="submit" className="admin-submit-btn">
              Add Video
            </button>
          </form>
        </div>

        <div className="admin-videos-list">
          <h2 className="admin-section-title">Uploaded Videos ({videos.length})</h2>
          <div className="admin-videos-grid">
            {videos.map((v) => (
              <div key={v.id} className="admin-video-card">
                <img src={v.thumbnail} alt="Video Thumbnail" className="admin-video-thumb" />
                <div className="admin-video-info">
                  <p className="admin-video-category">{v.category}</p>
                  <p className="admin-video-desc">{v.description}</p>
                  <p className="admin-video-date">{new Date(v.added).toLocaleDateString()}</p>
                </div>
                <button onClick={() => handleDelete(v.id)} className="admin-delete-btn">
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .admin-panel {
          min-height: 100vh;
          background: #111;
          color: #fff;
          padding: 24px;
        }
        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .admin-header h1 {
          font-size: 28px;
          color: #e60073;
        }
        .admin-logout-btn {
          background: #333;
          color: #fff;
          border: 1px solid #e60073;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .admin-logout-btn:hover {
          background: #e60073;
        }
        .admin-main-content {
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
        }
        .admin-section-title {
          font-size: 22px;
          margin-bottom: 16px;
          border-bottom: 1px solid #333;
          padding-bottom: 8px;
        }
        .admin-form-container, .admin-videos-list {
          background: #181818;
          padding: 24px;
          border-radius: 8px;
        }
        .admin-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .admin-form input, .admin-form select {
          padding: 10px;
          border-radius: 4px;
          border: 1px solid #444;
          background: #222;
          color: #fff;
          font-size: 15px;
        }
        .admin-thumbnail-label {
          padding: 10px;
          background: #333;
          text-align: center;
          border-radius: 4px;
          cursor: pointer;
        }
        .admin-thumb-preview {
          width: 160px;
          border-radius: 8px;
          align-self: center;
        }
        .admin-submit-btn {
          background: #e60073;
          color: #fff;
          padding: 12px;
          border-radius: 6px;
          border: none;
          font-size: 16px;
          cursor: pointer;
        }
        .admin-videos-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }
        .admin-video-card {
          background: #222;
          border-radius: 8px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .admin-video-thumb {
          width: 100%;
          aspect-ratio: 16/9;
          object-fit: cover;
        }
        .admin-video-info {
          padding: 12px;
          flex-grow: 1;
        }
        .admin-video-category {
          color: #e60073;
          font-weight: bold;
          font-size: 14px;
        }
        .admin-video-desc {
          font-size: 14px;
          margin: 4px 0;
        }
        .admin-video-date {
          font-size: 12px;
          color: #888;
        }
        .admin-delete-btn {
          background: #500;
          color: #fff;
          border: none;
          padding: 8px;
          cursor: pointer;
          width: 100%;
        }
        .admin-delete-btn:hover {
          background: #a00;
        }

        @media (min-width: 992px) {
          .admin-main-content {
            grid-template-columns: 400px 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminPanel;
