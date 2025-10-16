import React, { useEffect, useState, useMemo } from "react";
import { Helmet } from "react-helmet";
import { useParams, useNavigate } from "react-router-dom";
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  onSnapshot,
  updateDoc,
  increment,
  arrayUnion,
  addDoc,
  Timestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { app } from "../firebase";
import { FaEye, FaHeart, FaComment, FaShare, FaArrowLeft, FaClipboard } from "react-icons/fa";
import Footer from "./Footer";
import Banner from "./Banner";
import Related from "./Related";

// Persistent guest ID
const getGuestId = () => {
  let guestId = localStorage.getItem("xstreamGuestId");
  if (!guestId) {
    guestId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("xstreamGuestId", guestId);
  }
  return guestId;
};

// CommentSection
const CommentSection = ({ comments, newComment, setNewComment, handleCommentSubmit, db, videoId, guestId }) => {
  const [replyInputs, setReplyInputs] = useState({});
  const formatGuestName = (id) => (id ? `Guest-${id.substring(6, 12)}` : "Guest");

  const handleReplyChange = (commentId, text) => setReplyInputs((prev) => ({ ...prev, [commentId]: text }));

  const handleReplySubmit = async (e, commentId) => {
    e.preventDefault();
    const replyText = replyInputs[commentId];
    if (!replyText?.trim()) return;
    const commentRef = doc(db, "videos", videoId, "comments", commentId);
    await updateDoc(commentRef, {
      replies: arrayUnion({
        text: replyText,
        author: guestId,
        createdAt: Timestamp.now(),
      }),
    });
    setReplyInputs((prev) => ({ ...prev, [commentId]: "" }));
  };

  return (
    <div className="mt-6">
      <h3 className="mb-2 text-lg font-semibold">Comments ({comments.length})</h3>
      <form onSubmit={handleCommentSubmit} className="flex flex-col gap-2 mb-4 sm:flex-row">
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 p-2 text-white bg-gray-800 border border-gray-600 rounded"
        />
        <button type="submit" className="px-4 py-2 text-white bg-pink-600 rounded">
          Post
        </button>
      </form>
      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="p-3 bg-gray-900 rounded">
            <p className="text-sm font-semibold text-pink-400">{formatGuestName(comment.author)}</p>
            <p className="text-sm text-white">{comment.text}</p>
            <div className="mt-2 ml-4 space-y-2">
              {comment.replies?.map((reply, idx) => (
                <div key={idx} className="p-2 bg-gray-800 rounded">
                  <p className="text-xs font-semibold text-pink-400">{formatGuestName(reply.author)}</p>
                  <p className="text-xs text-white">{reply.text}</p>
                </div>
              ))}
              <form onSubmit={(e) => handleReplySubmit(e, comment.id)} className="flex gap-2 mt-1">
                <input
                  type="text"
                  value={replyInputs[comment.id] || ""}
                  onChange={(e) => handleReplyChange(comment.id, e.target.value)}
                  placeholder="Reply..."
                  className="flex-1 p-1 text-xs text-white bg-gray-800 border border-gray-600 rounded"
                />
                <button type="submit" className="px-2 py-1 text-xs text-white bg-pink-600 rounded">
                  Reply
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Embed Page
const EmbedPage = () => {
  const { id } = useParams();
  const db = getFirestore(app);
  const navigate = useNavigate();

  const [video, setVideo] = useState(null);
  const [videos, setVideos] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const guestId = useMemo(() => getGuestId(), []);
  const [hasLiked, setHasLiked] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const shareRef = React.useRef(null);

  // Smartlink cooldown
  const [canTriggerSmartlink, setCanTriggerSmartlink] = useState(true);
  useEffect(() => {
    const lastTriggered = localStorage.getItem("smartlinkCooldown");
    if (lastTriggered) {
      const elapsed = Date.now() - Number(lastTriggered);
      if (elapsed < 120000) {
        setCanTriggerSmartlink(false);
        const timer = setTimeout(() => setCanTriggerSmartlink(true), 120000 - elapsed);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // Fetch video
  useEffect(() => {
    if (!id) return;
    const videoRef = doc(db, "videos", id);
    const fetchVideo = async () => {
      const snap = await getDoc(videoRef);
      if (snap.exists()) {
        const videoData = snap.data();
        setVideo({ ...videoData, id: snap.id });
        setHasLiked(videoData.likedBy?.includes(guestId) || false);
        await updateDoc(videoRef, { views: increment(1) });
      } else setVideo(null);
    };
    fetchVideo();
    window.scrollTo(0, 0);

    const unsubscribe = onSnapshot(videoRef, (doc) => {
      if (doc.exists()) {
        const videoData = doc.data();
        setVideo((prev) => ({ ...prev, ...videoData }));
        setHasLiked(videoData.likedBy?.includes(guestId) || false);
      }
    });
    return () => unsubscribe();
  }, [id, db, guestId]);

  // Fetch all videos
  useEffect(() => {
    const q = collection(db, "videos");
    const unsubscribe = onSnapshot(q, (snap) => {
      const vids = [];
      snap.forEach((doc) => vids.push({ id: doc.id, ...doc.data() }));
      setVideos(vids);
    });
    return () => unsubscribe();
  }, [db]);

  // Fetch comments
  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, "videos", id, "comments"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      const commentsData = [];
      snap.forEach((doc) => commentsData.push({ id: doc.id, replies: [], ...doc.data() }));
      setComments(commentsData);
    });
    return () => unsubscribe();
  }, [id, db]);

  // Handle like
  const handleLike = async () => {
    if (!id || hasLiked) return;
    const ref = doc(db, "videos", id);
    await updateDoc(ref, {
      hearts: increment(1),
      likedBy: arrayUnion(guestId),
    });
    setHasLiked(true);
  };

  // Submit comment
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!id || newComment.trim() === "") return;
    await addDoc(collection(db, "videos", id, "comments"), {
      text: newComment,
      author: guestId,
      createdAt: Timestamp.now(),
      replies: [],
    });
    setNewComment("");
  };

  // Handle outside click for share
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (shareRef.current && !shareRef.current.contains(e.target)) setShareOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Related videos (case-insensitive & fallback)
  const relatedVideos = videos
    .filter((v) => v.id !== id && v.category?.toLowerCase() === video?.category?.toLowerCase())
    .slice(0, 8);

  const fallbackVideos = relatedVideos.length > 0 ? relatedVideos : videos.filter((v) => v.id !== id).slice(0, 8);

  if (!video)
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-12 h-12 border-4 border-gray-500 rounded-full border-t-pink-600 animate-spin"></div>
      </div>
    );

  const pageUrl = `https://xsecrets.xyz/embed/${video.id}`;

  return (
    <div className="relative min-h-screen text-white bg-black">
      <Helmet>
        <title>{video.description || "XStream Video"}</title>
        <meta name="description" content={video.description || "Watch videos on XStream"} />
        <meta property="og:type" content="video.other" />
        <meta property="og:url" content={pageUrl} />
        <meta property="og:title" content={video.description || "XStream"} />
        <meta property="og:description" content={video.description || "Watch this video on XStream"} />
        <meta property="og:image" content={video.thumbnail || "https://xsecrets.xyz/logo.png"} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:video" content={video.url} />
        <meta property="og:video:type" content="video/mp4" />
        <meta property="og:video-width" content="1280" />
        <meta property="og:video-height" content="720" />
        <meta name="twitter:card" content="player" />
        <meta name="twitter:title" content={video.description || "XStream"} />
        <meta name="twitter:description" content={video.description || "Watch videos on XStream"} />
        <meta name="twitter:image" content={video.thumbnail || "https://xsecrets.xyz/logo.png"} />
        <meta name="twitter:player" content={pageUrl} />
      </Helmet>

      {/* Back button */}
      <button
        className="fixed z-50 p-2 text-white transition bg-gray-900 rounded-full shadow top-4 left-4 hover:bg-pink-600"
        onClick={() => navigate("/")}
      >
        <FaArrowLeft />
      </button>

      {/* Layout */}
      <div className="flex flex-col max-w-screen-xl gap-6 p-4 pt-12 mx-auto lg:flex-row lg:p-6 lg:pt-6">
        {/* Main video + banner + stats + comments */}
        <div className="flex flex-col flex-1">
         {/* Video container with Smartlink cooldown */}
<div className="relative w-full mb-4 aspect-video">
  {canTriggerSmartlink && (
    <div
      className="absolute inset-0 z-10 cursor-pointer"
      onClick={() => {
        window.open(
          "https://www.effectivegatecpm.com/jyg7iqygdw?key=42a8d47d25b7b1c40d3fb95c274ab0ce",
          "_blank"
        );
        setCanTriggerSmartlink(false);
        localStorage.setItem("smartlinkCooldown", Date.now());
      }}
    />
  )}

  {video.url?.includes("<iframe") ? (
    (() => {
      const match = video.url.match(/src=["']([^"']+)["']/);
      return match?.[1] ? (
        <iframe
          src={match[1]}
          className="relative z-0 w-full h-full"
          allow="autoplay; fullscreen"
          sandbox="allow-scripts allow-same-origin allow-presentation"
          scrolling="no"
          title="Embedded Video"
        />
      ) : (
        <div className="text-sm text-center">Invalid iframe src.</div>
      );
    })()
  ) : (
    <video src={video.url} controls autoPlay className="relative z-0 w-full h-full" />
  )}
</div>


          {/* Banner */}
          <div className="w-full mb-2 sm:mb-4">
            <Banner />
          </div>

          {/* Title */}
          <h2 className="mb-1 text-xl font-semibold sm:mb-2">{video.description || "No Title"}</h2>

          {/* Stats & share */}
          <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <FaEye /> {video.views || 0}
            </span>
            <span
              className={`flex items-center gap-1 cursor-pointer ${hasLiked ? "text-red-500" : ""}`}
              onClick={handleLike}
            >
              <FaHeart /> {video.hearts || 0}
            </span>
            <span
              className="flex items-center gap-1 cursor-pointer"
              onClick={() => setShowComments(!showComments)}
            >
              <FaComment /> {comments.length}
            </span>
            <span className="relative" ref={shareRef}>
              <button
                className="flex items-center gap-1 px-2 py-1 transition bg-gray-800 rounded cursor-pointer hover:bg-gray-700"
                onClick={() => setShareOpen((prev) => !prev)}
              >
                <FaShare /> Share
              </button>
              {shareOpen && (
                <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 sm:left-0 sm:translate-x-0 w-56 sm:w-64 max-w-[90vw] bg-gray-900 border border-gray-700 rounded shadow-lg p-4 z-50">
                  <h3 className="mb-2 text-sm font-semibold text-pink-500">Share this video</h3>
                  <p className="mb-2 text-xs text-gray-300">
                    Copy the link below or share it on social media.
                  </p>
                  <input
                    type="text"
                    readOnly
                    value={window.location.href}
                    className="w-full p-2 mb-2 text-xs text-white bg-gray-800 border border-gray-600 rounded"
                  />
                  <button
                    className="flex items-center justify-center w-full gap-2 px-3 py-2 text-xs text-white bg-pink-600 rounded"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      setCopySuccess(true);
                      setTimeout(() => setCopySuccess(false), 2000);
                    }}
                  >
                    <FaClipboard /> Copy Link
                  </button>
                  {copySuccess && <p className="mt-1 text-xs text-green-400">Link copied!</p>}
                </div>
              )}
            </span>
          </div>

          {showComments && (
            <CommentSection
              comments={comments}
              newComment={newComment}
              setNewComment={setNewComment}
              handleCommentSubmit={handleCommentSubmit}
              db={db}
              videoId={id}
              guestId={guestId}
            />
          )}
        </div>

        {/* Related videos */}
        <Related relatedVideos={fallbackVideos} />
      </div>

      <Footer />
    </div>
  );
};

export default EmbedPage;
