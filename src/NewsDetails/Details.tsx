import React, { useState, useEffect } from "react";
import "./Details.css";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import defaultImg from "../assets/raes.jpg";
import { Edit, Trash2 } from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../hooks/useAuth";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import api from "../Services/api";
import newsService from "../Services/newsService";
const UPLOADS_BASE_URL = "https://mu.menofia.edu.eg/uploads/";

const getImageUrl = (img) => {
  if (!img) return "";

  if (img.startsWith("http")) return img;

  return `${UPLOADS_BASE_URL}${img}`;
};
const SmartImage = ({ src, alt = "", className = "", style = {} }) => {
  const [imageSrc, setImageSrc] = useState(defaultImg);

  useEffect(() => {
    if (!src) {
      setImageSrc(defaultImg);
      return;
    }

    const img = new Image();
    img.src = src;
    img.onload = () => setImageSrc(src);
    img.onerror = () => setImageSrc(defaultImg);
  }, [src]);

  return <img src={imageSrc} alt={alt} className={className} style={style} />;
};

function Details() {
  const savedLang = JSON.parse(localStorage.getItem("lang") || "{}");
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const newsType = location.state?.newsType || "university";

  const { t } = useTranslation("News");
  const { t: tDetails } = useTranslation("NewsDetails");
  const { isLoggedIn } = useAuth();

  const [currentNews, setCurrentNews] = useState(null);
  const [filteredNews, setFilteredNews] = useState([]);
  const [langId, setLangId] = useState(Number(savedLang?.id) || 2);
  const [isLoading, setIsLoading] = useState(true);

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

  const formatDate = (rawDate) => {
    if (!rawDate) return "";

    const date = new Date(rawDate);
    return date.toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  useEffect(() => {
    if (savedLang?.id) {
      setLangId(Number(savedLang.id));
    }
  }, [savedLang?.id]);

  useEffect(() => {
    const fetchCurrentNews = async () => {
      const newsId = Number(id);
      const languageId = Number(langId);

      if (!newsId || !languageId) return;

      setIsLoading(true);

      try {
        let response;

        if (newsType === "sector") {
          response = await newsService.getSectorNewsById(newsId, languageId);
        } else {
          response = await newsService.getUniversityNewsById(newsId, languageId);
        }

        if (!response?.result) {
          navigate("/news");
          return;
        }

        setCurrentNews(response.result);
      } catch (error) {
        console.error("Error fetching news details:", error);
        navigate("/news");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentNews();
  }, [id, langId, navigate, newsType]);

  useEffect(() => {
    const fetchRelatedNews = async () => {
      if (!langId) return;

      try {
        let response;

        if (newsType === "sector") {
          response = await newsService.getSectorsNews({
            languageId: Number(langId),
            pageIndex: 1,
            pageSize: 50,
            search: "",
          });
        } else {
          response = await newsService.getUniversityNews({
            languageId: Number(langId),
            pageIndex: 1,
            pageSize: 50,
            search: "",
          });
        }

        const newsList = response?.result || [];
        const related = newsList.filter((item) => String(item.id) !== String(id));
        setFilteredNews(related);
      } catch (error) {
        console.error("Error fetching related news:", error);
      }
    };

    fetchRelatedNews();
  }, [langId, id, newsType]);

  const handleLanguageClick = async (selectedLangId) => {
    try {
      let response;

      if (newsType === "sector") {
        response = await newsService.getSectorNewsById(
          Number(id),
          Number(selectedLangId)
        );
      } else {
        response = await newsService.getUniversityNewsById(
          Number(id),
          Number(selectedLangId)
        );
      }

      if (response?.result) {
        setCurrentNews(response.result);
      }
    } catch (error) {
      console.error("Error fetching translated news:", error);
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

      toast.success(t("delete.messages.success"), {
        position: "top-right",
        autoClose: 2000,
      });

      navigate(newsType === "sector" ? -1 : "/news");
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

  if (isLoading) {
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
                    state={{ news, newsType }}
                    onClick={() => window.scrollTo(0, 0)}
                    className="about-news"
                    key={news.id || index}
                  >
                    <div className="news-details-card">
                      <div className="news-content">
                        <h4 style={isArabic ? pArStyle : pEnStyle}>
                          {news?.newsDetails?.head?.slice(0, 65) || ""}
                          {(news?.newsDetails?.head?.length || 0) > 65 ? "..." : ""}
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

                {!!currentNews?.languages?.length && (
                  <div className="slider">
                    <div className="languages-container">
                      {currentNews.languages.map((language) => (
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
                  __html: currentNews?.newsDetails?.body || "",
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