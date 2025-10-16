import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Related = ({ relatedVideos }) => {
  const navigate = useNavigate();
  const [showAll, setShowAll] = useState(false);

  if (!relatedVideos || relatedVideos.length === 0)
    return <p className="text-gray-400">No related videos found.</p>;

  const limit = 4; // Number of videos to show initially (mobile + desktop)
  const displayedVideos = showAll ? relatedVideos : relatedVideos.slice(0, limit);

  return (
    <div className="flex-shrink-0 w-full lg:w-1/4">
      <h3 className="mb-2 font-semibold text-pink-500 text-md">Related Videos</h3>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
        {displayedVideos.map((v) => (
          <div
            key={v.id}
            className="overflow-hidden transition-transform bg-gray-800 rounded-lg shadow-lg cursor-pointer hover:scale-105"
            onClick={() => navigate(`/embed/${v.id}`)}
          >
            <div className="w-full bg-black pointer-events-none aspect-video">
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
                <video src={v.url} className="object-cover w-full h-full" />
              )}
            </div>
            <div className="p-1.5">
              <div className="text-pink-500 text-[10px] mb-1">
                Added: {v.added ? new Date(v.added).toLocaleDateString() : ""} |{" "}
                <b>{v.category}</b>
              </div>
              <div className="text-xs text-gray-300 line-clamp-2">{v.description}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Show More Button */}
      {relatedVideos.length > limit && !showAll && (
        <button
          className="w-full px-3 py-2 mt-2 text-xs font-semibold text-white bg-pink-600 rounded hover:bg-pink-500"
          onClick={() => setShowAll(true)}
        >
          See More
        </button>
      )}
    </div>
  );
};

export default Related;
