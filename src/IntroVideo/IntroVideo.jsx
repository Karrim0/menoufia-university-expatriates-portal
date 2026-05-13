import { useRef, useState } from "react";
import "./IntroVideo.css";
import introVideo from "../assets/intro-video.mp4";

export default function IntroVideo({ onClose }) {
  const videoRef = useRef(null);
  const [isWatching, setIsWatching] = useState(false);

  const handleWatchVideo = () => {
    setIsWatching(true);

    setTimeout(() => {
      videoRef.current?.play();
    }, 100);
  };

  return (
    <div className="intro-video-overlay">
      <div
        className={`intro-video-modal ${isWatching ? "watching-video" : ""}`}
        dir="rtl"
      >
        <button
          className="intro-video-close"
          onClick={onClose}
          aria-label="Close intro video"
        >
          ×
        </button>

        {!isWatching && (
          <>
            <h1 className="intro-video-title">مرحبا بك في جامعة المنوفية</h1>

            <p className="intro-video-subtitle">
              شاهد هذا الفيديو للتعرف على موقعنا
            </p>
          </>
        )}

        <div className="intro-video-frame">
          <video
            ref={videoRef}
            className="intro-video-player"
            src={introVideo}
            muted={!isWatching}
            playsInline
            controls={isWatching}
            onEnded={onClose}
          />
        </div>

        {!isWatching && (
          <div className="intro-video-actions">
            <button className="intro-video-skip" onClick={onClose}>
              تخطي الفيديو
            </button>

            <button className="intro-video-watch" onClick={handleWatchVideo}>
              شاهد الفيديو
            </button>
          </div>
        )}
      </div>
    </div>
  );
}