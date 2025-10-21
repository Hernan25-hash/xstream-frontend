import React from "react";
import { Helmet } from "react-helmet";

const VideoSEO = ({ video }) => {
  if (!video) return null;

  const pageUrl = `https://xsecrets.xyz/embed/${video.id}`;
  const title = video.description || "Watch Exclusive Video on XStream";
  const description = video.category
    ? `${video.category} — ${video.description}`
    : video.description || "Adult video content on XStream.";
  const image = video.thumbnail || "https://xsecrets.xyz/default-thumbnail.jpg";
  const videoUrl = video.url || "";

  return (
    <Helmet>
      {/* Dynamic Page Title */}
      <title>{title}</title>

      {/* Standard SEO */}
      <meta name="description" content={description} />
      <meta name="keywords" content={`${video.category || "adult"}, xstream, xsecrets, video`} />
      <link rel="canonical" href={pageUrl} />

      {/* Open Graph / Facebook / Messenger / Telegram */}
      <meta property="og:type" content="video.other" />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:video" content={videoUrl} />
      <meta property="og:video:type" content="video/mp4" />
      <meta property="og:video:width" content="1280" />
      <meta property="og:video:height" content="720" />

      {/* Twitter / X */}
      <meta name="twitter:card" content="player" />
      <meta name="twitter:site" content="@YourTwitterHandle" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:player" content={pageUrl} />
      <meta name="twitter:player:width" content="1280" />
      <meta name="twitter:player:height" content="720" />

      {/* Extra for Telegram & SEO */}
      <meta property="og:site_name" content="XStream Secrets" />
      <meta name="author" content="XStream Team" />
    </Helmet>
  );
};

export default VideoSEO;
