import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Edit, Trash2, X, Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import ReactTooltip from "react-tooltip";
import { useAuth } from "../hooks/useAuth";
import api from "../Services/api";
import newsService from "../Services/newsService";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import { SmartImage, getImageUrl } from "../utils/imageHelper";
import "./News.css";
import "./News.filter.css";

const DEFAULT_ITEMS_PER_PAGE = 10;
const DEBOUNCE_DELAY = 500;

interface NewsItem {
  id: number;
  newsImg: string;
  date: string;
  newsDetails?: {
    head?: string;
    abbr?: string;
    body?: string;
  };
  languages?: Array<{
    id: number;
    name: string;
    code: string;
    flag: string;
  }>;
  [key: string]: any;
}

const DATE_FILTERS = [
  { value: 0, labelAr: "كل الأخبار", labelEn: "All News" },
  { value: 2, labelAr: "اليوم", labelEn: "Today" },
  { value: 3, labelAr: "آخر أسبوع", labelEn: "Last Week" },
  { value: 4, labelAr: "آخر شهر", labelEn: "Last Month" },
];

function News() {
  const savedLang = JSON.parse(localStorage.getItem("lang") || "{}");
  const { t } = useTranslation("News");
  const { isLoggedIn } = useAuth();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [totalPages, setTotalPages] = useState(1);

  const [filteredNews, setFilteredNews] = useState<NewsItem[]>([]);
  const [langId, setLangId] = useState(Number(savedLang?.id) || 2);
  const [moveNext, setMoveNext] = useState(false);
  const [movePrevious, setMovePrevious] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [dateFilter, setDateFilter] = useState<number>(0);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    newsId: null as number | null,
    newsTitle: "",
    isLoading: false,
  });

  const isArabic = savedLang?.code === "ar";

  useEffect(() => {
    let count = 0;

    if (dateFilter !== 0) count++;
    if (fromDate) count++;
    if (toDate) count++;

    setActiveFiltersCount(count);
  }, [dateFilter, fromDate, toDate]);

  useEffect(() => {
    if (savedLang?.id) {
      setLangId(Number(savedLang.id));
    }
  }, [savedLang?.id]);

  const getCurrentLanguageId = () => Number(langId) || 2;

  const formatDate = (rawDate: string) => {
    if (!rawDate) return "";

    return new Date(rawDate).toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTotalPagesFromResponse = (response: any, page: number) => {
    const apiTotalPages = Number(
      response?.totalPages ??
        response?.totalPage ??
        response?.pageCount ??
        response?.pagesCount ??
        response?.pagination?.totalPages
    );

    if (apiTotalPages && apiTotalPages > 0) {
      return apiTotalPages;
    }

    const totalCount = Number(
      response?.totalCount ??
        response?.count ??
        response?.totalRecords ??
        response?.pagination?.totalCount
    );

    if (totalCount && totalCount > 0) {
      return Math.ceil(totalCount / pageSize);
    }

    return response?.moveNext ? page + 1 : page;
  };

  const buildParams = (page: number, term: string) => {
    return {
      languageId: getCurrentLanguageId(),
      pageIndex: page,
      pageSize,
      search: term,
      ...(dateFilter !== 0 ? { dateFilter } : {}),
      ...(fromDate ? { fromDate } : {}),
      ...(toDate ? { toDate } : {}),
    };
  };

  const fetchNews = async (page = 1, term = "") => {
    setIsLoading(true);

    try {
      const response = await newsService.getUniversityNews(
        buildParams(page, term)
      );

      setFilteredNews(response?.result || []);
      setMoveNext(response?.moveNext || false);
      setMovePrevious(response?.movePrevious || false);
      setTotalPages(getTotalPagesFromResponse(response, page));
    } catch {
      setFilteredNews([]);
      setMoveNext(false);
      setMovePrevious(false);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  const runSearch = async (term: string, page = 1) => {
    const trimmed = term.trim();

    if (!trimmed) {
      setAppliedSearchTerm("");
      setCurrentPage(1);
      fetchNews(1, "");
      return;
    }

    const activeLangId = getCurrentLanguageId();

    setIsLoading(true);

    try {
      const res = await newsService.getUniversityNews({
        languageId: activeLangId,
        pageIndex: page,
        pageSize,
        search: trimmed,
        ...(dateFilter !== 0 ? { dateFilter } : {}),
        ...(fromDate ? { fromDate } : {}),
        ...(toDate ? { toDate } : {}),
      });

      const results = res?.result || [];

      if (results.length > 0) {
        setFilteredNews(results);
        setMoveNext(res?.moveNext || false);
        setMovePrevious(res?.movePrevious || false);
        setTotalPages(getTotalPagesFromResponse(res, page));
        setAppliedSearchTerm(trimmed);
        return;
      }

      const abbrRes = await newsService.searchByAbbreviation({
        abbreviation: trimmed,
        lid: activeLangId,
        pageIndex: page,
        pageSize,
      });

      setFilteredNews(abbrRes?.result || []);
      setMoveNext(abbrRes?.moveNext || false);
      setMovePrevious(abbrRes?.movePrevious || false);
      setTotalPages(getTotalPagesFromResponse(abbrRes, page));
      setAppliedSearchTerm(trimmed);
    } catch {
      setFilteredNews([]);
      setMoveNext(false);
      setMovePrevious(false);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (appliedSearchTerm) {
      runSearch(appliedSearchTerm, currentPage);
    } else {
      fetchNews(currentPage, "");
    }
  }, [langId, currentPage, pageSize, dateFilter, fromDate, toDate]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setCurrentPage(1);
      runSearch(searchTerm, 1);
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm]);

  const handleManualSearch = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setCurrentPage(1);
    runSearch(searchTerm, 1);
  };

  const handleClearSearch = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setSearchTerm("");
    setAppliedSearchTerm("");
    setCurrentPage(1);
    fetchNews(1, "");
  };

  const handleClearAllFilters = () => {
    setDateFilter(0);
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
  };

  const handleApplyDateFilter = (val: number) => {
    setDateFilter((prev) => (prev === val ? 0 : val));

    if (val !== 0) {
      setFromDate("");
      setToDate("");
    }

    setCurrentPage(1);
  };

  const handleFromDate = (val: string) => {
    setFromDate(val);

    if (val) {
      setDateFilter(0);
    }

    setCurrentPage(1);
  };

  const handleToDate = (val: string) => {
    setToDate(val);

    if (val) {
      setDateFilter(0);
    }

    setCurrentPage(1);
  };

  const getPaginationPages = () => {
    const pages: Array<number | string> = [];

    if (totalPages <= 1) return [1];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }

      return pages;
    }

    pages.push(1);

    if (currentPage > 4) {
      pages.push("...");
    }

    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 3) {
      pages.push("...");
    }

    pages.push(totalPages);

    return pages;
  };

  const handleDeleteClick = (e: React.MouseEvent, news: NewsItem) => {
    e.preventDefault();
    e.stopPropagation();

    setDeleteModal({
      isOpen: true,
      newsId: news.id,
      newsTitle: news?.newsDetails?.head || "",
      isLoading: false,
    });
  };

  const handleEditClick = (e: React.MouseEvent, news: NewsItem) => {
    e.preventDefault();
    e.stopPropagation();

    window.open(`/news/edit/${news.id}`, "_blank");
  };

  const handleDeleteConfirm = async () => {
    setDeleteModal((prev) => ({
      ...prev,
      isLoading: true,
    }));

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

      if (filteredNews.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        setTimeout(() => {
          appliedSearchTerm
            ? runSearch(appliedSearchTerm, currentPage)
            : fetchNews(currentPage);
        }, 100);
      }

      toast.success(t("delete.messages.success"), {
        position: "top-right",
        autoClose: 2000,
      });
    } catch {
      setDeleteModal((prev) => ({
        ...prev,
        isLoading: false,
      }));

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

  const highlightText = (text = "", keyword = "") => {
    if (!keyword) return text;

    const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escapedKeyword})`, "gi");

    return text.split(regex).map((part, index) =>
      part.toLowerCase() === keyword.toLowerCase() ? (
        <span key={index} className="highlight">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  return (
    <div className="news-page-wrapper">
      <section className="news-hero">
        <div className="news-hero-overlay" />

        <div className="news-hero-content">
          <p className="news-hero-subtitle">MENOUFIA UNIVERSITY NEWS</p>

          <h1 className="news-hero-title">
            {isArabic
              ? "بوابة أخبار جامعة المنوفية"
              : "Menoufia University News Portal"}
          </h1>

          <div className="news-search-wrapper">
            <div className="news-search-bar">
              <button
                type="button"
                className="news-search-icon-btn"
                onClick={handleManualSearch}
                aria-label="search"
              >
                <i className="fa-solid fa-magnifying-glass" />
              </button>

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
                placeholder={isArabic ? "ابحث عن خبر..." : "Search for news..."}
              />

              {searchTerm && (
                <button
                  type="button"
                  className="news-clear-btn"
                  onClick={handleClearSearch}
                  aria-label="clear"
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
                <i className="fa-solid fa-sliders" />

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
              <span>{isArabic ? "نتائج البحث عن" : "Results for"}</span>
              <strong>{appliedSearchTerm}</strong>
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
          ) : filteredNews.length === 0 ? (
            <div className="news-no-results">
              <h2>{isArabic ? "لا توجد نتائج" : "No results found"}</h2>
            </div>
          ) : (
            <div className="news-cards-grid">
              {filteredNews.map((news) => (
                <article key={news.id} className="news-card">
                  <Link
                    to={`/details/${news.id}`}
                    state={{
                      news,
                      newsType: "university",
                      lid: getCurrentLanguageId(),
                    }}
                    className="news-card-link"
                  >
                    <div className="news-card-text">
                      <h3 className="news-card-title">
                        {highlightText(
                          news?.newsDetails?.head?.slice(0, 85),
                          appliedSearchTerm
                        )}

                        {(news?.newsDetails?.head?.length || 0) > 85
                          ? "..."
                          : ""}
                      </h3>

                      <p className="news-card-description">
                        {highlightText(
                          news?.newsDetails?.abbr?.slice(0, 110) || "",
                          appliedSearchTerm
                        )}

                        {(news?.newsDetails?.abbr?.length || 0) > 110
                          ? "..."
                          : ""}
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
                      <i className="fa-solid fa-arrow-up" />
                    </div>

                    {isLoggedIn && (
                      <div className="news-admin-actions">
                        <button
                          className="news-admin-btn news-edit-btn"
                          onClick={(e) => handleEditClick(e, news)}
                          data-tip="Edit"
                        >
                          <Edit size={16} />
                        </button>

                        <button
                          className="news-admin-btn news-delete-btn"
                          onClick={(e) => handleDeleteClick(e, news)}
                          data-tip="Delete"
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
              <div className="news-pagination-pages">
                <button
                  type="button"
                  className="news-pagination-arrow"
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  disabled={!movePrevious || isLoading}
                >
                  <i className="fa-solid fa-chevron-left" />
                </button>

                {getPaginationPages().map((page, index) =>
                  page === "..." ? (
                    <span
                      key={`dots-${index}`}
                      className="news-pagination-dots"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      type="button"
                      key={page}
                      className={`news-pagination-number ${
                        currentPage === page ? "active" : ""
                      }`}
                      onClick={() => setCurrentPage(Number(page))}
                      disabled={isLoading}
                    >
                      {page}
                    </button>
                  )
                )}

                <button
                  type="button"
                  className="news-pagination-arrow"
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  disabled={!moveNext || isLoading}
                >
                  <i className="fa-solid fa-chevron-right" />
                </button>
              </div>

              <div className="news-page-info">
                <span>{isArabic ? "الصفحة" : "Page"}</span>
                <strong>{currentPage}</strong>
                <span>{isArabic ? "من" : "of"}</span>
                <strong>{totalPages}</strong>
              </div>
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

export default News;