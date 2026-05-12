import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Carousel.css";
import { useTranslation } from "react-i18next";
import defaultImg from "../../assets/raes.jpg";

const SmartImage = ({
  src,
  alt = "",
  className,
}: {
  src: string;
  alt?: string;
  className?: string;
}) => {
  const [imgSrc, setImgSrc] = useState(defaultImg);

  useEffect(() => {
    setImgSrc(defaultImg);

    if (!src) return;

    let cancelled = false;
    const img = new Image();

    img.src = src;

    img.onload = () => {
      if (!cancelled) setImgSrc(src);
    };

    img.onerror = () => {
      if (!cancelled) setImgSrc(defaultImg);
    };

    return () => {
      cancelled = true;
    };
  }, [src]);

  return <img src={imgSrc} alt={alt} className={className} />;
};

/* ─── formatDate ─── */
const formatDate = (dateStr: string, language: string) => {
  if (!dateStr) return "";

  const localeMap: Record<string, string> = {
    ar: "ar-EG",
    en: "en-US",
    fr: "fr-FR",
    de: "de-DE",
    it: "it-IT",
    ja: "ja-JP",
    ru: "ru-RU",
    tr: "tr-TR",
    fa: "fa-IR",
    ch: "en-US",
  };

  try {
    return new Date(dateStr).toLocaleDateString(
      localeMap[language] || "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );
  } catch {
    return dateStr;
  }
};

/* ─── NewsCarousel ─── */
export default function NewsCarousel({ News }: { News: any[] }) {
  const { t, i18n } = useTranslation();

  const isRTL = i18n.dir() === "rtl";
  const [tooltip, setTooltip] = useState<number | null>(null);

  useEffect(() => {
    setTooltip(null);
  }, [i18n.language]);

  const safeNews = Array.isArray(News) ? News : [];

  return (
    <div className="home-news-carousel" dir={isRTL ? "rtl" : "ltr"}>
      {/* SVG clip-path */}
      <svg
        className="carousel-clip-svg"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <clipPath id="carousel-img-clip" clipPathUnits="objectBoundingBox">
            <path d="M0.021,0.096 C0.021,0.043 0.068,0 0.126,0 L0.895,0 C0.953,0 1,0.043 1,0.096 L1,0.899 C1,0.965 0.926,1.009 0.858,0.985 L0.089,0.724 C0.048,0.710 0.021,0.673 0.021,0.634 Z" />
          </clipPath>
        </defs>
      </svg>

      <div className="home-news-carousel-wrapper">
        <div className="home-news-grid">
          {safeNews.slice(0, 9).map((news, index) => (
            <div key={`${news.id ?? index}-${i18n.language}`} className="carousel-item">
              <div className="carousel-item-box">
                <div
                  className={`carousel-item-layout ${
                    isRTL ? "layout-rtl font-ar" : "layout-ltr font-en"
                  }`}
                >
                  <div className="carousel-image-col">
                    <div className="carousel-image-wrapper">
                      <SmartImage
                        src={news.newsImg}
                        alt={news?.newsDetails?.head || "news"}
                        className="carousel-clipped-image"
                      />
                    </div>

                    <div
                      className="carousel-arrow-container"
                      onMouseEnter={() => setTooltip(index)}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      <Link
                        to={`/details/${news.id}`}
                        className="carousel-arrow-btn"
                        aria-label={t("tooltip.details")}
                        onClick={() => window.scrollTo(0, 0)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          height="24px"
                          viewBox="0 -960 960 960"
                          width="24px"
                        >
                          <path d="m242-246-42-42 412-412H234v-60h480v480h-60v-378L242-246Z" />
                        </svg>
                      </Link>

                      {tooltip === index && (
                        <div className="carousel-tooltip" role="tooltip">
                          {t("tooltip.details")}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="carousel-text-col">
                    <h3 className="carousel-heading">
                      {news?.newsDetails?.head || ""}
                    </h3>

                    <p className="carousel-abbr">
                      {news?.newsDetails?.abbr?.slice(0, 90) || ""}
                      {(news?.newsDetails?.abbr?.length || 0) > 90 ? "..." : ""}
                    </p>

                    <span className="carousel-date">
                      {formatDate(news?.date, i18n.language)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="carousel-more-btn-wrapper">
        <Link to="/news" className="carousel-more-link">
          {t("header.More News")}
        </Link>
      </div>
    </div>
  );
}