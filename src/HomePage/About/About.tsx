import React from "react";
import { useNavigate } from "react-router-dom";
import universityImage from "../../assets/02.jpg";
import "./About.css";
import { useTranslation } from "react-i18next";

function About() {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();

  const isRTL = i18n.dir() === "rtl";

  const handleReadMore = () => {
    navigate("/university-history");
  };

  return (
    <section className={`about-section ${isRTL ? "about-rtl" : "about-ltr"}`}>
      <div className="about-card">
        <div className="about-image-wrap">
          <img
            src={universityImage}
            alt={t("aboutSection.imageAlt")}
            className="about-image"
          />
        </div>

        <div className="about-text">
          <h2 className="about-title">{t("aboutSection.title")}</h2>

          <p className="about-description">
            {t("aboutSection.description")}
          </p>

          <button
            type="button"
            className="about-read-more"
            onClick={handleReadMore}
          >
            {t("aboutSection.readMore")}
          </button>
        </div>
      </div>
    </section>
  );
}

export default About;