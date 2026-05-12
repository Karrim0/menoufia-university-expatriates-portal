import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { Edit, Trash2, X, Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import ReactTooltip from "react-tooltip";
import { useAuth } from "../hooks/useAuth";
import api from "../Services/api";
import newsService from "../Services/newsService";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import { SmartImage, getImageUrl } from "../utils/imageHelper";
import "./SectorsNews.css";
import "../NewsPage/News.filter.css";

const ITEMS_PER_PAGE = 10;
const DEBOUNCE_DELAY = 500;

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

const detectSearchLanguageId = (text, fallbackLangId) => {
  const value = text.trim();

  if (!value) return fallbackLangId;

  if (/[پچژگک‌ی]/.test(value)) {
    return LANGUAGE_IDS.fa;
  }

  if (/[\u0600-\u06FF]/.test(value)) {
    return LANGUAGE_IDS.ar;
  }

  if (/[\u0400-\u04FF]/.test(value)) {
    return LANGUAGE_IDS.ru;
  }

  if (/[\u3040-\u30FF\u31F0-\u31FF]/.test(value)) {
    return LANGUAGE_IDS.ja;
  }

  if (/[\u4E00-\u9FFF]/.test(value)) {
    return LANGUAGE_IDS.ch;
  }

  if (/[çğıöşüÇĞİÖŞÜ]/.test(value)) {
    return LANGUAGE_IDS.tr;
  }

  if (/[äöüßÄÖÜ]/.test(value)) {
    return LANGUAGE_IDS.de;
  }

  if (/[âæçêëîïôœûüÿÂÆÇÊËÎÏÔŒÛÜŸ]/.test(value)) {
    return LANGUAGE_IDS.fr;
  }

  if (/[àèéìíîòóùúÀÈÉÌÍÎÒÓÙÚ]/.test(value)) {
    return LANGUAGE_IDS.it;
  }

  return LANGUAGE_IDS.en;
};

const DATE_FILTERS = [
  { value: 0, labelAr: "كل الأخبار", labelEn: "All News" },
  { value: 2, labelAr: "اليوم", labelEn: "Today" },
  { value: 3, labelAr: "آخر أسبوع", labelEn: "Last Week" },
  { value: 4, labelAr: "آخر شهر", labelEn: "Last Month" },
];

const sectorConfig = {
  wafiden: { ar: "وافدين", en: "Wafiden" },
  cenev: { ar: "مركز CENEVA", en: "CENEVA Center" },
  educ: { ar: "قطاع التعليم", en: "Education Sector" },
  env: { ar: "شؤون البيئة", en: "Environmental Affairs" },
  env2: {
    ar: "إدارة شؤون البيئة",
    en: "Environmental Affairs Administration",
  },
  nci: { ar: "المركز القومي للمعلومات", en: "National Information Center" },
  postgrad: { ar: "الدراسات العليا", en: "Postgraduate Studies" },
  sadat: { ar: "جامعة السادات", en: "Sadat University" },
  secr: { ar: "الأمانة العامة", en: "General Secretariat" },
  tico: {
    ar: "مركز تكنولوجيا المعلومات",
    en: "Technology Information Center",
  },
  univpres: { ar: "رئاسة الجامعة", en: "University Presidency" },
};

function SectorsNews() {
  const savedLang = JSON.parse(localStorage.getItem("lang") || "{}");
  const { t, i18n } = useTranslation("News");
  const { isLoggedIn } = useAuth();
  const { sectorName } = useParams();

  const sector = sectorConfig[sectorName] || sectorConfig.univpres;
  const sectorTitle = i18n.language === "ar" ? sector.ar : sector.en;

  const [currentPage, setCurrentPage] = useState(1);
  const [filteredNews, setFilteredNews] = useState([]);
  const [langId, setLangId] = useState(Number(savedLang?.id) || 1);
  const [moveNext, setMoveNext] = useState(false);
  const [movePrevious, setMovePrevious] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  const [dateFilter, setDateFilter] = useState(0);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  const debounceTimerRef = useRef(null);
  const allNewsRef = useRef([]);
  const lastFetchKeyRef = useRef("");

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    newsId: null,
    newsTitle: "",
    isLoading: false,
  });

  const isArabic = i18n.language === "ar";

  useEffect(() => {
    let count = 0;

    if (dateFilter !== 0) count++;
    if (fromDate) count++;
    if (toDate) count++;

    setActiveFiltersCount(count);
  }, [dateFilter, fromDate, toDate]);

  useEffect(() => {
    const currentLang = JSON.parse(localStorage.getItem("lang") || "{}");

    if (currentLang?.id) {
      setLangId(Number(currentLang.id));
    }

    setCurrentPage(1);
    setSearchTerm("");
    setAppliedSearchTerm("");
    setDateFilter(0);
    setFromDate("");
    setToDate("");
    allNewsRef.current = [];
    lastFetchKeyRef.current = "";
  }, [i18n.language]);

  useEffect(() => {
    setSearchTerm("");
    setAppliedSearchTerm("");
    setCurrentPage(1);
    setDateFilter(0);
    setFromDate("");
    setToDate("");
    allNewsRef.current = [];
    lastFetchKeyRef.current = "";
  }, [sectorName]);

  const formatDate = (rawDate) => {
    if (!rawDate) return "";

    const date = new Date(rawDate);

    return date.toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getSearchLanguageId = useCallback(
    (term) => {
      return term.trim()
        ? detectSearchLanguageId(term, Number(langId))
        : Number(langId);
    },
    [langId]
  );

  const getActiveSearchLangId = () => {
    return appliedSearchTerm
      ? detectSearchLanguageId(appliedSearchTerm, Number(langId))
      : Number(langId);
  };

  const applyPagination = useCallback((page) => {
    const allResults = allNewsRef.current;
    const totalPages = Math.ceil(allResults.length / ITEMS_PER_PAGE);
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const paginatedResults = allResults.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE
    );

    setFilteredNews(paginatedResults);
    setMoveNext(page < totalPages);
    setMovePrevious(page > 1);
  }, []);

  const fetchNews = useCallback(
    async (page = 1, term = "") => {
      const activeLangId = getSearchLanguageId(term);

      const fetchKey = `${sectorName}_${activeLangId}_${term}_${dateFilter}_${fromDate}_${toDate}`;

      if (fetchKey === lastFetchKeyRef.current && allNewsRef.current.length > 0) {
        applyPagination(page);
        return;
      }

      setIsLoading(true);

      try {
        const response = await newsService.searchByAbbreviation({
          abbreviation: sectorName,
          lid: activeLangId,
          pageIndex: 1,
          pageSize: 99999,
          search: term,
          ...(dateFilter !== 0 ? { dateFilter } : {}),
          ...(fromDate ? { fromDate } : {}),
          ...(toDate ? { toDate } : {}),
        });

        allNewsRef.current = response?.result || [];
        lastFetchKeyRef.current = fetchKey;

        applyPagination(page);
      } catch (error) {
        console.error("Error fetching sector news:", error);

        allNewsRef.current = [];
        lastFetchKeyRef.current = "";
        setFilteredNews([]);
        setMoveNext(false);
        setMovePrevious(false);
      } finally {
        setIsLoading(false);
      }
    },
    [
      sectorName,
      dateFilter,
      fromDate,
      toDate,
      getSearchLanguageId,
      applyPagination,
    ]
  );

  const runSearch = useCallback(
    (term) => {
      const trimmed = term.trim();

      setAppliedSearchTerm(trimmed);
      setCurrentPage(1);
      allNewsRef.current = [];
      lastFetchKeyRef.current = "";
      fetchNews(1, trimmed);
    },
    [fetchNews]
  );

  useEffect(() => {
    allNewsRef.current = [];
    lastFetchKeyRef.current = "";
    fetchNews(currentPage, appliedSearchTerm);
  }, [
    langId,
    sectorName,
    currentPage,
    dateFilter,
    fromDate,
    toDate,
    appliedSearchTerm,
    fetchNews,
  ]);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!searchTerm.trim() && appliedSearchTerm) {
      debounceTimerRef.current = setTimeout(() => {
        setAppliedSearchTerm("");
        setCurrentPage(1);
        allNewsRef.current = [];
        lastFetchKeyRef.current = "";
        fetchNews(1, "");
      }, DEBOUNCE_DELAY);

      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }

    if (!searchTerm.trim()) return;

    debounceTimerRef.current = setTimeout(() => {
      runSearch(searchTerm);
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm, appliedSearchTerm, fetchNews, runSearch]);

  const handleManualSearch = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    runSearch(searchTerm);
  };

  const handleClearSearch = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setSearchTerm("");
    setAppliedSearchTerm("");
    setCurrentPage(1);
    allNewsRef.current = [];
    lastFetchKeyRef.current = "";
    fetchNews(1, "");
  };

  const handleClearAllFilters = () => {
    setDateFilter(0);
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
    allNewsRef.current = [];
    lastFetchKeyRef.current = "";
  };

  const handleApplyDateFilter = (value) => {
    setDateFilter((prev) => (prev === value ? 0 : value));

    if (value !== 0) {
      setFromDate("");
      setToDate("");
    }

    setCurrentPage(1);
    allNewsRef.current = [];
    lastFetchKeyRef.current = "";
  };

  const handleFromDate = (value) => {
    setFromDate(value);

    if (value) {
      setDateFilter(0);
    }

    setCurrentPage(1);
    allNewsRef.current = [];
    lastFetchKeyRef.current = "";
  };

  const handleToDate = (value) => {
    setToDate(value);

    if (value) {
      setDateFilter(0);
    }

    setCurrentPage(1);
    allNewsRef.current = [];
    lastFetchKeyRef.current = "";
  };

  const handleDeleteClick = (e, news) => {
    e.preventDefault();
    e.stopPropagation();

    setDeleteModal({
      isOpen: true,
      newsId: news.id,
      newsTitle: news?.newsDetails?.head || "",
      isLoading: false,
    });
  };

  const handleEditClick = (e, news) => {
    e.preventDefault();
    e.stopPropagation();

    window.open(`/news/edit/${news.id}`, "_blank");
  };

  const handleDeleteConfirm = async () => {
    setDeleteModal((prev) => ({ ...prev, isLoading: true }));

    try {
      const token = localStorage.getItem("token");

      await api.get(`news/delete/${deleteModal.newsId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          accept: "text/plain",
        },
      });

      setDeleteModal({
        isOpen: false,
        newsId: null,
        newsTitle: "",
        isLoading: false,
      });

      allNewsRef.current = allNewsRef.current.filter(
        (news) => news.id !== deleteModal.newsId
      );

      const totalPages = Math.ceil(allNewsRef.current.length / ITEMS_PER_PAGE);
      const newPage =
        currentPage > totalPages ? Math.max(1, totalPages) : currentPage;

      if (newPage !== currentPage) {
        setCurrentPage(newPage);
      } else {
        applyPagination(newPage);
      }

      toast.success(t("delete.messages.success"), {
        position: "top-right",
        autoClose: 2000,
      });
    } catch (error) {
      console.error("Error deleting sector news:", error);

      setDeleteModal((prev) => ({ ...prev, isLoading: false }));

      toast.error(t("delete.messages.error"), {
        position: "top-right",
        autoClose: 4000,
      });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({
      isOpen: false,
      newsId: null,
      newsTitle: "",
      isLoading: false,
    });
  };

  const handleNextPage = () => {
    if (moveNext && !isLoading) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (movePrevious && !isLoading) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const highlightText = (text, term) => {
    if (!term || !text) return text;

    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escapedTerm})`, "gi");

    return text.split(regex).map((part, index) =>
      part.toLowerCase() === term.toLowerCase() ? (
        <span key={index} className="highlight">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const handleSearchInputKeyDown = (e) => {
    if (e.key === "Enter") {
      handleManualSearch();
    }
  };

  return (
    <div className="news-page-wrapper sectors-page-wrapper">
      <section className="news-hero sectors-hero">
        <div className="news-hero-overlay"></div>

        <div className="news-hero-content">
          <p className="news-hero-subtitle">UNIVERSITY ADMINISTRATION</p>

          <h1 className="news-hero-title">{sectorTitle}</h1>

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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchInputKeyDown}
                placeholder={
                  isArabic
                    ? `ابحث داخل ${sector.ar}...`
                    : `Search inside ${sector.en}...`
                }
              />

              {searchTerm && (
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
                className={`news-filter-toggle ${
                  showFilters ? "active" : ""
                } ${activeFiltersCount > 0 ? "has-filters" : ""}`}
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
              <div
                className="filter-panel-inner"
                dir={isArabic ? "rtl" : "ltr"}
              >
                <div className="filter-panell-body">
                  <div
                    className="filter-section filterr-dates"
                    style={{ width: "100%" }}
                  >
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
                            (filter.value === 0 &&
                              dateFilter === 0 &&
                              !fromDate &&
                              !toDate) ||
                            (filter.value !== 0 &&
                              dateFilter === filter.value)
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
                    ? DATE_FILTERS.find((filter) => filter.value === dateFilter)
                        ?.labelAr
                    : DATE_FILTERS.find((filter) => filter.value === dateFilter)
                        ?.labelEn}

                  <button onClick={() => setDateFilter(0)}>
                    <X size={11} />
                  </button>
                </span>
              )}

              {fromDate && (
                <span className="active-tag">
                  {isArabic ? "من: " : "From: "}
                  {fromDate}

                  <button onClick={() => setFromDate("")}>
                    <X size={11} />
                  </button>
                </span>
              )}

              {toDate && (
                <span className="active-tag">
                  {isArabic ? "إلى: " : "To: "}
                  {toDate}

                  <button onClick={() => setToDate("")}>
                    <X size={11} />
                  </button>
                </span>
              )}
            </div>
          )}

          {appliedSearchTerm && (
            <div className="news-search-status">
              {isArabic
                ? `نتائج البحث عن: ${appliedSearchTerm}`
                : `Search results for: ${appliedSearchTerm}`}
            </div>
          )}
        </div>
      </section>

      <section className="news-main-content" dir={isArabic ? "rtl" : "ltr"}>
        <div className="news-content-wrapper">
          {isLoading ? (
            <div className="news-cards-grid">
              {Array.from({ length: 6 }).map((_, index) => (
                <article key={index} className="news-card skeleton-card">
                  <div className="news-card-text">
                    <div className="skeleton skeleton-title"></div>
                    <div className="skeleton skeleton-line"></div>
                    <div className="skeleton skeleton-line short"></div>
                    <div className="skeleton skeleton-date"></div>
                  </div>

                  <div className="news-card-image">
                    <div className="skeleton skeleton-image"></div>

                    <div className="news-card-arrow skeleton">
                      <i className="fa-solid fa-arrow-up"></i>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : filteredNews.length === 0 ? (
            <div className="news-no-results">
              <h2>
                {isArabic
                  ? "لا توجد نتائج لهذا القطاع"
                  : "No results found for this sector"}
              </h2>
            </div>
          ) : (
            <div className="news-cards-grid">
              {filteredNews.map((news) => (
                <article key={news.id} className="news-card">
                  <Link
                    to={`/details/${news.id}`}
                    state={{
                      news,
                      newsType: "sector",
                      lid: getActiveSearchLangId(),
                      abbreviation: sectorName,
                    }}
                    className="news-card-link"
                  >
                    <div className="news-card-text">
                      <h3 className="news-card-title">
                        {highlightText(
                          (news?.newsDetails?.head?.slice(0, 85) || "") +
                            ((news?.newsDetails?.head?.length || 0) > 85
                              ? "..."
                              : ""),
                          appliedSearchTerm
                        )}
                      </h3>

                      <p className="news-card-description">
                        {highlightText(
                          (news?.newsDetails?.abbr?.slice(0, 110) || "") +
                            ((news?.newsDetails?.abbr?.length || 0) > 110
                              ? "..."
                              : ""),
                          appliedSearchTerm
                        )}
                      </p>

                      <span className="news-card-date">
                        {formatDate(news.date)}
                      </span>
                    </div>

                    <div className="news-card-image">
                      <SmartImage
                        src={getImageUrl(news?.newsImg)}
                        alt={news?.newsDetails?.head || ""}
                      />
                    </div>

                    <div className="news-card-arrow">
                      <i className="fa-solid fa-arrow-up"></i>
                    </div>

                    {isLoggedIn && (
                      <div className="news-admin-actions">
                        <button
                          className="news-admin-btn news-edit-btn"
                          onClick={(e) => handleEditClick(e, news)}
                          data-tip="Edit news"
                        >
                          <Edit size={16} />
                        </button>

                        <button
                          className="news-admin-btn news-delete-btn"
                          onClick={(e) => handleDeleteClick(e, news)}
                          data-tip="Delete news"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </Link>
                </article>
              ))}
            </div>
          )}

          {filteredNews.length > 0 && (
            <div className="news-pagination">
              <button
                className="news-pagination-arrow"
                onClick={handlePreviousPage}
                disabled={!movePrevious || isLoading}
                aria-label="Previous page"
              >
                <i className="fa-solid fa-chevron-left"></i>
              </button>

              <div className="news-pagination-number active">{currentPage}</div>

              <button
                className="news-pagination-arrow"
                onClick={handleNextPage}
                disabled={!moveNext || isLoading}
                aria-label="Next page"
              >
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          )}
        </div>
      </section>

      <ReactTooltip
        place="top"
        className="custom-tooltip"
        type="dark"
        effect="solid"
      />

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        newsTitle={deleteModal.newsTitle}
        isLoading={deleteModal.isLoading}
      />
    </div>
  );
}

export default SectorsNews;