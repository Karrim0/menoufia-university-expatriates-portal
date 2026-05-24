import React, { useState, useEffect } from "react";
import "./Details.css";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Edit, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import DOMPurify from "dompurify";
import { useAuth } from "../hooks/useAuth";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import api from "../Services/api";
import newsService from "../Services/newsService";
import { SmartImage, getImageUrl } from "../utils/imageHelper";
import ErrorPage from "../ErrorPage/ErrorPage";

function Details() {
  const savedLang = JSON.parse(localStorage.getItem("lang") || "{}");
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const newsType = location.state?.newsType || "university";
  const initialLangId = Number(location.state?.lid) || Number(savedLang?.id) || 1;

  const { t } = useTranslation("News");
  const { t: tDetails } = useTranslation("NewsDetails");
  const { isLoggedIn } = useAuth();

  const [currentNews, setCurrentNews] = useState(location.state?.news || null);
  const [filteredNews, setFilteredNews] = useState([]);
  const [langId, setLangId] = useState(initialLangId);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    newsId: null,
    newsTitle: "",
    isLoading: false,
  });

  const headerArStyle = {
    fontFamily: "var(--MNF_Heading_AR)",
  };

  const headerEnStyle = {
    fontFamily: "var(--MNF_Heading_EN)",
  };

  const pArStyle = {
    fontFamily: "var(--MNF_Heading_AR)",
  };

  const pEnStyle = {
    fontFamily: "var(--MNF_Heading_EN)",
  };

  const isArabic = savedLang?.code === "ar";

  useEffect(() => {
    const stateNews = location.state?.news;

    setNotFound(false);

    if (stateNews && String(stateNews.id) === String(id)) {
      setCurrentNews(stateNews);
    } else {
      setCurrentNews(null);
    }

    setIsLoading(true);
  }, [id, location.state?.news]);

  useEffect(() => {
    const stateLangId = Number(location.state?.lid);

    if (stateLangId) {
      setLangId(stateLangId);
    } else if (savedLang?.id) {
      setLangId(Number(savedLang.id));
    }
  }, [location.state?.lid, savedLang?.id]);

  const formatDate = (rawDate) => {
    if (!rawDate) return "";

    const date = new Date(rawDate);

    return date.toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const fetchNewsById = async (newsId, languageId, type) => {
    if (type === "sector") {
      return await newsService.getSectorNewsById(newsId, languageId);
    }

    if (type === "university") {
      return await newsService.getUniversityNewsById(newsId, languageId);
    }

    return await newsService.getNewsById(newsId, languageId);
  };

  useEffect(() => {
    const fetchCurrentNews = async () => {
      const newsId = Number(id);
      const languageId = Number(langId);

      if (!newsId || !languageId) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setNotFound(false);

      try {
        let response = null;

        try {
          response = await fetchNewsById(newsId, languageId, newsType);
        } catch {
          response = null;
        }

        if (!response?.result) {
          const fallbackType = newsType === "sector" ? "university" : "sector";

          try {
            response = await fetchNewsById(newsId, languageId, fallbackType);
          } catch {
            response = null;
          }
        }

        if (!response?.result) {
          try {
            response = await newsService.getNewsById(newsId, languageId);
          } catch {
            response = null;
          }
        }

        if (response?.result) {
          const apiData = response.result;

          if (!apiData.newsImg && currentNews?.newsImg) {
            apiData.newsImg = currentNews.newsImg;
          }

          if (
            (!apiData.languages || apiData.languages.length === 0) &&
            currentNews?.languages?.length > 0
          ) {
            apiData.languages = currentNews.languages;
          }

          setCurrentNews(apiData);
          setNotFound(false);
        } else {
          setCurrentNews(null);
          setNotFound(true);
        }
      } catch (error) {
        console.error("Error fetching news details:", error);
        setCurrentNews(null);
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentNews();
  }, [id, langId, newsType]);

  useEffect(() => {
    const fetchRelatedNews = async () => {
      if (!langId || notFound) return;

      try {
        let response;

        if (newsType === "sector") {
          const abbreviation = location.state?.abbreviation;

          if (abbreviation) {
            response = await newsService.searchByAbbreviation({
              abbreviation,
              lid: Number(langId),
              pageIndex: 1,
              pageSize: 10,
              search: "",
            });
          } else {
            response = await newsService.getSectorsNews({
              languageId: Number(langId),
              pageIndex: 1,
              pageSize: 10,
              search: "",
            });
          }
        } else {
          response = await newsService.getUniversityNews({
            languageId: Number(langId),
            pageIndex: 1,
            pageSize: 10,
            search: "",
          });
        }

        const newsList = response?.result || [];
        const related = newsList.filter(
          (item) => String(item.id) !== String(id)
        );

        setFilteredNews(related.slice(0, 9));
      } catch (error) {
        console.error("Error fetching related news:", error);
        setFilteredNews([]);
      }
    };

    fetchRelatedNews();
  }, [langId, id, newsType, location.state?.abbreviation, notFound]);

  const handleLanguageClick = async (selectedLangId) => {
    const nextLangId = Number(selectedLangId);

    if (!nextLangId) return;

    setLangId(nextLangId);
    setIsLoading(true);
    setNotFound(false);

    try {
      let response = null;

      try {
        response = await fetchNewsById(Number(id), nextLangId, newsType);
      } catch {
        response = null;
      }

      if (!response?.result) {
        const fallbackType = newsType === "sector" ? "university" : "sector";

        try {
          response = await fetchNewsById(Number(id), nextLangId, fallbackType);
        } catch {
          response = null;
        }
      }

      if (!response?.result) {
        try {
          response = await newsService.getNewsById(Number(id), nextLangId);
        } catch {
          response = null;
        }
      }

      if (response?.result) {
        const apiData = response.result;

        if (!apiData.newsImg && currentNews?.newsImg) {
          apiData.newsImg = currentNews.newsImg;
        }

        if (
          (!apiData.languages || apiData.languages.length === 0) &&
          currentNews?.languages?.length > 0
        ) {
          apiData.languages = currentNews.languages;
        }

        setCurrentNews(apiData);
        setNotFound(false);
      } else {
        setCurrentNews(null);
        setNotFound(true);
      }
    } catch (error) {
      console.error("Error fetching translated news:", error);
      setCurrentNews(null);
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setDeleteModal({
      isOpen: true,
      newsId: currentNews?.id,
      newsTitle: currentNews?.newsDetails?.head || "",
      isLoading: false,
    });
  };

  const handleEditClick = () => {
    if (!currentNews?.id) return;

    window.open(`/news/edit/${currentNews.id}`, "_blank");
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

      toast.success(t("delete.messages.success"), {
        position: "top-right",
        autoClose: 2000,
      });

      navigate(newsType === "sector" ? -1 : "/news");
    } catch (error) {
      console.error("Error deleting news:", error);

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

  const availableLanguages = (currentNews?.languages || []).filter(
    (lang) => lang.flag && lang.flag.trim() !== ""
  );

  const showLanguageSwitcher = availableLanguages.length >= 2;

  if (notFound) {
    return <ErrorPage />;
  }

  if (isLoading && !currentNews) {
    return (
      <div className="main">
        <div className="containerr">
          <div className="content-wrapper">
            <div className="related-news">
              <h3
                className="related-news-title"
                style={isArabic ? headerArStyle : headerEnStyle}
              >
                {tDetails("relatedNews")}
              </h3>
            </div>

            <div className="event-text-content">
              <h2
                className="event-title"
                style={isArabic ? headerArStyle : headerEnStyle}
              >
                {isArabic ? "جاري التحميل..." : "Loading..."}
              </h2>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <main className="main">
        <div className="containerr">
          <div className="content-wrapper">
            <aside className="related-news">
              <h3
                className="related-news-title"
                style={isArabic ? headerArStyle : headerEnStyle}
              >
                {isArabic ? "اخر الأخبار" : tDetails("relatedNews")}
              </h3>

              <div className="news-grid">
                {filteredNews.slice(0, 10).map((news, index) => (
                  <Link
                    to={`/details/${news.id}`}
                    state={{
                      news,
                      newsType,
                      lid: Number(langId),
                      abbreviation: location.state?.abbreviation,
                    }}
                    onClick={() => window.scrollTo(0, 0)}
                    className="about-news"
                    key={news.id || index}
                  >
                    <div className="news-details-card">
                      <div className="news-content">
                        <h4 style={isArabic ? pArStyle : pEnStyle}>
                          {news?.newsDetails?.head?.slice(0, 65) || ""}
                          {(news?.newsDetails?.head?.length || 0) > 65
                            ? "..."
                            : ""}
                        </h4>

                        <p style={isArabic ? pArStyle : pEnStyle}>
                          {news?.date ? formatDate(news.date) : ""}
                        </p>
                      </div>

                      <SmartImage
                        src={getImageUrl(news?.newsImg)}
                        alt={news?.newsDetails?.head || `News ${index}`}
                        className={isArabic ? "news-imagear" : "news-image"}
                      />
                    </div>
                  </Link>
                ))}
              </div>
            </aside>

            <section className="event-text-content">
              <div className="headertext">
                <div className="title-section">
                  <h2
                    className="event-title"
                    style={isArabic ? headerArStyle : headerEnStyle}
                  >
                    {currentNews?.newsDetails?.head || ""}
                  </h2>

                  {isLoggedIn && currentNews && (
                    <div className="admin-actions-details">
                      <button
                        className="admin-btn edit-btn"
                        onClick={handleEditClick}
                        title="Edit news"
                      >
                        <Edit size={20} />
                      </button>

                      <button
                        className="admin-btn delete-btn"
                        onClick={handleDeleteClick}
                        title="Delete news"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  )}
                </div>

                {showLanguageSwitcher && (
                  <div className="slider">
                    <div className="languages-container">
                      {availableLanguages.map((language) => (
                        <div
                          key={language.id}
                          className="language-card"
                          onClick={() => handleLanguageClick(language.id)}
                          style={{ cursor: "pointer" }}
                        >
                          <img
                            src={language.flag}
                            alt={language.name}
                            className="flag"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="image carousel">
                <div className="carousel-track">
                  <div className="carousel-slide">
                    <SmartImage
                      src={getImageUrl(currentNews?.newsImg)}
                      alt={currentNews?.newsDetails?.head || ""}
                      className="carousel-image"
                    />
                  </div>
                </div>
              </div>

              <p
                className="event-description"
                style={isArabic ? pArStyle : pEnStyle}
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(
                    currentNews?.newsDetails?.body || ""
                  ),
                }}
              ></p>

              <p className="event-date" style={isArabic ? pArStyle : pEnStyle}>
                {currentNews?.date ? formatDate(currentNews.date) : ""}
              </p>
            </section>
          </div>
        </div>
      </main>

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

export default Details;