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
import {
  FaEye,
  FaHeart,
  FaComment,
  FaShare,
  FaArrowLeft,
  FaClipboard,
} from "react-icons/fa";
import Footer from "./Footer";

// ✅ Generate persistent guest ID
const getGuestId = () => {
  let guestId = localStorage.getItem("xstreamGuestId");
  if (!guestId) {
    guestId = `guest_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    localStorage.setItem("xstreamGuestId", guestId);
  }
  return guestId;
};

// ✅ CommentSection component
const CommentSection = ({
  comments,
  newComment,
  setNewComment,
  handleCommentSubmit,
  db,
  videoId,
  guestId,
}) => {
  const [replyInputs, setReplyInputs] = useState({});
  const formatGuestName = (id) =>
    id ? `Guest-${id.substring(6, 12)}` : "Guest";

  const handleReplyChange = (commentId, text) =>
    setReplyInputs((prev) => ({ ...prev, [commentId]: text }));

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
      <h3 className="text-lg font-semibold mb-2">
        Comments ({comments.length})
      </h3>
      <form
        onSubmit={handleCommentSubmit}
        className="flex flex-col sm:flex-row gap-2 mb-4"
      >
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 p-2 rounded bg-gray-800 border border-gray-600 text-white"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-pink-600 rounded text-white"
        >
          Post
        </button>
      </form>
      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="bg-gray-900 p-3 rounded">
            <p className="text-sm text-pink-400 font-semibold">
              {formatGuestName(comment.author)}
            </p>
            <p className="text-sm text-white">{comment.text}</p>

            <div className="mt-2 ml-4 space-y-2">
              {comment.replies?.map((reply, idx) => (
                <div key={idx} className="bg-gray-800 p-2 rounded">
                  <p className="text-xs text-pink-400 font-semibold">
                    {formatGuestName(reply.author)}
                  </p>
                  <p className="text-xs text-white">{reply.text}</p>
                </div>
              ))}
              <form
                onSubmit={(e) => handleReplySubmit(e, comment.id)}
                className="flex gap-2 mt-1"
              >
                <input
                  type="text"
                  value={replyInputs[comment.id] || ""}
                  onChange={(e) =>
                    handleReplyChange(comment.id, e.target.value)
                  }
                  placeholder="Reply..."
                  className="flex-1 p-1 rounded bg-gray-800 border border-gray-600 text-white text-xs"
                />
                <button
                  type="submit"
                  className="px-2 py-1 bg-pink-600 rounded text-white text-xs"
                >
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

// ✅ Main Embed Page
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

  // ✅ Fetch video
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

  // ✅ Fetch all videos
  useEffect(() => {
    const q = collection(db, "videos");
    const unsubscribe = onSnapshot(q, (snap) => {
      const vids = [];
      snap.forEach((doc) => vids.push({ id: doc.id, ...doc.data() }));
      setVideos(vids);
    });
    return () => unsubscribe();
  }, [db]);

  // ✅ Fetch comments
  useEffect(() => {
    if (!id) return;
    const q = query(
      collection(db, "videos", id, "comments"),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const commentsData = [];
      snap.forEach((doc) =>
        commentsData.push({ id: doc.id, replies: [], ...doc.data() })
      );
      setComments(commentsData);
    });
    return () => unsubscribe();
  }, [id, db]);

  // ✅ Handle Like
  const handleLike = async () => {
    if (!id || hasLiked) return;
    const ref = doc(db, "videos", id);
    await updateDoc(ref, {
      hearts: increment(1),
      likedBy: arrayUnion(guestId),
    });
    setHasLiked(true);
  };

  // ✅ Submit Comment
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

  // ✅ Handle outside click (close share)
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (shareRef.current && !shareRef.current.contains(e.target))
        setShareOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const relatedVideos = videos
    .filter((v) => v.id !== id && v.category === video?.category)
    .slice(0, 8);

  if (!video)
    return (
      <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="w-12 h-12 border-4 border-gray-500 border-t-pink-600 rounded-full animate-spin"></div>
      </div>
    );

  // ✅ Page URL for SEO
  const pageUrl = `https://xsecrets.xyz/embed/${video.id}`;

  return (
    <div className="bg-black text-white min-h-screen relative">
      {/* ✅ Dynamic SEO Meta Tags */}
      <Helmet>
        <title>{video.description || "XStream Video"}</title>
        <meta
          name="description"
          content={video.description || "Watch videos on XStream"}
        />
        <meta property="og:type" content="video.other" />
        <meta property="og:url" content={pageUrl} />
        <meta
          property="og:title"
          content={video.description || "XStream Video"}
        />
        <meta
          property="og:description"
          content={video.description || "Watch this video on XStream"}
        />
        <meta
          property="og:image"
          content={video.thumbnail || "https://xsecrets.xyz/logo.png"}
        />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:video" content={video.url} />
        <meta property="og:video:type" content="video/mp4" />
        <meta property="og:video:width" content="1280" />
        <meta property="og:video:height" content="720" />
        <meta name="twitter:card" content="player" />
        <meta name="twitter:title" content={video.description || "XStream"} />
        <meta
          name="twitter:description"
          content={video.description || "Watch videos on XStream"}
        />
        <meta
          name="twitter:image"
          content={video.thumbnail || "https://xsecrets.xyz/logo.png"}
        />
        <meta name="twitter:player" content={pageUrl} />
      </Helmet>

      {/* 🔙 Back Button */}
      <button
        className="fixed top-4 left-4 z-50 p-2 bg-gray-900 rounded-full shadow hover:bg-pink-600 transition text-white"
        onClick={() => navigate("/")}
      >
        <FaArrowLeft />
      </button>

      {/* ✅ Layout */}
      <div className="flex flex-col lg:flex-row max-w-screen-xl mx-auto p-4 lg:p-6 gap-6 pt-12 lg:pt-6">
        {/* 🎥 Main Video */}
        <div className="flex-1">
          <div className="w-full aspect-video bg-black rounded overflow-hidden mb-4">
            {video.url?.includes("<iframe") ? (
              (() => {
                const match = video.url.match(/src=["']([^"']+)["']/);
                return match?.[1] ? (
                  <iframe
                    src={match[1]}
                    className="w-full h-full border-0"
                    allow="autoplay; fullscreen"
                    sandbox="allow-scripts allow-same-origin allow-presentation"
                    scrolling="no"
                    title="Embedded Video"
                  />
                ) : (
                  <div className="text-center text-sm">
                    Invalid iframe src.
                  </div>
                );
              })()
            ) : (
              <video src={video.url} controls autoPlay className="w-full h-full" />
            )}
          </div>

          <h2 className="text-xl font-semibold mb-2">
            {video.description || "No Title"}
          </h2>

          {/* ❤️ Stats & Share */}
          <div className="flex flex-wrap items-center gap-4 text-gray-400 text-sm mb-4">
            <span className="flex items-center gap-1">
              <FaEye /> {video.views || 0}
            </span>
            <span
              className={`flex items-center gap-1 cursor-pointer ${
                hasLiked ? "text-red-500" : ""
              }`}
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

            {/* 📤 Share */}
            <span className="relative" ref={shareRef}>
              <button
                className="flex items-center gap-1 cursor-pointer px-2 py-1 bg-gray-800 rounded hover:bg-gray-700 transition"
                onClick={() => setShareOpen((prev) => !prev)}
              >
                <FaShare /> Share
              </button>
              {shareOpen && (
                <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 sm:left-0 sm:translate-x-0 w-56 sm:w-64 max-w-[90vw] bg-gray-900 border border-gray-700 rounded shadow-lg p-4 z-50">
                  <h3 className="text-sm font-semibold text-pink-500 mb-2">
                    Share this video
                  </h3>
                  <p className="text-gray-300 text-xs mb-2">
                    Copy the link below or share it on social media.
                  </p>
                  <input
                    type="text"
                    readOnly
                    value={window.location.href}
                    className="w-full p-2 rounded bg-gray-800 border border-gray-600 text-white text-xs mb-2"
                  />
                  <button
                    className="w-full px-3 py-2 bg-pink-600 rounded text-white text-xs flex items-center justify-center gap-2"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      setCopySuccess(true);
                      setTimeout(() => setCopySuccess(false), 2000);
                    }}
                  >
                    <FaClipboard /> Copy Link
                  </button>
                  {copySuccess && (
                    <p className="text-green-400 text-xs mt-1">
                      Link copied!
                    </p>
                  )}
                </div>
              )}
            </span>
          </div>

          {/* 💬 Comments */}
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

        {/* 🎞️ Related Videos */}
        <div className="w-full lg:w-1/3">
          <h3 className="text-md font-semibold text-pink-500 mb-2">
            Related Videos
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2">
            {relatedVideos.map((v) => (
              <div
                key={v.id}
                className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform shadow-lg"
                onClick={() => navigate(`/embed/${v.id}`)}
              >
                <div className="w-full aspect-video bg-black pointer-events-none">
                  {v.url?.includes("<iframe") ? (
                    <iframe
                      src={v.url.match(/src=["']([^"']+)["']/)?.[1]}
                      title={v.description || "Video"}
                      className="w-full h-full border-0"
                      sandbox="allow-scripts allow-same-origin allow-presentation"
                      scrolling="no"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={v.url}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="p-1.5">
                  <div className="text-pink-500 text-[10px] mb-1">
                    Added:{" "}
                    {v.added
                      ? new Date(v.added).toLocaleDateString()
                      : ""}{" "}
                    | <b>{v.category}</b>
                  </div>
                  <div className="text-gray-300 text-xs line-clamp-2">
                    {v.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default EmbedPage;
