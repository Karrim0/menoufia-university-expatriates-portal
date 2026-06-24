import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./FacultyFooter.css";
import { useTranslation } from "react-i18next";
export type FacultyFooterMenuItem = {
  id?: number;
  menuId: number | string;
  parentId?: number | null;
  sortOrder?: number;
  order?: number;
  title: string;
  articleId?: number | null;
  url?: string;
  children?: FacultyFooterMenuItem[];
  subMenus?: FacultyFooterMenuItem[];
};

export type FacultyFooterMenuGroup = {
  menuId: number | string;
  title: string;
  children: FacultyFooterMenuItem[];
};

type FacultyFooterProps = {
  footerMenuGroups: FacultyFooterMenuGroup[];
  isRTL: boolean;
  logo2: string;
  getItemLink: (item: FacultyFooterMenuItem) => string;
};

const FACULTY_FOOTER_ACCENTS = ["#cfa000", "#d48df5", "#58df9c"] as const;

const cleanMenuTitle = (title?: string) =>
  String(title || "")
    .replace(/\s+/g, " ")
    .trim();

const isExternalMenuUrl = (url?: string) =>
  typeof url === "string" && /^https?:\/\//i.test(url);

const FacultyFooterLink: React.FC<{
  item: FacultyFooterMenuItem;
  getItemLink: (item: FacultyFooterMenuItem) => string;
}> = ({ item, getItemLink }) => {
  const link = getItemLink(item);
  const isExternal = isExternalMenuUrl(link);

  const content = (
    <>
      <span>{cleanMenuTitle(item.title)}</span>
      <i className="fa-solid fa-arrow-up" aria-hidden="true" />
    </>
  );

  if (isExternal) {
    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="faculty-footer-link"
      >
        {content}
      </a>
    );
  }

  return (
    <Link to={link} className="faculty-footer-link">
      {content}
    </Link>
  );
};

const FacultyFooterColumn: React.FC<{
  group: FacultyFooterMenuGroup;
  accentColor: string;
  getItemLink: (item: FacultyFooterMenuItem) => string;
}> = ({ group, accentColor, getItemLink }) => {
  const { t } = useTranslation("FacultyNews");
  const [showAll, setShowAll] = useState(false);

  const cleanChildren = group.children.filter(
    (item) => cleanMenuTitle(item.title).length > 0,
  );

  const previewItems = cleanChildren.slice(0, 5);
  const extraItems = cleanChildren.slice(5);
  const visibleExtraItems = showAll ? extraItems : [];

  return (
    <div
      className={`faculty-footer-column ${showAll ? "expanded" : ""}`}
      style={
        {
          "--col-accent": accentColor,
        } as React.CSSProperties
      }
    >
      <h3>{cleanMenuTitle(group.title)}</h3>

      <div className="faculty-footer-links-scroll">
        <div className="faculty-footer-links-list">
          {previewItems.map((item) => (
            <FacultyFooterLink
              key={item.menuId}
              item={item}
              getItemLink={getItemLink}
            />
          ))}

          {visibleExtraItems.map((item) => (
            <FacultyFooterLink
              key={item.menuId}
              item={item}
              getItemLink={getItemLink}
            />
          ))}
        </div>
      </div>

      {extraItems.length > 0 && (
        <button
          type="button"
          className="faculty-footer-more-btn"
          onClick={() => setShowAll((prev) => !prev)}
        >
          <span>{showAll ? t("showLess") : t("showMore")}</span>
        </button>
      )}
    </div>
  );
};

const FacultyFooter: React.FC<FacultyFooterProps> = ({
  footerMenuGroups,
  isRTL,
  logo2,
  getItemLink,
}) => {
  const { t } = useTranslation("FacultyNews");
  return (
    <footer className="faculty-links-footer" dir={isRTL ? "rtl" : "ltr"}>
      {footerMenuGroups.length > 0 && (
        <div className="faculty-links-footer-top">
          {footerMenuGroups.slice(0, 3).map((group, index) => (
            <FacultyFooterColumn
  key={group.menuId}
  group={group}
  accentColor={
    FACULTY_FOOTER_ACCENTS[index] ?? FACULTY_FOOTER_ACCENTS[0]
  }
  getItemLink={getItemLink}
/>
          ))}
        </div>
      )}

      <div className="faculty-links-footer-bottom faculty-footer-second-modern">
        <div className="faculty-footer-second-pattern faculty-footer-second-pattern-left" />
        <div className="faculty-footer-second-pattern faculty-footer-second-pattern-right" />

        <div className="faculty-footer-second-inner">
          <div className="faculty-footer-second-brand">
            <div className="faculty-footer-second-brand-text">
              <h2>{t("universityName")}</h2>
              <p>{t("universityNameSecondary")}</p>
              <span>{t("beacon")}</span>
            </div>

            <img
              src={logo2}
              alt={t("universityName")}
              className="faculty-footer-second-logo"
            />
          </div>

          <div className="faculty-footer-second-info-card">
            <div className="faculty-footer-second-info-item">
              <span className="faculty-footer-second-icon">
                <i className="fa-regular fa-clock" />
              </span>

              <div>
                <h3>{t("workingHours")}</h3>
                <p>{t("workingHoursValue")}</p>
                <small>{t("exceptHolidays")}</small>
              </div>
            </div>

            <div className="faculty-footer-second-info-item">
              <span className="faculty-footer-second-icon">
                <i className="fa-regular fa-envelope" />
              </span>

              <div>
                <h3>{t("email")}</h3>
                <p>info@menofia.edu.eg</p>
              </div>
            </div>

            <div className="faculty-footer-second-info-item">
              <span className="faculty-footer-second-icon">
                <i className="fa-solid fa-phone" />
              </span>

              <div>
                <h3>{t("phone")}</h3>
                <p>0482222170</p>
              </div>
            </div>

            <div className="faculty-footer-second-info-item">
              <span className="faculty-footer-second-icon">
                <i className="fa-solid fa-location-dot" />
              </span>

              <div>
                <h3>{t("address")}</h3>
                <p>{t("addressValue")}</p>
                <small>{t("country")}</small>
              </div>
            </div>
          </div>

          <div className="faculty-footer-second-bottom-row">
            <div className="faculty-footer-second-social">
              <a href="https://www.facebook.com/MenoufiaUniversity" aria-label="facebook">
                <i className="fa-brands fa-facebook-f" />
              </a>

              <a href="https://x.com/mediamenoufiaun?lang=ar" aria-label="x-twitter">
                <i className="fa-brands fa-x-twitter" />
              </a>

              <a href="https://www.youtube.com/channel/UCcoPxoor5XEnac34BwEI_9w" aria-label="youtube">
                <i className="fa-brands fa-youtube" />
              </a>

              <a href="https://www.instagram.com/menoufiauniversity/" aria-label="instagram">
                <i className="fa-brands fa-instagram" />
              </a>

              <a href="https://eg.linkedin.com/school/menofia-university/" aria-label="linkedin">
                <i className="fa-brands fa-linkedin-in" />
              </a>
            </div>

            <p className="faculty-footer-second-copy">{t("copyright")}</p>

            <div className="faculty-footer-second-links">
              <a href="#">{t("privacyPolicy")}</a>
              <a href="#">{t("termsOfUse")}</a>
              <a href="#">{t("sitemap")}</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FacultyFooter;