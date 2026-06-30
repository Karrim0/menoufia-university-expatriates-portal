import React, { useState, useEffect, useMemo, useRef } from "react";
import Hero from "./Hero/Hero";
import About from "./About/About";
import Carousel from "./Carousel/Carousel";
import { useTranslation } from "react-i18next";
import CollegesPrograms from "./CollegesPrograms/CollegesPrograms";
import newsService from "../Services/newsService";
import GlobalSearch from "./GlobalSearch/GlobalSearch";
import { getLanguageId } from "../utils/language";
import SpecialUnitsSection from "./SpecialUnitsSection/SpecialUnitsSection";
import GeneralAdministrationsSection from "./GeneralAdministrationsSection/GeneralAdministrationsSection";
import "./Home.css";

const NEWS_DASHBOARD_URL = "https://stage.menofia.edu.eg/dashboard";

function Home() {
  const { i18n } = useTranslation();

  const [filteredNews, setFilteredNews] = useState<any[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState(true);

  const isArabic = i18n.language.toLowerCase().startsWith("ar");
  const isRTL = i18n.dir() === "rtl" || ["ar", "fa"].includes(i18n.language);

  const langId = useMemo(() => {
    return getLanguageId(i18n.language);
  }, [i18n.language]);

  const requestIdRef = useRef(0);

  useEffect(() => {
    const fetchUniversityNews = async () => {
      const requestId = ++requestIdRef.current;

      setIsNewsLoading(true);

      try {
        const response = await newsService.getUniversityNews({
          languageId: langId,
          pageIndex: 1,
          pageSize: 50,
          search: "",
        });

        if (requestId !== requestIdRef.current) return;

        setFilteredNews(response?.result || []);
      } catch (error) {
        if (requestId !== requestIdRef.current) return;

        console.error("Error fetching university news:", error);
        setFilteredNews([]);
      } finally {
        if (requestId === requestIdRef.current) {
          setIsNewsLoading(false);
        }
      }
    };

    fetchUniversityNews();
  }, [langId]);

  return (
    <div>
      <GlobalSearch />

      {isNewsLoading ? (
        <div className="home-hero-skeleton" />
      ) : (
        <Hero News={filteredNews} />
      )}

      <About />

      {isNewsLoading ? (
        <section className="home-carousel-skeleton-wrapper">
          <div className="home-carousel-skeleton-grid">
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="home-news-card-skeleton" key={index}>
                <div className="home-news-card-text-skeleton">
                  <span />
                  <span />
                  <span />
                </div>

                <div className="home-news-card-image-skeleton" />
              </div>
            ))}
          </div>
        </section>
      ) : (
        <Carousel News={filteredNews} />
      )}

      <section
        className="home-news-dashboard-section"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <div className="home-news-dashboard-card">
          <div className="home-news-dashboard-content">
            <span className="home-news-dashboard-badge">
              <i className="fa-solid fa-chart-line" />
              {isArabic ? "لوحة ذكية" : "Smart Dashboard"}
            </span>

            <h2>
              {isArabic
                ? "لوحة ذكاء أخبار جامعة المنوفية"
                : "Menoufia University News Intelligence Dashboard"}
            </h2>

            <p>
              {isArabic
                ? "استعرض مؤشرات وتحليلات أخبار الجامعة من خلال لوحة تفاعلية تساعد على متابعة الأداء والمحتوى بشكل أوضح."
                : "Explore interactive indicators and analytics for university news performance and content insights."}
            </p>
          </div>

          <div className="home-news-dashboard-actions">
            <a
              href={NEWS_DASHBOARD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="home-news-dashboard-btn"
              aria-label={
                isArabic
                  ? "فتح لوحة ذكاء أخبار جامعة المنوفية"
                  : "Open Menoufia University news dashboard"
              }
            >
              <span>{isArabic ? "فتح لوحة الذكاء" : "Open Dashboard"}</span>
              <i className="fa-solid fa-arrow-up-right-from-square" />
            </a>
          </div>
        </div>
      </section>

      
      <GeneralAdministrationsSection />
      <CollegesPrograms />
      <SpecialUnitsSection articleId={66343} defaultOpen={false} />
    </div>
  );
}

export default Home;