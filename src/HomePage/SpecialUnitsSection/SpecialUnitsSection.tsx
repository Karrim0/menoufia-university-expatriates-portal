import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import newsService from "../../Services/newsService";
import { getLanguageId } from "../../utils/language";
import "./SpecialUnitsSection.css";

type SpecialUnit = {
  title: string;
  url: string;
  abbr: string;
};

type SpecialUnitsArticle = {
  articleId: number;
  menuItemId: number;
  title: string;
  content: string;
  imageDescription: string | null;
};

type SpecialUnitsSectionProps = {
  articleId?: number;
  lang?: number;
  defaultOpen?: boolean;
};

const DEFAULT_ARTICLE_ID = 66343;

// The English CMS content for this article is just a plain paragraph with
// no links, while the Arabic content has the full, correctly-tagged <a>
// list. So we always source the units (url/abbr) from the Arabic version,
// regardless of site language, until the English content is fixed upstream.
const UNITS_SOURCE_LANG = 1;

const normalizeApiArticle = (response: any): SpecialUnitsArticle | null => {
  return response?.result || response?.data?.result || null;
};

const cleanText = (value: string) => {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;

  return textarea.value.replace(/\s+/g, " ").trim();
};

const extractSpecialUnitAbbrFromUrl = (url: string) => {
  if (!url || url === "#") return "";

  const getAbbrFromSegments = (segments: string[]) => {
    const cleanSegments = segments
      .map((segment) => segment.trim())
      .filter(Boolean);

    const stopWords = ["home", "suhome", "view", "page", "article", "details"];

    const stopIndex = cleanSegments.findIndex((segment) =>
      stopWords.includes(segment.toLowerCase()),
    );

    if (stopIndex > 0) {
      return cleanSegments[stopIndex - 1];
    }

    return cleanSegments[cleanSegments.length - 1] || "";
  };

  try {
    const parsedUrl = new URL(url, "https://mu.menofia.edu.eg");
    return getAbbrFromSegments(parsedUrl.pathname.split("/"));
  } catch {
    return getAbbrFromSegments(String(url).split("/"));
  }
};

const extractUnitsFromHtml = (html: string): SpecialUnit[] => {
  if (!html) return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const links = Array.from(doc.querySelectorAll("ol li a[href], a[href]"));

  return links
    .map((link) => {
      const title = cleanText(link.textContent || "");
      const url = link.getAttribute("href") || "#";
      const abbr = extractSpecialUnitAbbrFromUrl(url);

      return {
        title,
        url,
        abbr,
      };
    })
    .filter((unit) => unit.title && unit.abbr);
};

const SpecialUnitsSection: React.FC<SpecialUnitsSectionProps> = ({
  articleId = DEFAULT_ARTICLE_ID,
  lang,
  defaultOpen = false,
}) => {
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();

 const currentLanguage = i18n.resolvedLanguage || i18n.language;
const normalizedLanguage = currentLanguage.toLowerCase();

const resolvedLang = lang ?? getLanguageId(currentLanguage);

const isRtl =
  normalizedLanguage.startsWith("ar") ||
  normalizedLanguage.startsWith("fa");

  const [article, setArticle] = useState<SpecialUnitsArticle | null>(null);
  const [units, setUnits] = useState<SpecialUnit[]>([]);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchSpecialUnits = async () => {
      setLoading(true);
      setArticle(null);
      setUnits([]);

      try {
        // Section title/header: fetched in the site's current language.
        const headerResponse = await newsService.getSectorPage({
          articleId,
          lang: resolvedLang,
        });

        if (!isMounted) return;

        const headerArticle = normalizeApiArticle(headerResponse);
        setArticle(headerArticle);

        // Units list: always sourced from the Arabic content, since it's
        // the only language version with working <a> links right now.
        if (resolvedLang === UNITS_SOURCE_LANG) {
          const htmlUnits = extractUnitsFromHtml(headerArticle?.content || "");
          if (isMounted) setUnits(htmlUnits);
        } else {
          const arResponse = await newsService.getSectorPage({
            articleId,
            lang: UNITS_SOURCE_LANG,
          });

          if (!isMounted) return;

          const arArticle = normalizeApiArticle(arResponse);
          const htmlUnits = extractUnitsFromHtml(arArticle?.content || "");
          setUnits(htmlUnits);
        }
      } catch (error) {
        console.error("Error fetching special units article:", error);

        if (isMounted) {
          setArticle(null);
          setUnits([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSpecialUnits();

    return () => {
      isMounted = false;
    };
  }, [articleId, resolvedLang]);

  const sectionTitle = useMemo(() => {
    return (
      article?.title ||
      t("specialUnits.title", {
        defaultValue: isRtl ? "الوحدات ذات الطابع الخاص" : "Special Unit",
      })
    );
  }, [article?.title, isRtl, t]);

  const handleUnitClick = (unit: SpecialUnit) => {
    if (!unit.abbr) return;

    sessionStorage.setItem(
      `specialUnitTitle:${resolvedLang}:${unit.abbr.toLowerCase()}`,
      unit.title,
    );

    navigate(`/special-units/${encodeURIComponent(unit.abbr)}`, {
      state: {
        title: unit.title,
        abbr: unit.abbr,
      },
    });
  };

const shouldShowBody = isOpen;
  return (
    <section
      className={`special-units-section ${isRtl ? "is-rtl" : "is-ltr"}`}
      dir={isRtl ? "rtl" : "ltr"}
      lang={currentLanguage}
    >
      <button
  type="button"
  className={`special-units-header ${isOpen ? "open" : ""}`}
  onClick={() => setIsOpen((prev) => !prev)}
  aria-expanded={isOpen}
>
        <span className="special-units-title-wrap">
          <span className="special-units-dot" />

          <span className="special-units-title">{sectionTitle}</span>
        </span>

        <ChevronDown
          size={34}
          strokeWidth={2.4}
          className="special-units-arrow"
        />
      </button>

      {shouldShowBody && (
        <div className="special-units-body">
          {loading ? (
            <div
              className="special-units-grid"
              aria-label={t("specialUnits.loading", {
                defaultValue: isRtl
                  ? "جاري تحميل الوحدات"
                  : "Loading special units",
              })}
            >
              {Array.from({ length: 12 }).map((_, index) => (
                <div
                  key={`special-unit-skeleton-${index}`}
                  className="special-unit-card skeleton-unit"
                  aria-hidden="true"
                />
              ))}
            </div>
          ) : units.length > 0 ? (
            <div className="special-units-grid">
              {units.map((unit, index) => (
                <button
                  key={`${unit.abbr}-${unit.title}-${index}`}
                  type="button"
                  className="special-unit-card"
                  onClick={() => handleUnitClick(unit)}
                  disabled={!unit.abbr}
                  aria-label={t("specialUnits.openUnit", {
                    unitTitle: unit.title,
                    defaultValue: isRtl
                      ? `فتح ${unit.title}`
                      : `Open ${unit.title}`,
                  })}
                >
                  <ExternalLink size={22} strokeWidth={2.5} />
                  <span>{unit.title}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="special-units-empty">
              {isRtl ? "لا توجد وحدات متاحة حاليًا" : "No special units available"}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default SpecialUnitsSection;