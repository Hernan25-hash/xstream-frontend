import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";

const Seo = ({ videoId }) => {
  const [seo, setSeo] = useState(null);

  useEffect(() => {
    if (!videoId) return;

    const fetchSeo = async () => {
      try {
        // ✅ Use Vite environment variable or fallback to Render URL
        const apiBase =
          import.meta.env.VITE_API_URL ||
          "https://xstream-backend-ztkx.onrender.com";

        const res = await fetch(`${apiBase}/seo/${videoId}`);
        const data = await res.json();

        if (data.success && data.seo) {
          setSeo(data.seo);
        }
      } catch (err) {
        console.error("Failed to fetch SEO:", err);
      }
    };

    fetchSeo();
  }, [videoId]);

  // 🟡 If no SEO data yet, prevent crawlers from indexing
  if (!seo) {
    return (
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
    );
  }

  const {
    title = "XStream Video",
    description = "Watch the latest videos on XStream",
    keywords = [],
    og = {},
    jsonLD = {},
  } = seo;

  // ✅ Extract video URL if og.ogVideo is iframe HTML
  const extractVideoSrc = (iframeHtml) => {
    if (!iframeHtml) return "";
    const match = iframeHtml.match(/src=["']([^"']+)["']/);
    return match ? match[1] : "";
  };

  const videoUrl = extractVideoSrc(og.ogVideo);
  const thumbnail = og.ogImage || "";

  return (
    <Helmet>
      {/* ✅ Basic SEO */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(", ")} />
      )}

      {/* ✅ Open Graph / Facebook */}
      <meta property="og:title" content={og.ogTitle || title} />
      <meta property="og:description" content={og.ogDescription || description} />
      {thumbnail && <meta property="og:image" content={thumbnail} />}
      {videoUrl && <meta property="og:video" content={videoUrl} />}

      {/* ✅ Twitter */}
      <meta
        name="twitter:card"
        content={videoUrl ? "player" : "summary_large_image"}
      />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {thumbnail && <meta name="twitter:image" content={thumbnail} />}
      {videoUrl && <meta name="twitter:player" content={videoUrl} />}

      {/* ✅ JSON-LD structured data */}
      {jsonLD && Object.keys(jsonLD).length > 0 && (
        <script type="application/ld+json">
          {JSON.stringify({
            ...jsonLD,
            embedUrl: videoUrl || jsonLD.embedUrl,
            contentUrl: videoUrl || jsonLD.contentUrl,
          })}
        </script>
      )}
    </Helmet>
  );
};

export default Seo;
