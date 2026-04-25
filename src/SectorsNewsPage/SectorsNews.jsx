import React, { useState, useEffect, useRef, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import { Edit, Trash2, Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import ReactTooltip from "react-tooltip";
import { useAuth } from "../hooks/useAuth";
import api from "../Services/api";
import newsService from "../Services/newsService";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import { SmartImage, getImageUrl } from "../utils/imageHelper";
import "./SectorsNews.css";

const ITEMS_PER_PAGE = 10;
const DEBOUNCE_DELAY = 500;

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
  const { t } = useTranslation("News");
  const { isLoggedIn } = useAuth();
  const { sectorName } = useParams();

  const sector = sectorConfig[sectorName] || sectorConfig.univpres;
  const sectorTitle = savedLang?.code === "ar" ? sector.ar : sector.en;

  const [currentPage, setCurrentPage] = useState(1);
  const [filteredNews, setFilteredNews] = useState([]);
  const [langId] = useState(Number(savedLang?.id) || 1);
  const [moveNext, setMoveNext] = useState(false);
  const [movePrevious, setMovePrevious] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const debounceTimerRef = useRef(null);
  const allNewsRef = useRef([]);
  const lastFetchKeyRef = useRef("");

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    newsId: null,
    newsTitle: "",
    isLoading: false,
  });

  const isArabic = savedLang?.code === "ar";

  useEffect(() => {
    setSearchTerm("");
    setAppliedSearchTerm("");
    setCurrentPage(1);
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

  // Apply client-side pagination from cached data
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

  // Fetch all news once, then paginate client-side
  const fetchNews = useCallback(
    async (page = 1, term = "") => {
      const fetchKey = `${sectorName}_${langId}_${term}`;

      // If we already have cached data for this sector/lang/search, just paginate
      if (fetchKey === lastFetchKeyRef.current && allNewsRef.current.length > 0) {
        applyPagination(page);
        return;
      }

      setIsLoading(true);

      try {
        const response = await newsService.searchByAbbreviation({
          abbreviation: sectorName,
          lid: Number(langId),
          pageIndex: 1,
          pageSize: 99999,
          search: term,
        });

        allNewsRef.current = response?.result || [];
        lastFetchKeyRef.current = fetchKey;

        applyPagination(page);
      } catch (error) {
        console.error("Error fetching news:", error);
        allNewsRef.current = [];
        lastFetchKeyRef.current = "";
        setFilteredNews([]);
        setMoveNext(false);
        setMovePrevious(false);
      } finally {
        setIsLoading(false);
      }
    },
    [sectorName, langId, applyPagination]
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

  // Main effect: fetch on sector/lang change or page change
  useEffect(() => {
    fetchNews(currentPage, appliedSearchTerm);
  }, [langId, sectorName, currentPage, fetchNews]);

  // Debounced search
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
  }, [searchTerm]);

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

      // Remove from cache and re-paginate
      allNewsRef.current = allNewsRef.current.filter(
        (n) => n.id !== deleteModal.newsId
      );

      const totalPages = Math.ceil(
        allNewsRef.current.length / ITEMS_PER_PAGE
      );
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
  const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? <span key={i} className="highlight">{part}</span> : part
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
          </div>

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
                      lid: Number(langId),
                      abbreviation: sectorName,
                    }}
                    className="news-card-link"
                  >
                    <div className="news-card-text">
                     <h3 className="news-card-title">
  {highlightText(
    (news?.newsDetails?.head?.slice(0, 85) || "") +
    ((news?.newsDetails?.head?.length || 0) > 85 ? "..." : ""),
    appliedSearchTerm
  )}
</h3>

                   <p className="news-card-description">
  {highlightText(
    (news?.newsDetails?.abbr?.slice(0, 110) || "") +
    ((news?.newsDetails?.abbr?.length || 0) > 110 ? "..." : ""),
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