import React, { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { Edit, Trash2, Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import ReactTooltip from "react-tooltip";
import { useAuth } from "../hooks/useAuth";
import api from "../Services/api";
import newsService from "../Services/newsService";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import "./SectorsNews.css";

const ITEMS_PER_PAGE = 10;
const DEBOUNCE_DELAY = 500;
const FALLBACK_IMAGE = "/src/assets/raes.jpg";
const UPLOADS_BASE_URL = "https://mu.menofia.edu.eg/uploads/";

const getImageUrl = (img) => {
  if (!img) return "";

  if (img.startsWith("http")) return img;

  return `${UPLOADS_BASE_URL}${img}`;
};
const SmartImage = ({ src, alt = "", className = "", style = {} }) => {
  const [imageSrc, setImageSrc] = useState(FALLBACK_IMAGE);

  useEffect(() => {
    if (!src) {
      setImageSrc(FALLBACK_IMAGE);
      return;
    }

    const img = new Image();
    img.src = src;
    img.onload = () => setImageSrc(src);
    img.onerror = () => setImageSrc(FALLBACK_IMAGE);
  }, [src]);

  return <img src={imageSrc} alt={alt} className={className} style={style} />;
};

const sectorConfig = {
  wafiden: { ar: "وافدين", en: "Wafiden" },
  cenev: { ar: "مركز CENEVA", en: "CENEVA Center" },
  educ: { ar: "قطاع التعليم", en: "Education Sector" },
  env: { ar: "شؤون البيئة", en: "Environmental Affairs" },
  env2: { ar: "إدارة شؤون البيئة", en: "Environmental Affairs Administration" },
  nci: { ar: "المركز القومي للمعلومات", en: "National Information Center" },
  postgrad: { ar: "الدراسات العليا", en: "Postgraduate Studies" },
  sadat: { ar: "جامعة السادات", en: "Sadat University" },
  secr: { ar: "الأمانة العامة", en: "General Secretariat" },
  tico: { ar: "مركز تكنولوجيا المعلومات", en: "Technology Information Center" },
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
  const [langId, setLangId] = useState(Number(savedLang?.id) || 2);
  const [moveNext, setMoveNext] = useState(false);
  const [movePrevious, setMovePrevious] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const debounceTimerRef = useRef(null);

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    newsId: null,
    newsTitle: "",
    isLoading: false,
  });

  const isArabic = savedLang?.code === "ar";

  useEffect(() => {
    if (savedLang?.id) {
      setLangId(Number(savedLang.id));
    }
  }, [savedLang?.id]);

  useEffect(() => {
    setSearchTerm("");
    setAppliedSearchTerm("");
    setCurrentPage(1);
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

  const fetchNews = async () => {
    setIsLoading(true);

    try {
      const response = await newsService.searchByAbbreviation({
        abbreviation: sectorName,
        lid: Number(langId),
      });

      setFilteredNews(response?.result || []);
      setMoveNext(false);
      setMovePrevious(false);
    } catch (error) {
      console.error("Error fetching abbreviation news:", error);
      setFilteredNews([]);
      setMoveNext(false);
      setMovePrevious(false);
    } finally {
      setIsLoading(false);
    }
  };

  const runSearch = async (term) => {
    const trimmed = term.trim();
    setCurrentPage(1);

    if (!trimmed) {
      setAppliedSearchTerm("");
      fetchNews();
      return;
    }

    setAppliedSearchTerm(trimmed);

    const response = await newsService.searchByAbbreviation({
      abbreviation: sectorName,
      lid: Number(langId),
    });

    const allNews = response?.result || [];

    const filtered = allNews.filter((item) => {
      const title = item?.newsDetails?.head || "";
      const body = item?.newsDetails?.body || "";
      const abbr = item?.newsDetails?.abbr || "";

      return `${title} ${body} ${abbr}`
        .toLowerCase()
        .includes(trimmed.toLowerCase());
    });

    setFilteredNews(filtered);
    setMoveNext(false);
    setMovePrevious(false);
  };

  useEffect(() => {
    fetchNews();
  }, [langId, sectorName]);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      runSearch(searchTerm);
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm, langId, sectorName]);

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

      if (!appliedSearchTerm && filteredNews.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      } else {
        setTimeout(() => {
          if (appliedSearchTerm) {
            runSearch(appliedSearchTerm);
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
    if (!appliedSearchTerm && moveNext && !isLoading) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (!appliedSearchTerm && movePrevious && !isLoading) {
      setCurrentPage((prev) => prev - 1);
    }
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
          <p className="news-hero-subtitle">
            {isArabic
              ? "UNIVERSITY ADMINISTRATION"
              : "UNIVERSITY ADMINISTRATION"}
          </p>

          <h1 className="news-hero-title">{sectorTitle}</h1>

          <div className="news-search-bar">
            <button
              type="button"
              className="news-search-icon-btn"
              onClick={handleManualSearch}
              aria-label="search"
            >
              <Search size={24} />
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
            <div className="news-no-results">
              <h2>{isArabic ? "جاري التحميل..." : "Loading..."}</h2>
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
                    state={{ news, newsType: "sector" }}
                    className="news-card-link"
                  >
                    <div className="news-card-text">
                      <h3 className="news-card-title">
                        {news?.newsDetails?.head?.slice(0, 85) || ""}
                        {(news?.newsDetails?.head?.length || 0) > 85
                          ? "..."
                          : ""}
                      </h3>

                      <p className="news-card-description">
                        {news?.newsDetails?.abbr?.slice(0, 110) || ""}
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

          {!appliedSearchTerm && filteredNews.length > 0 && (
            <div className="news-pagination">
              <button
                className="news-pagination-arrow"
                onClick={handlePreviousPage}
                disabled={!movePrevious || isLoading}
                aria-label="Previous page"
              >
                <i className="fa-solid fa-chevron-right"></i>
              </button>

              <div className="news-pagination-number active">{currentPage}</div>

              <button
                className="news-pagination-arrow"
                onClick={handleNextPage}
                disabled={!moveNext || isLoading}
                aria-label="Next page"
              >
                <i className="fa-solid fa-chevron-left"></i>
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
