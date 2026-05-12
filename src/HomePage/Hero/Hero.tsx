import "./Hero.css";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import defaultImg from "../../assets/raes.jpg";
import { Link } from "react-router-dom";

// ─── SmartImage with cleanup ───
const SmartImage = ({
  src,
  alt = "",
  className,
}: {
  src: string;
  alt?: string;
  className?: string;
}) => {
  const [imageSrc, setImageSrc] = useState(defaultImg);

  useEffect(() => {
    setImageSrc(defaultImg);

    if (!src) return;

    let cancelled = false;
    const img = new Image();

    img.src = src;

    img.onload = () => {
      if (!cancelled) setImageSrc(src);
    };

    img.onerror = () => {
      if (!cancelled) setImageSrc(defaultImg);
    };

    return () => {
      cancelled = true;
    };
  }, [src]);

  return <img src={imageSrc} alt={alt} className={className} />;
};

// ─── Tooltip ───
const Tooltip = ({ text }: { text: string }) => (
  <div className="hero-tooltip" role="tooltip">
    {text}
  </div>
);

function Hero({ News }: { News: any[] }) {
  const { t, i18n } = useTranslation();

  const isRTL = i18n.dir() === "rtl";

  const featuredImages = useMemo(() => {
    const safeNews = Array.isArray(News) ? News : [];

    const source = safeNews.some((n) => n?.isFeatured)
      ? safeNews.filter((n) => n?.isFeatured)
      : safeNews;

    return source
      .filter((news) => news?.newsImg)
      .map((news) => ({
        url: news.newsImg,
        head: news?.newsDetails?.head || "",
        id: news.id,
      }));
  }, [News]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  useEffect(() => {
    setCurrentIndex(0);
    setTooltipVisible(false);
  }, [i18n.language, featuredImages.length]);

  const startAutoSlide = useCallback(() => {
    return setInterval(() => {
      setCurrentIndex((prev) => {
        if (featuredImages.length === 0) return 0;
        return (prev + 1) % featuredImages.length;
      });
    }, 3500);
  }, [featuredImages.length]);

  useEffect(() => {
    if (!isPaused && featuredImages.length > 1) {
      const interval = startAutoSlide();

      return () => clearInterval(interval);
    }
  }, [isPaused, startAutoSlide, featuredImages.length]);

  if (!featuredImages.length) return null;

  return (
    <div className="hero-carousel-wrapper" dir={isRTL ? "rtl" : "ltr"}>
      <div className="hero-carousel-main">
        <div
          className="hero-carousel-track"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
          }}
        >
          {featuredImages.map((item, index) => (
            <div key={`${item.id}-${i18n.language}`} className="hero-carousel-slide">
              <SmartImage
                src={item.url}
                alt={item.head || `University slide ${index + 1}`}
                className="hero-carousel-image"
              />

              <div className="hero-carousel-overlay" />

              <section
                className={`hero-content-card ${isRTL ? "card-rtl" : "card-ltr"}`}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
              >
                <h1 className={`hero-main-heading ${isRTL ? "font-ar" : "font-en"}`}>
                  {item.head ? item.head.slice(0, 150) : ""}
                </h1>

                <div className="hero-arrow-wrapper">
                  <div
                    className="hero-arrow-container"
                    onMouseEnter={() => setTooltipVisible(true)}
                    onMouseLeave={() => setTooltipVisible(false)}
                  >
                    <Link
                      to={`/details/${item.id}`}
                      className="hero-arrow-link"
                      aria-label={t("tooltip.details")}
                      onClick={() => window.scrollTo(0, 0)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="24px"
                        viewBox="0 -960 960 960"
                        width="24px"
                        fill="#1f1f1f"
                      >
                        <path d="m242-246-42-42 412-412H234v-60h480v480h-60v-378L242-246Z" />
                      </svg>
                    </Link>

                    {tooltipVisible && <Tooltip text={t("tooltip.details")} />}
                  </div>
                </div>
              </section>
            </div>
          ))}
        </div>

        <div className="hero-pagination-dots">
          {featuredImages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`hero-pagination-dot ${
                currentIndex === index ? "hero-pagination-dot-active" : ""
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Hero;