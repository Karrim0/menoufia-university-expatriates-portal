import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Calendar, X } from "lucide-react";
import newsService from "../Services/newsService";
import { SmartImage } from "../utils/imageHelper";
import "../NewsPage/News.css";
import "../NewsPage/News.filter.css";
import "./FacultyNews.css";

// ─── Assets ─────────────────────────────────────────────
import logo from "../../src/assets/logo.jpg";
import headerBg from "../../src/assets/01.jpg";

const ITEMS_PER_PAGE = 10;
const DEBOUNCE_DELAY = 500;

interface NewsItem {
  id: number;
  title: string;
  date: string;
  currentDate?: string;
  image: string;
  source: string;
  imageAlt: string;
}

interface HighlightItem {
  id: number;
  startDate: string;
  endDate: string;
  image: string;
  translationData: string;
}

type SavedLang = {
  id?: number;
  code?: string;
  name?: string;
  flag?: string;
};

const LANGUAGE_IDS = {
  ar: 1,
  en: 2,
  fr: 3,
  ja: 23,
  de: 24,
  tr: 25,
  fa: 26,
  ru: 27,
  ch: 28,
  it: 29,
};

const DATE_FILTERS = [
  { value: 0, labelAr: "كل الأخبار", labelEn: "All News" },
  { value: 2, labelAr: "اليوم", labelEn: "Today" },
  { value: 3, labelAr: "آخر أسبوع", labelEn: "Last Week" },
  { value: 4, labelAr: "آخر شهر", labelEn: "Last Month" },
];

const detectSearchLanguageId = (text: string, fallbackLangId: number) => {
  const value = text.trim();
  if (!value) return fallbackLangId;
  if (/[پچژگک‌ی]/.test(value)) return LANGUAGE_IDS.fa;
  if (/[\u0600-\u06FF]/.test(value)) return LANGUAGE_IDS.ar;
  if (/[\u0400-\u04FF]/.test(value)) return LANGUAGE_IDS.ru;
  if (/[\u3040-\u30FF\u31F0-\u31FF]/.test(value)) return LANGUAGE_IDS.ja;
  if (/[\u4E00-\u9FFF]/.test(value)) return LANGUAGE_IDS.ch;
  if (/[çğıöşüÇĞİÖŞÜ]/.test(value)) return LANGUAGE_IDS.tr;
  if (/[äöüßÄÖÜ]/.test(value)) return LANGUAGE_IDS.de;
  if (/[âæçêëîïôœûüÿÂÆÇÊËÎÏÔŒÛÜŸ]/.test(value)) return LANGUAGE_IDS.fr;
  if (/[àèéìíîòóùúÀÈÉÌÍÎÒÓÙÚ]/.test(value)) return LANGUAGE_IDS.it;
  return LANGUAGE_IDS.en;
};

const normalizeName = (value: string): string =>
  String(value || "")
    .trim()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .toLowerCase();

