import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import newsService from "../../Services/newsService";
import "./SpecialUnitsSection.css";

type SpecialUnit = {
  title: string;
  url: string;
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

    const homeIndex = cleanSegments.findIndex(
      (segment) => segment.toLowerCase() === "home",
    );

    if (homeIndex > 0) {
      return cleanSegments[homeIndex - 1];
    }

    return cleanSegments[0] || "";
  };

  try {
    const parsedUrl = new URL(url);
    return getAbbrFromSegments(parsedUrl.pathname.split("/"));
  } catch {
    return getAbbrFromSegments(String(url).split("/"));
  }
};

const extractUnitsFromHtml = (html: string): SpecialUnit[] => {
  if (!html) return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const links = Array.from(doc.querySelectorAll("ol li a"));

  return links
    .map((link) => ({
      title: cleanText(link.textContent || ""),
      url: link.getAttribute("href") || "#",
    }))
    .filter((unit) => unit.title.length > 0);
};

const SpecialUnitsSection: React.FC<SpecialUnitsSectionProps> = ({
  articleId = DEFAULT_ARTICLE_ID,
  lang = 1,
  defaultOpen = false,
}) => {
  const navigate = useNavigate();

  const [article, setArticle] = useState<SpecialUnitsArticle | null>(null);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchSpecialUnits = async () => {
      setLoading(true);

      try {
        const response = await newsService.getSectorPage({
          articleId,
          lang,
        });

        if (!isMounted) return;

        setArticle(response?.result || null);
      } catch (error) {
        console.error("Error fetching special units:", error);

        if (isMounted) {
          setArticle(null);
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
  }, [articleId, lang]);

  const units = useMemo(() => {
    return extractUnitsFromHtml(article?.content || "");
  }, [article?.content]);

  const handleUnitClick = (unit: SpecialUnit) => {
  const abbr = extractSpecialUnitAbbrFromUrl(unit.url);

  if (!abbr) return;

  sessionStorage.setItem(
    `specialUnitTitle:${abbr.toLowerCase()}`,
    unit.title,
  );

  navigate(`/special-units/${encodeURIComponent(abbr)}`, {
    state: {
      title: unit.title,
      abbr,
    },
  });
};

  if (!loading && units.length === 0) {
    return null;
  }

  const shouldShowBody = loading || isOpen;

  return (
    <section className="special-units-section" dir="rtl">
      <button
        type="button"
        className={`special-units-header ${isOpen ? "open" : ""}`}
        onClick={() => {
          if (!loading) {
            setIsOpen((prev) => !prev);
          }
        }}
        aria-expanded={isOpen}
        disabled={loading}
      >
        <span className="special-units-title-wrap">
          <span className="special-units-dot" />

          <span className="special-units-title">
            {article?.title || "الوحدات ذات الطابع الخاص"}
          </span>
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
              aria-label="جاري تحميل الوحدات"
            >
              {Array.from({ length: 12 }).map((_, index) => (
                <div
                  key={`special-unit-skeleton-${index}`}
                  className="special-unit-card skeleton-unit"
                  aria-hidden="true"
                />
              ))}
            </div>
          ) : (
            <div className="special-units-grid">
              {units.map((unit, index) => {
                const abbr = extractSpecialUnitAbbrFromUrl(unit.url);
                const canOpenUnit = Boolean(abbr);

                return (
                  <button
                    key={`${unit.title}-${index}`}
                    type="button"
                    className="special-unit-card"
                    onClick={() => handleUnitClick(unit)}
                    disabled={!canOpenUnit}
                    aria-label={`فتح ${unit.title}`}
                  >
                    <ExternalLink size={22} strokeWidth={2.5} />

                    <span>{unit.title}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default SpecialUnitsSection;