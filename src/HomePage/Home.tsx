import React, { useState, useEffect, useMemo, useRef } from "react";
import Hero from "./Hero/Hero";
import About from "./About/About";
import Carousel from "./Carousel/Carousel";
import { useTranslation } from "react-i18next";
import CollegesPrograms from "./CollegesPrograms/CollegesPrograms";
import newsService from "../Services/newsService";
import GlobalSearch from "./GlobalSearch/GlobalSearch";
import { getLanguageId } from "../utils/language";

import "./Home.css";

function Home() {
  const { i18n } = useTranslation();

  const [filteredNews, setFilteredNews] = useState<any[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState(true);

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

        // يمنع إن request قديم يرجع متأخر ويغطي على اللغة الجديدة
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

      <CollegesPrograms />
    </div>
  );
}

export default Home;