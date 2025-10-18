import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye } from "react-icons/fa";

const formatViews = (num = 0) => {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return num.toString();
};

const Related = ({ relatedVideos }) => {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);

  if (!relatedVideos || relatedVideos.length === 0)
    return <p className="text-gray-400">No related videos found.</p>;

  const limit = 4; // Number of videos to show initially
  const displayedVideos = showAll ? relatedVideos : relatedVideos.slice(0, limit);

  return (
    <div className="flex-shrink-0 w-full lg:w-1/4">
      <h3 className="mb-2 font-semibold text-pink-500 text-md">Related Videos</h3>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
        {displayedVideos.map((v) => (
          <div
            key={v.id}
            className="overflow-hidden transition-transform bg-gray-800 shadow-lg cursor-pointer hover:scale-105"
            onClick={() => navigate(`/embed/${v.id}`)}
          >
            {/* Thumbnail with duration overlay */}
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

              {/* Duration (bottom-left) */}
              {v.duration && (
                <div className="absolute bottom-1 left-1 text-white text-[10px] px-1.5 py-0.5 rounded">
                  {v.duration}
                </div>
              )}
            </div>

            {/* Video Info */}
            <div className="p-1.5">
              

              {/* Description */}
              <div className="text-[10px] text-gray-300 line-clamp-2">{v.description}</div>

              {/* Views */}
              <div className="flex items-center gap-1 text-[11px] text-gray-400">
                <FaEye className="w-3 h-3" />
                <span>{formatViews(v.views ?? 0)}</span>

              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show More Button */}
      {relatedVideos.length > limit && !showAll && (
        <button
          className="w-full px-3 py-2 mt-2 text-xs font-semibold text-pink-500 "
          onClick={() => setShowAll(true)}
        >
          See More
        </button>
      )}
    </div>
  );
};

export default Related;
