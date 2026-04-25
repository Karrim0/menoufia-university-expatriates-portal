import React, { useState, useEffect } from "react";

const FALLBACK_IMAGE = "../raes.jpg";

// Known image base paths on the university server
const UPLOADS_BASE_URL = "https://mu.menofia.edu.eg/uploads/";
const PRTL_FILES_BASE_URL = "https://mu.menofia.edu.eg/PrtlFiles/";

export const getImageUrl = (img) => {
  if (!img) return "";

  // Already a full URL — use as-is
  if (img.startsWith("http://") || img.startsWith("https://")) {
    return img;
  }

  // Starts with PrtlFiles path (e.g. "PrtlFiles/Sectors/...")
  if (img.startsWith("PrtlFiles/") || img.startsWith("/PrtlFiles/")) {
    const cleaned = img.replace(/^\//, "");
    return `https://mu.menofia.edu.eg/${cleaned}`;
  }

  // Starts with uploads path
  if (img.startsWith("uploads/") || img.startsWith("/uploads/")) {
    const cleaned = img.replace(/^\//, "");
    return `https://mu.menofia.edu.eg/${cleaned}`;
  }

  // Starts with a slash (absolute path on server)
  if (img.startsWith("/")) {
    return `https://mu.menofia.edu.eg${img}`;
  }

  // Just a GUID filename — default to uploads
  return `${UPLOADS_BASE_URL}${img}`;
};

export const SmartImage = ({ src, alt = "", className = "", style = {} }) => {
  const [status, setStatus] = useState("loading");
  const [imgSrc, setImgSrc] = useState(src || FALLBACK_IMAGE);

  useEffect(() => {
    if (!src) {
      setImgSrc(FALLBACK_IMAGE);
      setStatus("fallback");
      return;
    }

    setImgSrc(src);
    setStatus("loading");
  }, [src]);

  const handleLoad = () => {
    setStatus("loaded");
  };

  const handleError = () => {
    if (imgSrc !== FALLBACK_IMAGE) {
      setImgSrc(FALLBACK_IMAGE);
      setStatus("fallback");
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      loading="lazy"
      // crossOrigin removed — not needed for <img> display and causes ORB issues
      onLoad={handleLoad}
      onError={handleError}
      style={{
        ...style,
        backgroundColor: status === "loading" ? "#e8ecf1" : "transparent",
        objectFit: "cover",
        transition: "opacity 0.3s ease",
        opacity: status === "loading" ? 0 : 1,
      }}
    />
  );
};