import React, { useState, useEffect } from "react";
import Hero from "./Hero/Hero";
import About from "./About/About";
import Carousel from "./Carousel/Carousel";
import { useTranslation } from "react-i18next";
import CollegesPrograms from "./CollegesPrograms/CollegesPrograms";
import newsService from "../Services/newsService";
import "./Home.css";

function Home() {
  const { i18n } = useTranslation();

  const [filteredNews, setFilteredNews] = useState([]);
  const [isNewsLoading, setIsNewsLoading] = useState(true);

  useEffect(() => {
    const fetchUniversityNews = async () => {
      setIsNewsLoading(true);

      try {
        const savedLang = JSON.parse(
          localStorage.getItem("lang") || '{"code":"en","id":"2"}'
        );

        const response = await newsService.getUniversityNews({
          languageId: savedLang?.id || "2",
          pageIndex: 1,
          pageSize: 50,
          search: "",
        });

        setFilteredNews(response?.result || []);
      } catch (error) {
        console.error("Error fetching university news:", error);
        setFilteredNews([]);
      } finally {
        setIsNewsLoading(false);
      }
    };

    fetchUniversityNews();
  }, [i18n.language]);

  return (
    <div>
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