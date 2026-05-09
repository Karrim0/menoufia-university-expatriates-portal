import React from "react";
import "./UniversityHistory.css";
import universityImage from "../../assets/02.jpg";
import { useTranslation } from "react-i18next";

type TimelineItem = {
  side: "left" | "right";
  year: string;
  title?: string;
  text?: string;
  tags?: string[];
  list?: string[];
  extraText?: string;
};

const UniversityHistory: React.FC = () => {
  const { i18n, t } = useTranslation();
  const isRTL = i18n.dir() === "rtl";

  const introParagraphs = t("universityHistory.intro.paragraphs", {
    returnObjects: true,
  }) as string[];

  const introTags = t("universityHistory.intro.tags", {
    returnObjects: true,
  }) as string[];

  const timeline = t("universityHistory.timeline.items", {
    returnObjects: true,
  }) as TimelineItem[];

  return (
    <main className="uh-page" dir={isRTL ? "rtl" : "ltr"}>
      <section className="uh-hero">
        <div className="uh-hero-overlay" />
        <h1>{t("universityHistory.heroTitle")}</h1>
      </section>

      <section className="uh-container">
        <div className="uh-intro-card">
          <div className="uh-intro-image">
            <img
              src={universityImage}
              alt={t("universityHistory.imageAlt")}
            />
          </div>

          <div className="uh-intro-content">
            <h2>{t("universityHistory.intro.title")}</h2>

            {Array.isArray(introParagraphs) &&
              introParagraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}

            {Array.isArray(introTags) && introTags.length > 0 && (
              <div className="uh-tags">
                {introTags.map((tag, index) => (
                  <span key={index}>{tag}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        <section className="uh-timeline-section">
          <div className="uh-section-title">
            <h2>{t("universityHistory.timeline.title")}</h2>
            <span />
          </div>

          <div className="uh-timeline">

            {Array.isArray(timeline) &&
              timeline.map((item, index) => (
                <article
                  key={`${item.year}-${index}`}
                  className={`uh-timeline-card ${
  isRTL
    ? item.side === "left" ? "uh-right" : "uh-left"
    : item.side === "left" ? "uh-left"  : "uh-right"
}`}
                >
                  <h3>{item.year}</h3>

                  {item.title && <h4>{item.title}</h4>}

                  {item.text && <p>{item.text}</p>}

                  {Array.isArray(item.tags) && item.tags.length > 0 && (
                    <div className="uh-tags">
                      {item.tags.map((tag, tagIndex) => (
                        <span key={tagIndex}>{tag}</span>
                      ))}
                    </div>
                  )}

                  {item.extraText && <p>{item.extraText}</p>}

                  {Array.isArray(item.list) && item.list.length > 0 && (
                    <ul>
                      {item.list.map((listItem, listIndex) => (
                        <li key={listIndex}>{listItem}</li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
          </div>
        </section>
      </section>
    </main>
  );
};

export default UniversityHistory;