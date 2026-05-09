import React, { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import newsService from "../Services/newsService";
import { SmartImage } from "../utils/imageHelper";
import "./FacultyNewsDetails.css";

interface Language {
  id: number;
  name: string;
  code: string;
  flag: string;
}

interface NewsDetails {
  id: number;
  title: string;
  date: string;
  currentDate: string;
  image: string;
  source: string;
  imageAlt: string;
  body: string;
  languages: Language[];
}

type SavedLang = { id?: number; code?: string; name?: string; flag?: string };

const getSavedLang = (): SavedLang => {
  try { return JSON.parse(localStorage.getItem("lang") || "{}"); }
  catch { return {}; }
};

const FacultyNewsDetails: React.FC = () => {
  const { id }       = useParams<{ id: string }>();
  const location     = useLocation();
  const navigate     = useNavigate();
  const { i18n }     = useTranslation();

  const savedLang    = getSavedLang();
  const isArabic     = savedLang?.code === "ar" || i18n.language === "ar";
  const isRTL        = isArabic;

  const fac: number         = location.state?.fac || 0;
  const collegeName: string = location.state?.collegeName || "";

  const currentSavedLangId = Number(getSavedLang()?.id) || 2;

  const [langId, setLangId]     = useState<number>(currentSavedLangId);
  const [news, setNews]         = useState<NewsDetails | null>(null);
  const [loading, setLoading]   = useState(true);
  const [noLang, setNoLang]     = useState(false); // الخبر مش موجود باللغة دي

  useEffect(() => {
    const newLangId = Number(getSavedLang()?.id) || 2;
    setLangId(newLangId);
  }, [i18n.language]);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!id || !fac) {
        setNoLang(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      setNoLang(false);

      try {
        const data = await newsService.getFacultyNewsDetails(
          Number(id),
          fac,
          langId
        );

        if (data?.success && data?.result) {
          setNews(data.result);
        } else {
          setNews(null);
          setNoLang(true);
        }
      } catch {
        setNews(null);
        setNoLang(true);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id, fac, langId]);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
      year: "numeric", month: "long", day: "numeric",
    });
  };

  const handleLangSwitch = (newLangId: number) => {
    setLangId(newLangId);
  };

  const handleBack = () => {
    navigate(`/faculty-news/${fac}`, {
      state: {
        collegeName,
        langId, 
      },
    });
  };

  return (
    <div className="fnd-wrapper" dir={isRTL ? "rtl" : "ltr"}>

      {/* ── Breadcrumb ── */}
      <div className="fnd-breadcrumb">
        <Link to="/" className="fnd-breadcrumb-link">
          {isArabic ? "الرئيسية" : "Home"}
        </Link>
        <span className="fnd-breadcrumb-sep">›</span>
        <span className="fnd-breadcrumb-link" onClick={handleBack} style={{ cursor: "pointer" }}>
          {collegeName || (isArabic ? "أخبار الكلية" : "Faculty News")}
        </span>
        <span className="fnd-breadcrumb-sep">›</span>
        <span className="fnd-breadcrumb-current">
          {isArabic ? "تفاصيل الخبر" : "News Details"}
        </span>
      </div>

      {loading ? (
        <div className="fnd-loading-wrap">
          <div className="fnd-spinner" />
        </div>

      ) : noLang ? (
        <div className="fnd-no-lang-wrap">
          <div className="fnd-no-lang-icon">🌐</div>
          <h2 className="fnd-no-lang-title">
            {isArabic
              ? "هذا الخبر غير متاح باللغة الحالية"
              : "This news is not available in the current language"}
          </h2>
          <p className="fnd-no-lang-sub">
            {isArabic
              ? "يمكنك اختيار لغة أخرى أو الرجوع لأخبار الكلية"
              : "You can choose another language or go back to faculty news"}
          </p>

          {news?.languages && news.languages.length > 0 && (
            <div className="fnd-lang-switcher fnd-no-lang-switcher">
              {news.languages.map((lang) => (
                <button
                  key={lang.id}
                  className={`fnd-lang-btn ${langId === lang.id ? "active" : ""}`}
                  onClick={() => handleLangSwitch(lang.id)}
                >
                  {lang.flag && (
                    <img src={lang.flag} alt={lang.code} className="fnd-lang-flag" />
                  )}
                  {lang.name}
                </button>
              ))}
            </div>
          )}

          <button className="fnd-back-btn fnd-no-lang-back" onClick={handleBack}>
            {isArabic ? "→ رجوع لأخبار الكلية" : "← Back to Faculty News"}
          </button>
        </div>

      ) : news ? (
        <article className="fnd-article">

          {/* ── Header ── */}
          <header className="fnd-header">
            <h1 className="fnd-title">{news.title}</h1>

            <div className="fnd-meta">
              {news.source && (
                <span className="fnd-meta-item">
                  <i className="fa-solid fa-user" />
                  {news.source}
                </span>
              )}
              {news.date && (
                <span className="fnd-meta-item">
                  <i className="fa-regular fa-calendar" />
                  {formatDate(news.date)}
                </span>
              )}
            </div>

            {news.languages && news.languages.length > 1 && (
              <div className="fnd-lang-section">
                <span className="fnd-lang-label">
                  <i className="fa-solid fa-globe" />
                  {isArabic ? "متاح بـ:" : "Available in:"}
                </span>
                <div className="fnd-lang-switcher">
                  {news.languages.map((lang) => (
                    <button
                      key={lang.id}
                      className={`fnd-lang-btn ${langId === lang.id ? "active" : ""}`}
                      onClick={() => handleLangSwitch(lang.id)}
                      title={lang.name}
                    >
                      {lang.flag && (
                        <img src={lang.flag} alt={lang.code} className="fnd-lang-flag" />
                      )}
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </header>

          {/* ── Hero Image ── */}
          {news.image && (
            <div className="fnd-img-wrap">
              <SmartImage
                src={news.image}
                alt={news.imageAlt || news.title}
              />
            </div>
          )}

          {/* ── Body ── */}
          {news.body && (
            <div
              className="fnd-body"
              dangerouslySetInnerHTML={{ __html: news.body }}
            />
          )}

          {/* ── Footer ── */}
          <div className="fnd-footer">
            <button className="fnd-back-btn" onClick={handleBack}>
              {isArabic ? "→ رجوع لأخبار الكلية" : "← Back to Faculty News"}
            </button>
          </div>

        </article>
      ) : null}
    </div>
  );
};

export default FacultyNewsDetails;