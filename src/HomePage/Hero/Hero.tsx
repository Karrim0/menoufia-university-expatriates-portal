import "./Hero.css";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import defaultImg from "../../assets/raes.jpg";
import { Link } from "react-router-dom";

// ─── SmartImage with cleanup ───
const SmartImage = ({ src, alt = "", className }: {
  src: string;
  alt?: string;
  className?: string;
}) => {
  const [imageSrc, setImageSrc] = useState(defaultImg);

  useEffect(() => {
    if (!src) return;
    let cancelled = false;
    const img = new Image();
    img.src = src;
    img.onload = () => { if (!cancelled) setImageSrc(src); };
    return () => { cancelled = true; };
  }, [src]);

  return <img src={imageSrc} alt={alt} className={className} />;
};

// ─── Tooltip ───
const Tooltip = ({ text }: { text: string }) => (
  <div className="hero-tooltip" role="tooltip">{text}</div>
);

function Hero({ News }: { News: any[] }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === "rtl";

  const isFeaturedimages = useMemo(() => {
    const source = News.some((n) => n.isFeatured)
      ? News.filter((n) => n.isFeatured)
      : News;

    return source.flatMap((news) =>
      news.newsImg
        ? [{ url: news.newsImg, head: news.newsDetails?.head || "", id: news.id }]
        : []
    );
  }, [News , i18n.language]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused]         = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  const startAutoSlide = useCallback(() => {
    return setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % isFeaturedimages.length);
    }, 3500);
  }, [isFeaturedimages.length]);

  useEffect(() => {
    if (!isPaused && isFeaturedimages.length > 0) {
      const interval = startAutoSlide();
      return () => clearInterval(interval);
    }
  }, [isPaused, startAutoSlide, isFeaturedimages.length]);

  if (!isFeaturedimages.length) return null;

  return (
    <div className="hero-carousel-wrapper">
      <div className="hero-carousel-main">
        <div
          className="hero-carousel-track"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {isFeaturedimages.map((item, index) => (
            <div key={index} className="hero-carousel-slide">
              <SmartImage
                src={item.url}
                alt={`University slide ${index + 1}`}
                className="hero-carousel-image"
              />

              <div className="hero-carousel-overlay" />

              <section
                className={`hero-content-card ${isRTL ? "card-rtl" : "card-ltr"}`}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
              >
                <h1 className={`hero-main-heading ${isRTL ? "font-ar" : "font-en"}`}>
                  {item.head?.slice(0, 150) ?? item.head}
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
          {isFeaturedimages.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`hero-pagination-dot ${currentIndex === index ? "hero-pagination-dot-active" : ""}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Hero;