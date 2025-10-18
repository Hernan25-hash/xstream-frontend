import React, { useEffect, useState, useMemo, useRef } from "react";
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
import Related from "./Related";

// ✅ Helper function for formatting numbers (K / M)
const formatViews = (num = 0) => {
  if (num >= 1_000_000)
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return num.toString();
};

// ✅ Persistent guest ID
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
      <h3 className="mb-2 text-lg font-semibold">
        Comments ({comments.length})
      </h3>
      <form
        onSubmit={handleCommentSubmit}
        className="flex flex-col gap-2 mb-4 sm:flex-row"
      >
        <input
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          className="flex-1 p-2 text-white bg-gray-800 border border-gray-600 rounded"
        />
        <button
          type="submit"
          className="px-4 py-2 text-white bg-pink-600 rounded"
        >
          Post
        </button>
      </form>
      <div className="space-y-3">
        {comments.map((comment) => (
          <div key={comment.id} className="p-3 bg-gray-900 rounded">
            <p className="text-sm font-semibold text-pink-400">
              {formatGuestName(comment.author)}
            </p>
            <p className="text-sm text-white">{comment.text}</p>
            <div className="mt-2 ml-4 space-y-2">
              {comment.replies?.map((reply, idx) => (
                <div key={idx} className="p-2 bg-gray-800 rounded">
                  <p className="text-xs font-semibold text-pink-400">
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
                  className="flex-1 p-1 text-xs text-white bg-gray-800 border border-gray-600 rounded"
                />
                <button
                  type="submit"
                  className="px-2 py-1 text-xs text-white bg-pink-600 rounded"
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

// ✅ VideoTitle component with See More / See Less
const VideoTitle = ({ text }) => {
  const [expanded, setExpanded] = useState(false);
  const maxChars = 120; // Approximate limit before "See more"

  const needsToggle = text.length > maxChars;
  const displayText = expanded || !needsToggle ? text : text.slice(0, maxChars) + "...";

  return (
    <div className="mt-2 mb-2 text-lg font-medium text-justify text-white sm:text-xl">
      <p>{displayText}</p>
      {needsToggle && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1 text-xs font-semibold text-pink-500 hover:underline"
        >
          {expanded ? "See less" : "See more"}
        </button>
      )}
    </div>
  );
};

// ✅ Main Embed Page
const EmbedPage = () => {
  const { id } = useParams();
  const db = getFirestore(app);
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const [video, setVideo] = useState(null);
  const [videos, setVideos] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const guestId = useMemo(() => getGuestId(), []);
  const [hasLiked, setHasLiked] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const shareRef = useRef(null);
  const [videoPaused, setVideoPaused] = useState(false);

  // ✅ Smartlink cooldown
  const [canTriggerSmartlink, setCanTriggerSmartlink] = useState(true);
  useEffect(() => {
    const lastTriggered = localStorage.getItem("smartlinkCooldown");
    if (lastTriggered) {
      const elapsed = Date.now() - Number(lastTriggered);
      if (elapsed < 120000) {
        setCanTriggerSmartlink(false);
        const timer = setTimeout(
          () => setCanTriggerSmartlink(true),
          120000 - elapsed
        );
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // ✅ Fetch video
  useEffect(() => {
    if (!id) return;
    const videoRefDoc = doc(db, "videos", id);
    const fetchVideo = async () => {
      const snap = await getDoc(videoRefDoc);
      if (snap.exists()) {
        const videoData = snap.data();
        setVideo({ ...videoData, id: snap.id });
        setHasLiked(videoData.likedBy?.includes(guestId) || false);
        await updateDoc(videoRefDoc, { views: increment(1) });
      } else setVideo(null);
    };
    fetchVideo();
    window.scrollTo(0, 0);

    const unsubscribe = onSnapshot(videoRefDoc, (docSnap) => {
      if (docSnap.exists()) {
        const videoData = docSnap.data();
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

  // ✅ Like handler
  const handleLike = async () => {
    if (!id || hasLiked) return;
    const ref = doc(db, "videos", id);
    await updateDoc(ref, {
      hearts: increment(1),
      likedBy: arrayUnion(guestId),
    });
    setHasLiked(true);
  };

  // ✅ Comment submit
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

  // ✅ Outside click for share
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (shareRef.current && !shareRef.current.contains(e.target))
        setShareOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () =>
      document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // ✅ Related
  const relatedVideos = videos
    .filter(
      (v) =>
        v.id !== id &&
        v.category?.toLowerCase() === video?.category?.toLowerCase()
    )
    .slice(0, 8);
  const fallbackVideos =
    relatedVideos.length > 0
      ? relatedVideos
      : videos.filter((v) => v.id !== id).slice(0, 8);

  if (!video)
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-12 h-12 border-4 border-gray-500 rounded-full border-t-pink-600 animate-spin"></div>
      </div>
    );

  return (
    <div className="relative min-h-screen text-white bg-black">
      <Helmet>
        <title>{video.description || "XStream Video"}</title>
        <meta
          name="description"
          content={video.description || "Watch videos on XStream"}
        />
      </Helmet>

      {/* Back Button */}
      <button
        className="fixed z-50 p-2 text-white transition top-4 left-4 hover:bg-pink-600"
        onClick={() => navigate("/")}
      >
        <FaArrowLeft />
      </button>

      <div className="flex flex-col max-w-screen-xl gap-6 p-4 pt-12 mx-auto lg:flex-row lg:p-6 lg:pt-6">
        <div className="flex flex-col flex-1">
          {/* ✅ Video Player */}
          <div className="relative w-full">
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
                    className="relative z-0 w-full h-[200px] sm:h-[360px] md:h-[480px] lg:h-[540px] shadow-lg"
                    allow="autoplay; fullscreen"
                    sandbox="allow-scripts allow-same-origin allow-presentation"
                    scrolling="no"
                    title="Embedded Video"
                  />
                ) : (
                  <div className="text-sm text-center text-gray-400">
                    Invalid iframe src.
                  </div>
                );
              })()
            ) : (
              <video
                ref={videoRef}
                src={video.url}
                controls
                autoPlay
                muted
                playsInline
                className="relative z-0 w-full h-[200px] sm:h-[360px] md:h-[480px] lg:h-[540px] rounded-lg shadow-lg"
                onPause={() => setVideoPaused(true)}
                onPlay={() => setVideoPaused(false)}
              />
            )}
          </div>

          {/* ✅ Title */}
          <VideoTitle text={video.description || "No Title"} />

          {/* ✅ Stats + Share */}
          <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-400">
            <span className="flex items-center gap-1">
              <FaEye />
              <span>{formatViews(video.views ?? 0)}</span>
            </span>
            <span
              className={`flex items-center gap-1 cursor-pointer ${
                hasLiked ? "text-red-500" : "hover:text-red-400 transition-colors"
              }`}
              onClick={handleLike}
            >
              <FaHeart /> {video.hearts || 0}
            </span>
            <span
              className="flex items-center gap-1 transition-colors cursor-pointer hover:text-pink-400"
              onClick={() => setShowComments(!showComments)}
            >
              <FaComment /> {comments.length}
            </span>

            {/* ✅ Share Popup */}
            <span className="relative" ref={shareRef}>
              <button
                className="flex items-center gap-1 px-3 py-1 transition bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700"
                onClick={() => setShareOpen((prev) => !prev)}
              >
                <FaShare /> Share
              </button>
              {shareOpen && (
                <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 sm:left-0 sm:translate-x-0 w-56 sm:w-64 max-w-[90vw] bg-gray-900 border border-gray-700 rounded-lg shadow-lg p-4 z-50">
                  <h3 className="mb-2 text-sm font-semibold text-pink-500">
                    Share this video
                  </h3>
                  <input
                    type="text"
                    readOnly
                    value={window.location.href}
                    className="w-full p-2 mb-2 text-xs text-white bg-gray-800 border border-gray-600 rounded"
                  />
                  <button
                    className="flex items-center justify-center w-full gap-2 px-3 py-2 text-xs text-white transition-colors bg-pink-600 rounded hover:bg-pink-500"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      setCopySuccess(true);
                      setTimeout(() => setCopySuccess(false), 2000);
                    }}
                  >
                    <FaClipboard /> Copy Link
                  </button>
                  {copySuccess && (
                    <p className="mt-1 text-xs text-green-400">Link copied!</p>
                  )}
                </div>
              )}
            </span>
          </div>

          {/* ✅ Comments */}
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

        {/* ✅ Related */}
        <Related relatedVideos={fallbackVideos} className="mt-6 lg:mt-0" />
      </div>

      <Footer />
    </div>
  );
};

export default EmbedPage;
