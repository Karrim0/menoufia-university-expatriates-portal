import "./Hero.css";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import defaultImg from "../../assets/raes.jpg";
import { useNavigate } from "react-router-dom";

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
  const [fitMode, setFitMode] = useState<"cover" | "contain">("cover");

  useEffect(() => {
    setImageSrc(defaultImg);
    setFitMode("cover");

    if (!src) return;

    let cancelled = false;
    const img = new Image();

    img.src = src;

    img.onload = () => {
      if (cancelled) return;

      const imageRatio = img.naturalWidth / img.naturalHeight;

   
      const shouldUseContain = imageRatio < 1.45;

      setFitMode(shouldUseContain ? "contain" : "cover");
      setImageSrc(src);
    };

    img.onerror = () => {
      if (!cancelled) {
        setImageSrc(defaultImg);
        setFitMode("cover");
      }
    };

    return () => {
      cancelled = true;
    };
  }, [src]);

  return (
    <div
      className={`hero-image-frame ${
        fitMode === "contain" ? "hero-image-frame-contain" : ""
      }`}
    >
      {fitMode === "contain" && (
        <img
          src={imageSrc}
          alt=""
          aria-hidden="true"
          className="hero-carousel-image-bg"
        />
      )}

      <img
        src={imageSrc}
        alt={alt}
        className={`${className || ""} ${
          fitMode === "contain"
            ? "hero-carousel-image-contain"
            : "hero-carousel-image-cover"
        }`}
      />
    </div>
  );
};
// ─── Tooltip ───
const Tooltip = ({ text }: { text: string }) => (
  <div className="hero-tooltip" role="tooltip">
    {text}
  </div>
);

function Hero({ News }: { News: any[] }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

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
        news,
      }));
  }, [News]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);

  useEffect(() => {
    setCurrentIndex(0);
    setTooltipVisible(false);
  }, [i18n.language, featuredImages.length]);

  const goToDetails = useCallback(
    (item: any) => {
      if (!item?.id) return;

      window.scrollTo(0, 0);

      navigate(`/details/${item.id}`, {
        state: {
          news: item.news,
          newsType: "university",
        },
      });
    },
    [navigate]
  );

  const goToNextSlide = useCallback(() => {
    if (featuredImages.length <= 1) return;

    setCurrentIndex((prev) =>
      prev === featuredImages.length - 1 ? 0 : prev + 1
    );
  }, [featuredImages.length]);

  const goToPrevSlide = useCallback(() => {
    if (featuredImages.length <= 1) return;

    setCurrentIndex((prev) =>
      prev === 0 ? featuredImages.length - 1 : prev - 1
    );
  }, [featuredImages.length]);

  const startAutoSlide = useCallback(() => {
    return setInterval(() => {
      goToNextSlide();
    }, 3500);
  }, [goToNextSlide]);

  useEffect(() => {
    if (!isPaused && featuredImages.length > 1) {
      const interval = startAutoSlide();

      return () => clearInterval(interval);
    }
  }, [isPaused, startAutoSlide, featuredImages.length]);

  if (!featuredImages.length) return null;

  return (
    <div className="hero-carousel-wrapper" dir={isRTL ? "rtl" : "ltr"}>
      <div
        className="hero-carousel-main"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div
          className="hero-carousel-track"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
          }}
        >
          {featuredImages.map((item, index) => (
            <div
              key={`${item.id}-${i18n.language}`}
              className="hero-carousel-slide"
              role="link"
              tabIndex={0}
              onClick={() => goToDetails(item)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  goToDetails(item);
                }
              }}
            >
              <SmartImage
                src={item.url}
                alt={item.head || `University slide ${index + 1}`}
                className="hero-carousel-image"
              />

              <div className="hero-carousel-overlay" />

              <section
                className={`hero-content-card ${
                  isRTL ? "card-rtl" : "card-ltr"
                }`}
              >
                <h1
                  className={`hero-main-heading ${
                    isRTL ? "font-ar" : "font-en"
                  }`}
                >
                  {item.head ? item.head.slice(0, 150) : ""}
                </h1>

                <div className="hero-arrow-wrapper">
                  <div
                    className="hero-arrow-container"
                    onMouseEnter={() => setTooltipVisible(true)}
                    onMouseLeave={() => setTooltipVisible(false)}
                  >
                    <button
                      type="button"
                      className="hero-arrow-link"
                      aria-label={t("tooltip.details")}
                      onClick={(e) => {
                        e.stopPropagation();
                        goToDetails(item);
                      }}
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
                    </button>

                    {tooltipVisible && <Tooltip text={t("tooltip.details")} />}
                  </div>
                </div>
              </section>
            </div>
          ))}
        </div>

        {featuredImages.length > 1 && (
          <>
            <button
              type="button"
              className="hero-side-arrow hero-side-arrow-prev"
              onClick={(e) => {
                e.stopPropagation();
                goToPrevSlide();
              }}
              aria-label="Previous slide"
            >
              <i className="fa-solid fa-chevron-left" />
            </button>

            <button
              type="button"
              className="hero-side-arrow hero-side-arrow-next"
              onClick={(e) => {
                e.stopPropagation();
                goToNextSlide();
              }}
              aria-label="Next slide"
            >
              <i className="fa-solid fa-chevron-right" />
            </button>
          </>
        )}

        <div className="hero-pagination-dots">
          {featuredImages.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
              }}
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