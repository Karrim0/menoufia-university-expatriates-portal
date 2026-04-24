import React from "react";
import logo from "../../assets/image2.png";
import line from "../../assets/CurveLine.svg";
import "./About.css";
import { useTranslation } from "react-i18next";

function About() {
  const { i18n, t } = useTranslation();
  const isRTL = i18n.dir() === "rtl";

  return (
    <div className={`about-container ${isRTL ? "about-rtl" : "about-ltr"}`}>
      <div className="about-content">
        <img src={logo} alt="MNF-logo" className="about-logo" />
        <p className={`about-subtitle ${isRTL ? "font-ar" : "font-en"}`}>
          {t("about.subtitle")}
        </p>
      </div>

      <h1 className={`about-title ${isRTL ? "heading-ar" : "heading-en"}`}>
        {t("about.title")}
      </h1>

      <img
        src={line}
        alt=""
        aria-hidden="true"
        className="about-curve"
      />
    </div>
  );
}

export default About;