const FAC_MAP: Record<string, number> = {
  [normalizeName("كلية العلوم")]: 100,
  [normalizeName("كلية علوم")]: 100,
  [normalizeName("Faculty of Science")]: 100,
  [normalizeName("كلية الطب")]: 200,
  [normalizeName("Faculty of Medicine")]: 200,
  [normalizeName("كلية الزراعة")]: 300,
  [normalizeName("كليه الزراعه")]: 300,
  [normalizeName("Faculty of Agriculture")]: 300,
  [normalizeName("كلية الهندسة")]: 400,
  [normalizeName("كليه الهندسه")]: 400,
  [normalizeName("Faculty of Engineering")]: 400,
  [normalizeName("كلية التجارة")]: 500,
  [normalizeName("كليه التجاره")]: 500,
  [normalizeName("Faculty of Commerce")]: 500,
  [normalizeName("كلية الحقوق")]: 600,
  [normalizeName("Faculty of Law")]: 600,
  [normalizeName("كلية طب الأسنان")]: 700,
  [normalizeName("كلية طب الاسنان")]: 700,
  [normalizeName("Faculty of Dentistry")]: 700,
  [normalizeName("كلية التمريض")]: 800,
  [normalizeName("Faculty of Nursing")]: 800,
  [normalizeName("كلية الصيدلة")]: 900,
  [normalizeName("كليه الصيدله")]: 900,
  [normalizeName("Faculty of Pharmacy")]: 900,
  [normalizeName("كلية الطب البيطري")]: 1000,
  [normalizeName("كلية الطب البيطرى")]: 1000,
  [normalizeName("Faculty of Veterinary Medicine")]: 1000,
  [normalizeName("كلية الذكاء الاصطناعي")]: 1100,
  [normalizeName("Faculty of Artificial Intelligence")]: 1100,
  [normalizeName("كلية الآداب")]: 1200,
  [normalizeName("كلية الاداب")]: 1200,
  [normalizeName("Faculty of Arts")]: 1200,
  [normalizeName("كلية العلوم التطبيقية")]: 1300,
  [normalizeName("كلية العلوم الطبية التطبيقية")]: 1300,
  [normalizeName("Faculty of Applied Health Sciences Technology")]: 1300,
  [normalizeName("كلية التربية للطفولة المبكرة")]: 1400,
  [normalizeName("كلية تربية الطفولة المبكره")]: 1400,
  [normalizeName("Faculty of Early Childhood Education")]: 1400,
  [normalizeName("كلية التربية")]: 1500,
  [normalizeName("كلية تربية")]: 1500,
  [normalizeName("Faculty of Education")]: 1500,
  [normalizeName("كلية التربية النوعية")]: 1600,
  [normalizeName("Faculty of Specific Education")]: 1600,
  [normalizeName("كلية الفنون الجميلة")]: 1700,
  [normalizeName("Faculty of Fine Arts")]: 1700,
  [normalizeName("كلية الحاسبات والمعلومات")]: 1800,
  [normalizeName("كلية الحاسبات")]: 1800,
  [normalizeName("Faculty of Computers and Information")]: 1800,
  [normalizeName("كلية الهندسة الالكترونية")]: 1900,
  [normalizeName("كلية الهندسة الإلكترونية")]: 1900,
  [normalizeName("Faculty of Electronic Engineering")]: 1900,
  [normalizeName("FEE")]: 1900,
  [normalizeName("كلية التربية الرياضية")]: 2000,
  [normalizeName("Faculty of Physical Education")]: 2000,
  [normalizeName("كلية الاقتصاد المنزلي")]: 2100,
  [normalizeName("كلية الاقتصاد المنزلى")]: 2100,
  [normalizeName("Faculty of Home Economics")]: 2100,
  [normalizeName("Ho")]: 2200,
  [normalizeName("معهد الكبد القومي")]: 2300,
  [normalizeName("LIV")]: 2300,
  [normalizeName("National Liver Institute")]: 2300,
  [normalizeName("كلية الإعلام")]: 2400,
  [normalizeName("كلية الاعلام")]: 2400,
  [normalizeName("Faculty of Mass Communication")]: 2400,
};

const getFac = (title: string): number | null =>
  FAC_MAP[normalizeName(title)] ?? null;

const getSavedLang = (): SavedLang => {
  try {
    return JSON.parse(localStorage.getItem("lang") || "{}");
  } catch {
    return {};
  }
};

const getSavedLangId = () => Number(getSavedLang()?.id) || 1;

const normalizeApiResponse = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.result)) return data.result;
  return [];
};

