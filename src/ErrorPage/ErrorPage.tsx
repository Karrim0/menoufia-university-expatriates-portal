import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./ErrorPage.css";

const ErrorPage: React.FC = () => {
  const { t, i18n } = useTranslation("ErrorPage");

  const isRTL = i18n.dir() === "rtl";

  return (
    <main className="ep404-page" dir={isRTL ? "rtl" : "ltr"}>
      <section className="ep404-card">
        <span className="ep404-label">{t("label")}</span>

        <h1 className="ep404-number">404</h1>

        <h2 className="ep404-title">{t("title")}</h2>

        <p className="ep404-description">{t("description")}</p>

        <Link to="/" className="ep404-btn">
          {t("backHome")}
        </Link>
      </section>
    </main>
  );
};

export default ErrorPage;