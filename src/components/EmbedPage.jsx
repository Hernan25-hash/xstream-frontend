import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  getFirestore, doc, getDoc, collection, onSnapshot, 
  updateDoc, increment, arrayUnion, addDoc, Timestamp, query, orderBy 
} from "firebase/firestore";
import { app } from "../firebase";
import { TopNav, VideoGrid } from "./Dashboard";
import { FaEye, FaHeart, FaComment } from 'react-icons/fa';
import Footer from './Footer'; // Import the Footer component

// Function to generate a persistent guest ID
const getGuestId = () => {
  let guestId = localStorage.getItem("xstreamGuestId");
  if (!guestId) {
    guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("xstreamGuestId", guestId);
  }
  return guestId;
};

const CommentSection = ({ comments, newComment, setNewComment, handleCommentSubmit }) => {
  const formatGuestName = (id) => {
    if (!id) return "Guest";
    return `Guest-${id.substring(6, 12)}`;
  };

  return (
    <div className="comment-section">
      <h3>Comments ({comments.length})</h3>
      <form onSubmit={handleCommentSubmit} className="comment-form">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
        />
        <button type="submit">Post</button>
      </form>
      <div className="comment-list">
        {comments.map(comment => (
          <div key={comment.id} className="comment-item">
            <p className="comment-author">{formatGuestName(comment.author)}</p>
            <p className="comment-text">{comment.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const EmbedPage = () => {
  const { id } = useParams();
  const db = getFirestore(app);
  const navigate = useNavigate();

  const [video, setVideo] = useState(null);
  const [videos, setVideos] = useState([]);
  const [search, setSearch] = useState("");
  const [showCategories, setShowCategories] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  
  const guestId = useMemo(() => getGuestId(), []);
  const [hasLiked, setHasLiked] = useState(false);

  // Effect for fetching video data and incrementing views
  useEffect(() => {
    if (!id) return;
    const videoRef = doc(db, "videos", id);

    const fetchVideo = async () => {
      const snap = await getDoc(videoRef);
      if (snap.exists()) {
        const videoData = snap.data();
        setVideo({ ...videoData, id: snap.id });
        setHasLiked(videoData.likedBy?.includes(guestId) || false);
        
        // Increment views
        await updateDoc(videoRef, {
          views: increment(1)
        });
      } else {
        setVideo(null);
      }
    };
    
    fetchVideo();
    window.scrollTo(0, 0);

    // Real-time listener for video updates (likes, etc.)
    const unsubscribeVideo = onSnapshot(videoRef, (doc) => {
        if (doc.exists()) {
            const videoData = doc.data();
            setVideo(prev => ({ ...prev, ...videoData }));
            setHasLiked(videoData.likedBy?.includes(guestId) || false);
        }
    });

    return () => unsubscribeVideo();
  }, [id, db, guestId]);

  // Effect for fetching related videos
  useEffect(() => {
    const q = collection(db, "videos");
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const vids = [];
      querySnapshot.forEach((doc) => vids.push({ id: doc.id, ...doc.data() }));
      setVideos(vids);
    });
    return () => unsubscribe();
  }, [db]);

  // Effect for fetching comments
  useEffect(() => {
    if (!id) return;
    const commentsQuery = query(collection(db, "videos", id, "comments"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(commentsQuery, (querySnapshot) => {
      const commentsData = [];
      querySnapshot.forEach(doc => commentsData.push({ id: doc.id, ...doc.data() }));
      setComments(commentsData);
    });
    return () => unsubscribe();
  }, [id, db]);

  const handleNavClick = (link) => {
    if (link === "HOME") navigate("/");
    else if (link === "CATEGORIES") setShowCategories(v => !v);
  };

  useEffect(() => {
    if (search || selectedCategory) {
      navigate(`/?search=${search || ''}&category=${selectedCategory || ''}`);
    }
  }, [search, selectedCategory, navigate]);

  const handleLike = async () => {
    if (!id || hasLiked) return;
    const videoRef = doc(db, "videos", id);
    await updateDoc(videoRef, {
      hearts: increment(1),
      likedBy: arrayUnion(guestId)
    });
    setHasLiked(true);
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!id || newComment.trim() === "") return;
    await addDoc(collection(db, "videos", id, "comments"), {
      text: newComment,
      author: guestId,
      createdAt: Timestamp.now()
    });
    setNewComment("");
  };

  if (!video) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  const relatedVideos = videos.filter(v => v.id !== id && v.category === video.category).slice(0, 8);
  const availableCategories = [...new Set(videos.map(v => v.category).filter(Boolean))];

  return (
    <div className="embed-page-layout">
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

      <div className="embed-page-main-content">
        <div className="main-video-column">
          <div className="embed-player-wrapper">
            {/* Player code remains the same */}
            {video.url && video.url.includes("<iframe") ? (
              <div className="embed-iframe-container">
                {(() => {
                  const match = video.url.match(/src=["']([^"]+)["']/);
                  if (match && match[1]) {
                    return (
                      <iframe
                        src={match[1]}
                        className="embed-iframe"
                        allow="autoplay; fullscreen"
                        sandbox="allow-scripts allow-same-origin allow-presentation"
                        title="Embedded Video"
                        scrolling="no"
                      />
                    );
                  } else {
                    return <div className="embed-error">Invalid or missing iframe src.</div>;
                  }
                })()}
              </div>
            ) : video.url ? (
              <div className="embed-video-container">
                <video src={video.url} controls autoPlay className="embed-video" />
              </div>
            ) : (
              <div className="embed-error">Invalid video source.</div>
            )}
          </div>

          <div className="video-title">
              <h2>{video.description || "No Title"}</h2>
          </div>

          <div className="video-actions-bar">
              <div className="video-stats">
                  <div className="stat-item">
                      <FaEye /> {video.views || 0}
                  </div>
                  <div className={`stat-item like-button ${hasLiked ? 'liked' : ''}`} onClick={handleLike}>
                      <FaHeart /> {video.hearts || 0}
                  </div>
                  <div className="stat-item" onClick={() => setShowComments(!showComments)}>
                      <FaComment /> {comments.length}
                  </div>
              </div>
          </div>

          {showComments && (
            <CommentSection 
              comments={comments}
              newComment={newComment}
              setNewComment={setNewComment}
              handleCommentSubmit={handleCommentSubmit}
            />
          )}
        </div>

        <div className="related-videos-sidebar">
          <h2>Related Videos</h2>
          <VideoGrid videos={relatedVideos} navigate={navigate} isSidebar={true} />
        </div>
      </div>

      <Footer />

      <style>{`
        /* Loading Spinner */
        .loading-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: #111;
        }
        .spinner {
          width: 50px;
          height: 50px;
          border: 5px solid #444;
          border-top-color: #e60073;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .embed-page-layout {
          background: #111;
          color: #fff;
          min-height: 100vh;
          padding-top: 150px;
        }
        .embed-page-main-content {
          padding: 0;
          margin: 0 auto;
          max-width: 100%;
          width: 100%;
        }

        /* Default single-column layout */
        .main-video-column {
          width: 100%;
          max-width: none;
          margin: 0;
        }

        .related-videos-sidebar {
          margin-top: 32px;
        }

        .embed-player-wrapper {
          width: 100%;
          margin: 0;
          aspect-ratio: 16 / 9;
          background: #000;
          border-radius: 0;
          overflow: hidden;
        }
        .embed-iframe-container, .embed-video-container, .embed-iframe, .embed-video {
          width: 100%; height: 100%; border: none;
        }
        .embed-error {
          color: #e60073; font-size: 18px; display: flex;
          justify-content: center; align-items: center; height: 100%;
        }
        
        .video-title {
            padding: 16px 0;
        }

        .video-title h2 {
            margin: 0;
            font-size: 1.5em;
            color: #eee;
            line-height: 1.4;
            text-align: justify;
        }

        .video-actions-bar {
            display: flex;
            justify-content: flex-end; /* Align items to the right */
            align-items: center;
            background: #1a1a1a;
            padding: 12px 20px;
            border-radius: 8px;
            margin-bottom: 24px;
        }

        .video-stats {
            display: flex;
            align-items: center;
            gap: 24px;
        }
        .stat-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 1.1em;
            color: #aaa;
            cursor: pointer;
            transition: color 0.2s;
        }
        .stat-item:hover {
            color: #e60073;
        }
        .stat-item.like-button.liked {
            color: #e60073;
        }

        .comment-section {
            background: #1a1a1a;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 24px;
        }
        .comment-section h3 {
            margin-top: 0;
            color: #e60073;
        }
        .comment-form {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }
        .comment-form input {
            flex-grow: 1;
            background: #222;
            border: 1px solid #444;
            border-radius: 4px;
            padding: 10px;
            color: #fff;
            font-size: 1em;
        }
        .comment-form button {
            background: #e60073;
            color: #fff;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
        }
        .comment-list .comment-item {
            border-bottom: 1px solid #333;
            padding: 12px 0;
        }
        .comment-list .comment-item:last-child {
            border-bottom: none;
        }
        .comment-author {
            font-weight: bold;
            color: #e60073;
            margin: 0 0 4px 0;
        }
        .comment-text {
            margin: 0;
            color: #ddd;
        }

        .related-videos-section {
            margin-top: 32px;
        }
        .related-videos-section h2 {
          font-size: 24px; margin-bottom: 16px; color: #e60073;
        }

        /* Desktop-specific layout */
        @media (min-width: 1200px) {
          .embed-page-main-content {
            display: flex;
            flex-direction: row;
            gap: 0;
            max-width: 100%;
            align-items: flex-start;
            padding: 0 24px; /* Add horizontal padding */
          }
          .main-video-column {
            flex: 3.5;
            max-width: none;
            margin: 0;
            padding: 24px 0;
          }
          .related-videos-sidebar {
            flex: 1;
            margin: 0;
            padding: 24px;
            background: #0a0a0a;
          }
          .related-videos-sidebar .video-grid {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .related-videos-sidebar .video-card {
            display: flex;
            flex-direction: row;
            gap: 12px;
            align-items: center;
            background: #1a1a1a;
            border-radius: 0;
            padding: 12px 24px;
          }
          .related-videos-sidebar .video-meta {
            display: none; /* Hide metadata in sidebar */
          }
          .related-videos-sidebar .video-thumbnail {
            flex-shrink: 0;
            width: 160px; /* Increased width */
            height: 90px; /* Increased height */
          }
          .related-videos-sidebar .video-thumbnail img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 4px;
          }
          .related-videos-sidebar .video-info {
            flex-grow: 1;
          }
          .related-videos-sidebar .video-description {
            font-size: 0.9em;
            line-height: 1.3;
            color: #ddd;
            margin: 0;
          }
          .related-videos-sidebar h2 {
            font-size: 20px;
            padding: 0 24px;
            margin-bottom: 16px;
          }
        }
        @media (max-width: 1199px) {
          .related-videos-sidebar {
            margin-top: 32px;
          }
        }
        @media (max-width: 768px) {
            .video-title h2 {
                font-size: 1.3em;
            }
            .video-actions-bar {
                justify-content: center;
            }
        }
        @media (max-width: 600px) {
          .embed-page-layout { padding-top: 120px; }
          .embed-player-wrapper { border-radius: 0; }
        }
      `}</style>
    </div>
  );
};

export default EmbedPage;
