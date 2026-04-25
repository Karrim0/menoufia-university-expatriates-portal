import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Edit, Trash2, Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import ReactTooltip from "react-tooltip";
import { useAuth } from "../hooks/useAuth";
import api from "../Services/api";
import newsService from "../Services/newsService";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import { SmartImage, getImageUrl } from "../utils/imageHelper";
import "./News.css";

const ITEMS_PER_PAGE = 10;
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

function News() {
  const savedLang = JSON.parse(localStorage.getItem("lang") || "{}");
  const { t } = useTranslation("News");
  const { isLoggedIn } = useAuth();

  const [currentPage, setCurrentPage] = useState(1);
  const [filteredNews, setFilteredNews] = useState<NewsItem[]>([]);
  const [langId, setLangId] = useState(Number(savedLang?.id) || 2);
  const [moveNext, setMoveNext] = useState(false);
  const [movePrevious, setMovePrevious] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [usedAbbreviationFallback, setUsedAbbreviationFallback] =
    useState(false);

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
    if (savedLang?.id) {
      setLangId(Number(savedLang.id));
    }
  }, [savedLang?.id]);

  const formatDate = (rawDate: string) => {
    if (!rawDate) return "";

    const date = new Date(rawDate);
    return date.toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const fetchNews = async (page = 1, term = "") => {
    setIsLoading(true);

    try {
      const response = await newsService.getUniversityNews({
        languageId: Number(langId),
        pageIndex: page,
        pageSize: ITEMS_PER_PAGE,
        search: term,
      });

      setFilteredNews(response?.result || []);
      setMoveNext(response?.moveNext || false);
      setMovePrevious(response?.movePrevious || false);
      setUsedAbbreviationFallback(false);
    } catch (error) {
      console.error("Error fetching university news:", error);
      setFilteredNews([]);
      setMoveNext(false);
      setMovePrevious(false);
      setUsedAbbreviationFallback(false);
    } finally {
      setIsLoading(false);
    }
  };

  const runSearch = async (term: string, page = 1) => {
    const trimmed = term.trim();

    if (!trimmed) {
      setAppliedSearchTerm("");
      setUsedAbbreviationFallback(false);
      setCurrentPage(1);
      fetchNews(1, "");
      return;
    }

    setIsLoading(true);

    try {
      const generalResponse = await newsService.getUniversityNews({
        languageId: Number(langId),
        pageIndex: page,
        pageSize: ITEMS_PER_PAGE,
        search: trimmed,
      });

      const generalResults = generalResponse?.result || [];

      if (generalResults.length > 0) {
        setFilteredNews(generalResults);
        setMoveNext(generalResponse?.moveNext || false);
        setMovePrevious(generalResponse?.movePrevious || false);
        setAppliedSearchTerm(trimmed);
        setUsedAbbreviationFallback(false);
        return;
      }

      const abbrResponse = await newsService.searchByAbbreviation({
        abbreviation: trimmed,
        lid: Number(langId),
        pageIndex: page,
        pageSize: ITEMS_PER_PAGE,
      });

      const abbrResults = abbrResponse?.result || [];
      setFilteredNews(abbrResults);
      setMoveNext(abbrResponse?.moveNext || false);
      setMovePrevious(abbrResponse?.movePrevious || false);
      setAppliedSearchTerm(trimmed);
      setUsedAbbreviationFallback(abbrResults.length > 0);
    } catch (error) {
      console.error("Error searching news:", error);
      setFilteredNews([]);
      setMoveNext(false);
      setMovePrevious(false);
      setUsedAbbreviationFallback(false);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── الـ useEffect الرئيسي — ده بس اللي بيضرب الـ API ───
  useEffect(() => {
    if (appliedSearchTerm) {
      runSearch(appliedSearchTerm, currentPage);
    } else {
      fetchNews(currentPage, "");
    }
  }, [langId, currentPage]);

  // ─── الـ debounce — بيشتغل بس لما اليوزر يكتب في الـ search ───
  useEffect(() => {
    // أول mount سيبه للـ useEffect الرئيسي
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
    setUsedAbbreviationFallback(false);
    fetchNews(1, "");
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

      if (filteredNews.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        setTimeout(() => {
          if (appliedSearchTerm) {
            runSearch(appliedSearchTerm, currentPage);
          } else {
            fetchNews(currentPage, "");
          }
        }, 100);
      }

      toast.success(t("delete.messages.success"), {
        position: "top-right",
        autoClose: 2000,
      });
    } catch (error) {
      console.error("Error deleting news:", error);
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

  const handleSearchInputKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Enter") {
      handleManualSearch();
    }
  };

  const highlightText = (text: string = "", keyword: string = "") => {
    if (!keyword) return text;

    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escaped})`, "gi");

    return text.split(regex).map((part, i) =>
      part.toLowerCase() === keyword.toLowerCase() ? (
        <span key={i} className="highlight">
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
        <div className="news-hero-overlay"></div>

        <div className="news-hero-content">
          <p className="news-hero-subtitle">
            {isArabic ? "MENOUFIA UNIVERSITY NEWS" : "MENOUFIA UNIVERSITY NEWS"}
          </p>

          <h1 className="news-hero-title">
            {isArabic
              ? "بوابة أخبار جامعة المنوفية"
              : "Menoufia University News Portal"}
          </h1>

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
              placeholder={isArabic ? "ابحث عن خبر..." : "Search for news..."}
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
            <div className="news-search-status-wrapper">
              <div className="news-search-status">
                <span>
                  {isArabic ? "نتائج البحث عن" : "Search results for"}
                </span>

                <strong>{appliedSearchTerm}</strong>

                {usedAbbreviationFallback && (
                  <span className="news-search-mode">
                    {isArabic
                      ? "مطابقة abbreviation"
                      : "abbreviation match"}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="news-main-content" dir={isArabic ? "rtl" : "ltr"}>
        <div className="news-content-wrapper">
          {isLoading ? (
            <div className="news-no-results">
              <h2>{isArabic ? "جاري التحميل..." : "Loading..."}</h2>
            </div>
          ) : filteredNews.length === 0 ? (
            <div className="news-no-results">
              <h2>
                {t("details.noResultsFound") ||
                  (isArabic ? "لا توجد نتائج" : "No results found")}
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
                      newsType: "university",
                      lid: Number(langId),
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

  <div className="news-card-arrow">
    <i className="fa-solid fa-arrow-up"></i>
  </div>
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

export default News;