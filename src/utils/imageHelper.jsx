
import React, { useState, useEffect, useRef } from "react";

const FALLBACK_IMAGE = "../raes.jpg";
const UPLOADS_BASE_URL = "https://mu.menofia.edu.eg/uploads/";

export const getImageUrl = (img) => {
  if (!img) return "";
  if (img.startsWith("http://") || img.startsWith("https://")) return img;
  if (img.startsWith("PrtlFiles/") || img.startsWith("/PrtlFiles/")) return `https://mu.menofia.edu.eg/${img.replace(/^\//, "")}`;
  if (img.startsWith("uploads/") || img.startsWith("/uploads/")) return `https://mu.menofia.edu.eg/${img.replace(/^\//, "")}`;
  if (img.startsWith("/")) return `https://mu.menofia.edu.eg${img}`;
  return `${UPLOADS_BASE_URL}${img}`;
};

export const SmartImage = ({ src, alt = "", className = "", style = {} }) => {
  const [status, setStatus] = useState("loading");
  const [imgSrc, setImgSrc] = useState(src || FALLBACK_IMAGE);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!src) {
      setImgSrc(FALLBACK_IMAGE);
      setStatus("fallback");
      return;
    }
    setImgSrc(src);
    setStatus("loading");
  }, [src]);

  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current?.naturalWidth > 0) {
      setStatus("loaded");
    }
  }, [imgSrc]);

  const handleLoad = () => setStatus("loaded");

  const handleError = () => {
    if (imgSrc !== FALLBACK_IMAGE) {
      setImgSrc(FALLBACK_IMAGE);
      setStatus("fallback");
    }
  };

  return (
    <img
      ref={imgRef}
      src={imgSrc}
      alt={alt}
      className={className}
      loading="lazy"
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