const FacultyNews: React.FC = () => {
  const { fac } = useParams<{ fac: string }>();
  const location = useLocation();
  const { i18n } = useTranslation();

  const savedLang = getSavedLang();
  const isArabic = savedLang?.code === "ar" || i18n.language === "ar";
  const isRTL = isArabic;

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstSearchRender = useRef(true);

  const [langId, setLangId] = useState<number>(
    Number(location.state?.langId) || getSavedLangId()
  );

  const [collegeNameFallback, setCollegeNameFallback] = useState<string>("");
  const [collegeName, setCollegeName] = useState<string>("");

  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [highlights, setHighlights] = useState<HighlightItem[]>([]);
  const [highlightsLoading, setHighlightsLoading] = useState(false);
  const [activeHighlightIndex, setActiveHighlightIndex] = useState(0);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const [pageIndex, setPageIndex] = useState(1);
  const [moveNext, setMoveNext] = useState(false);
  const [movePrevious, setMovePrevious] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  const [dateFilter, setDateFilter] = useState<number>(0);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  useEffect(() => {
    let count = 0;
    if (dateFilter !== 0) count++;
    if (fromDate) count++;
    if (toDate) count++;
    setActiveFiltersCount(count);
  }, [dateFilter, fromDate, toDate]);

  useEffect(() => {
    const fetchCollegeName = async () => {
      const currentLangId = getSavedLangId();
      const facultyCode = Number(fac);

      setLangId(currentLangId);
      setPageIndex(1);
      setSearch("");
      setSearchInput("");
      setDateFilter(0);
      setFromDate("");
      setToDate("");
      setActiveHighlightIndex(0);

      try {
        const response = await newsService.getColleges(currentLangId);
        const colleges = normalizeApiResponse(response);

        const matchedCollege = colleges.find(
          (college: any) => getFac(college.title) === facultyCode
        );

        if (matchedCollege?.title) {
          setCollegeName(matchedCollege.title);
        } else {
          setCollegeName(collegeNameFallback || "");
        }

        if (currentLangId !== 2) {
          const enResponse = await newsService.getColleges(2);
          const enColleges = normalizeApiResponse(enResponse);

          const enMatch = enColleges.find(
            (college: any) => getFac(college.title) === facultyCode
          );

          if (enMatch?.title) {
            setCollegeNameFallback(enMatch.title);
            if (!matchedCollege?.title) setCollegeName(enMatch.title);
          }
        } else if (matchedCollege?.title) {
          setCollegeNameFallback(matchedCollege.title);
        }
      } catch (error) {
        console.error("Failed to fetch college name:", error);
        setCollegeName(collegeNameFallback || "");
      }
    };

    fetchCollegeName();
  }, [fac, i18n.language]);

  const getSearchLangId = useCallback(
    (term: string) =>
      term.trim() ? detectSearchLanguageId(term, Number(langId)) : Number(langId),
    [langId]
  );

  const getActiveSearchLangId = () =>
    search.trim() ? detectSearchLanguageId(search, Number(langId)) : Number(langId);

  const fetchHighlights = useCallback(async () => {
    const facultyCode = Number(fac);
    if (!facultyCode || !langId) { setHighlights([]); return; }

    const activeLangId = getSearchLangId(search);
    setHighlightsLoading(true);

    try {
      const data = await newsService.getHighlights({
        fac: facultyCode,
        langId: activeLangId,
        pageIndex: 1,
        pageSize: 10,
        search,
        ...(fromDate ? { fromDate } : {}),
        ...(toDate ? { toDate } : {}),
      });

      const result: HighlightItem[] = Array.isArray(data?.result) ? data.result : [];
      setHighlights(result);
      setActiveHighlightIndex(0);
    } catch (error) {
      console.error("Failed to fetch faculty highlights:", error);
      setHighlights([]);
      setActiveHighlightIndex(0);
    } finally {
      setHighlightsLoading(false);
    }
  }, [fac, langId, search, fromDate, toDate, getSearchLangId]);

  const fetchNews = useCallback(async () => {
    const facultyCode = Number(fac);
    if (!facultyCode || !langId) {
      setNews([]);
      setMoveNext(false);
      setMovePrevious(false);
      setLoading(false);
      return;
    }

    const activeLangId = getSearchLangId(search);
    setLoading(true);

    try {
      const data = await newsService.getFacultyNews({
        fac: facultyCode,
        langId: activeLangId,
        pageIndex,
        pageSize: ITEMS_PER_PAGE,
        search,
        ...(dateFilter !== 0 ? { dateFilter } : {}),
        ...(fromDate ? { fromDate } : {}),
        ...(toDate ? { toDate } : {}),
      });

      const result: NewsItem[] = Array.isArray(data?.result) ? data.result : [];
      setNews(result);
      setMoveNext(Boolean(data?.moveNext));
      setMovePrevious(Boolean(data?.movePrevious));
    } catch (error) {
      console.error("Failed to fetch faculty news:", error);
      setNews([]);
      setMoveNext(false);
      setMovePrevious(false);
    } finally {
      setLoading(false);
    }
  }, [fac, langId, pageIndex, search, dateFilter, fromDate, toDate, getSearchLangId]);

  useEffect(() => { fetchNews(); }, [fetchNews]);
  useEffect(() => { fetchHighlights(); }, [fetchHighlights]);

  useEffect(() => {
    if (isFirstSearchRender.current) { isFirstSearchRender.current = false; return; }
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(() => {
      setPageIndex(1);
      setSearch(searchInput.trim());
    }, DEBOUNCE_DELAY);

    return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current); };
  }, [searchInput]);

  useEffect(() => {
    if (highlights.length === 0) return;
    const timer = setInterval(() => {
      setActiveHighlightIndex((prev) =>
        prev === highlights.length - 1 ? 0 : prev + 1
      );
    }, 5000);
    return () => clearInterval(timer);
  }, [highlights.length]);

  const handleManualSearch = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setPageIndex(1);
    setSearch(searchInput.trim());
  };

  const handleClearSearch = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setSearchInput("");
    setSearch("");
    setPageIndex(1);
  };

  const handleClearAllFilters = () => {
    setDateFilter(0);
    setFromDate("");
    setToDate("");
    setPageIndex(1);
  };

  const handleApplyDateFilter = (value: number) => {
    setDateFilter((prev) => (prev === value ? 0 : value));
    if (value !== 0) { setFromDate(""); setToDate(""); }
    setPageIndex(1);
  };

  const handleFromDate = (value: string) => {
    setFromDate(value);
    if (value) setDateFilter(0);
    setPageIndex(1);
  };

  const handleToDate = (value: string) => {
    setToDate(value);
    if (value) setDateFilter(0);
    setPageIndex(1);
  };

  const handleNextHighlight = () => {
    if (highlights.length <= 1) return;
    setActiveHighlightIndex((prev) =>
      prev === highlights.length - 1 ? 0 : prev + 1
    );
  };

  const handlePrevHighlight = () => {
    if (highlights.length <= 1) return;
    setActiveHighlightIndex((prev) =>
      prev === 0 ? highlights.length - 1 : prev - 1
    );
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const highlightText = (text = "", term = "") => {
    if (!term || !text) return text;
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escapedTerm})`, "gi");
    return text.split(regex).map((part, index) =>
      part.toLowerCase() === term.toLowerCase() ? (
        <span key={index} className="highlight">{part}</span>
      ) : part
    );
  };

  const activeHighlight = highlights[activeHighlightIndex];
  const displayName = collegeName || collegeNameFallback || "...";

  return (
    <div className="news-page-wrapper faculty-page-wrapper">

      {/* ─── TOP HEADER ─────────────────────────────────────── */}
      <header
        className="faculty-top-header"
        style={{ backgroundImage: `url(${headerBg})` }}
        dir="rtl"
      >
        <div className="faculty-top-header-overlay" />

        <div className="faculty-top-header-inner">
          {/* Back button — left side (visually right-to-left aware) */}
          <button
            type="button"
            className="faculty-back-btn"
            onClick={() => window.history.back()}
            aria-label="back"
          >
            <i className="fa-solid fa-chevron-right"></i>
            <span>{isArabic ? "الرجوع الى موقع الجامعة" : "Back to University"}</span>
          </button>

          {/* Brand — right side */}
          <div className="faculty-top-brand">
            <div className="faculty-top-brand-text">
              <h2 className="faculty-top-college-name">{displayName}</h2>
              <p className="faculty-top-university-name">
                {isArabic ? "جامعة المنوفية" : "Menoufia University"}
              </p>
            </div>
            <div className="faculty-top-logo-wrap">
              <img src={logo} alt="university logo" className="faculty-top-logo" />
            </div>
          </div>
        </div>
      </header>

      {/* ─── HERO / SLIDER ──────────────────────────────────── */}
      <section className="faculty-news-hero">
        <div className="news-hero-content">

          {highlightsLoading ? (
            <div className="faculty-highlight-slider skeleton-highlight" />
          ) : activeHighlight ? (
            <div className="faculty-highlight-slider">
              <div className="faculty-highlight-image-wrap">
                <SmartImage
                  src={activeHighlight.image}
                  alt={activeHighlight.translationData || displayName || "Highlight"}
                  className="faculty-highlight-image"
                />

                <div className="faculty-highlight-overlay" />

                <div className="faculty-highlight-content">
                  <h2>{activeHighlight.translationData}</h2>

                  <button
                    type="button"
                    className="faculty-highlight-arrow"
                    onClick={handleNextHighlight}
                    aria-label="next highlight"
                  >
                    <i className="fa-solid fa-arrow-up"></i>
                  </button>
                </div>

                {highlights.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="faculty-highlight-nav faculty-highlight-prev"
                      onClick={handlePrevHighlight}
                      aria-label="previous highlight"
                    >
                      <i className="fa-solid fa-chevron-left"></i>
                    </button>

                    <button
                      type="button"
                      className="faculty-highlight-nav faculty-highlight-next"
                      onClick={handleNextHighlight}
                      aria-label="next highlight"
                    >
                      <i className="fa-solid fa-chevron-right"></i>
                    </button>
                  </>
                )}

                {highlights.length > 1 && (
                  <div className="faculty-highlight-dots">
                    {highlights.map((item, index) => (
                      <button
                        key={item.id || index}
                        type="button"
                        className={`faculty-highlight-dot ${
                          index === activeHighlightIndex ? "active" : ""
                        }`}
                        onClick={() => setActiveHighlightIndex(index)}
                        aria-label={`go to highlight ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* ─── SEARCH ───────────────────────────────────────── */}
          <div className="news-search-wrapper">
            <div className="news-search-bar">
              <button
                type="button"
                className="news-search-icon-btn"
                onClick={handleManualSearch}
                aria-label="search"
              >
                <i className="fa-solid fa-magnifying-glass"></i>
              </button>

              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
                placeholder={isArabic ? "ابحث في أخبار الكلية..." : "Search faculty news..."}
              />

              {searchInput && (
                <button
                  type="button"
                  className="news-clear-btn"
                  onClick={handleClearSearch}
                  aria-label="clear search"
                >
                  <X size={18} />
                </button>
              )}

              <button
                type="button"
                className={`news-filter-toggle ${showFilters ? "active" : ""} ${
                  activeFiltersCount > 0 ? "has-filters" : ""
                }`}
                onClick={() => setShowFilters((prev) => !prev)}
                aria-label="toggle filters"
              >
                <i className="fa-solid fa-sliders"></i>
                {activeFiltersCount > 0 && (
                  <span className="filter-badge">{activeFiltersCount}</span>
                )}
              </button>
            </div>

            <div className={`news-filterr-panel ${showFilters ? "open" : ""}`}>
              <div className="filter-panel-inner" dir={isArabic ? "rtl" : "ltr"}>
                <div className="filter-panell-body">
                  <div className="filter-section filterr-dates" style={{ width: "100%" }}>
                    <span className="filterr-labell">
                      <Calendar size={13} />
                      {isArabic ? "نطاق مخصص" : "Custom Range"}
                    </span>

                    <div className="filter-date-inputs">
                      <div className="date-input-wrap">
                        <label>{isArabic ? "من" : "From"}</label>
                        <input
                          type="date"
                          value={fromDate}
                          onChange={(e) => handleFromDate(e.target.value)}
                          max={toDate || undefined}
                        />
                      </div>

                      <span className="date-separator">—</span>

                      <div className="date-input-wrap">
                        <label>{isArabic ? "إلى" : "To"}</label>
                        <input
                          type="date"
                          value={toDate}
                          onChange={(e) => handleToDate(e.target.value)}
                          min={fromDate || undefined}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="filter-section" style={{ width: "100%" }}>
                    <span className="filter-labell">
                      <Calendar size={13} />
                      {isArabic ? "فلتر سريع" : "Quick Filter"}
                    </span>

                    <div className="filter-chips">
                      {DATE_FILTERS.map((filter) => (
                        <button
                          key={filter.value}
                          type="button"
                          className={`filter-chip ${
                            (filter.value === 0 && dateFilter === 0 && !fromDate && !toDate) ||
                            (filter.value !== 0 && dateFilter === filter.value)
                              ? "chip-active"
                              : ""
                          }`}
                          onClick={() => handleApplyDateFilter(filter.value)}
                        >
                          {isArabic ? filter.labelAr : filter.labelEn}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {activeFiltersCount > 0 && (
                  <div className="filter-panel-footer">
                    <button
                      type="button"
                      className="filter-clear-all"
                      onClick={handleClearAllFilters}
                    >
                      <X size={12} />
                      {isArabic ? "مسح الفلاتر" : "Clear Filters"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {activeFiltersCount > 0 && (
            <div className="news-active-filters">
              {dateFilter !== 0 && (
                <span className="active-tag">
                  {isArabic
                    ? DATE_FILTERS.find((f) => f.value === dateFilter)?.labelAr
                    : DATE_FILTERS.find((f) => f.value === dateFilter)?.labelEn}
                  <button onClick={() => setDateFilter(0)}><X size={11} /></button>
                </span>
              )}
              {fromDate && (
                <span className="active-tag">
                  {isArabic ? "من: " : "From: "}{fromDate}
                  <button onClick={() => setFromDate("")}><X size={11} /></button>
                </span>
              )}
              {toDate && (
                <span className="active-tag">
                  {isArabic ? "إلى: " : "To: "}{toDate}
                  <button onClick={() => setToDate("")}><X size={11} /></button>
                </span>
              )}
            </div>
          )}

          {search && (
            <div className="news-search-status">
              {isArabic ? "نتائج البحث عن: " : "Search results for: "}
              <strong>{search}</strong>
            </div>
          )}
        </div>
      </section>

      {/* ─── MAIN CONTENT ────────────────────────────────────── */}
      <section className="news-main-content" dir={isRTL ? "rtl" : "ltr"}>
        <div className="news-content-wrapper">

          {/* Section title */}
          <div className="faculty-section-heading" dir={isRTL ? "rtl" : "ltr"}>
            <span className="faculty-section-dot" />
            <h2 className="faculty-section-title">
              {isArabic ? `اخبار ${displayName}` : `${displayName} News`}
            </h2>
          </div>

          {loading ? (
            <div className="news-cards-grid">
              {Array.from({ length: 6 }).map((_, index) => (
                <article key={index} className="news-card skeleton-card">
                  <div className="news-card-text">
                    <div className="skeleton skeleton-title" />
                    <div className="skeleton skeleton-line" />
                    <div className="skeleton skeleton-line short" />
                    <div className="skeleton skeleton-date" />
                  </div>
                  <div className="news-card-image">
                    <div className="skeleton skeleton-image" />
                  </div>
                </article>
              ))}
            </div>
          ) : news.length === 0 ? (
            <div className="news-no-results">
              <h2>
                {isArabic
                  ? "لا توجد أخبار لهذه الكلية"
                  : "No news found for this faculty"}
              </h2>
            </div>
          ) : (
            <div className="news-cards-grid">
              {news.map((item) => (
                <article key={item.id} className="news-card">
                  <Link
                    to={`/fac/details/${item.id}`}
                    state={{
                      news: item,
                      newsType: "faculty",
                      fac: Number(fac),
                      langId: getActiveSearchLangId(),
                      collegeName,
                    }}
                    className="news-card-link"
                  >
                    <div className="news-card-text">
                      <h3 className="news-card-title">
                        {highlightText(
                          (item.title?.slice(0, 85) || "") +
                            ((item.title?.length || 0) > 85 ? "..." : ""),
                          search
                        )}
                      </h3>

                      {item.source && (
                        <p className="news-card-description">
                          {highlightText(item.source, search)}
                        </p>
                      )}

                      <span className="news-card-date">{formatDate(item.date)}</span>
                    </div>

                    <div className="news-card-image">
                      <SmartImage src={item.image} alt={item.imageAlt || item.title || ""} />
                    </div>

                    <div className="news-card-arrow">
                      <i className="fa-solid fa-arrow-up"></i>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}

          {news.length > 0 && (
            <div className="news-pagination">
              <button
                className="news-pagination-arrow"
                disabled={!movePrevious || loading}
                onClick={() => setPageIndex((prev) => Math.max(1, prev - 1))}
                aria-label="Previous page"
              >
                <i className="fa-solid fa-chevron-left"></i>
              </button>

              <div className="news-pagination-number active">{pageIndex}</div>

              <button
                className="news-pagination-arrow"
                disabled={!moveNext || loading}
                onClick={() => setPageIndex((prev) => prev + 1)}
                aria-label="Next page"
              >
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default FacultyNews;