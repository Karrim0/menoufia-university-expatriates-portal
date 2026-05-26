import React, { useEffect, useMemo, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import newsService from "../Services/newsService";
import { SmartImage } from "../utils/imageHelper";
import ErrorPage from "../ErrorPage/ErrorPage";
import "./FacultyHighlightDetails.css";

type SavedLang = {
  id?: number;
  code?: string;
  name?: string;
  flag?: string;
};

interface HighlightDetails {
  id: number;
  startDate: string;
  endDate: string;
  image: string;
  translationData: string;
}

const getSavedLang = (): SavedLang => {
  try {
    return JSON.parse(localStorage.getItem("lang") || "{}");
  } catch {
    return {};
  }
};

const getSavedLangId = () => Number(getSavedLang()?.id) || 1;

const stripHtml = (value = "") => {
  if (typeof window !== "undefined" && window.DOMParser) {
    const doc = new DOMParser().parseFromString(value, "text/html");
    return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
  }

  return String(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
};

const hasHtmlTags = (value = "") => /<\/?[a-z][\s\S]*>/i.test(value);

const getShortTitle = (text = "") => {
  const cleanText = stripHtml(text);

  if (!cleanText) return "";

  const firstSentence = cleanText.split(/[.؟!]/)[0]?.trim();

  if (firstSentence && firstSentence.length <= 140) {
    return firstSentence;
  }

  return cleanText.length > 140 ? `${cleanText.slice(0, 140)}...` : cleanText;
};

const FacultyHighlightDetails: React.FC = () => {
  const { fac, id, departmentCode } = useParams<{
    fac: string;
    id: string;
    departmentCode?: string;
  }>();

  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { i18n } = useTranslation();

  const savedLang = getSavedLang();
  const isArabic = savedLang?.code === "ar" || i18n.language === "ar";
  const isRTL = isArabic;

  const facId = Number(fac) || 0;
  const highlightId = Number(id) || 0;

  const langId =
    Number(searchParams.get("lang")) ||
    Number(location.state?.langId) ||
    getSavedLangId();

  const collegeName: string = location.state?.collegeName || "";

  const initialHighlight =
    location.state?.highlight || location.state?.news || null;

  const [highlight, setHighlight] = useState<HighlightDetails | null>(
    initialHighlight,
  );
  const [loading, setLoading] = useState(!initialHighlight);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchHighlightDetails = async () => {
      if (!facId || !highlightId || !langId) {
        setHighlight(null);
        setNotFound(true);
        setLoading(false);
        return;
      }

      if (initialHighlight?.id === highlightId) {
        setHighlight(initialHighlight);
        setNotFound(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      setNotFound(false);

      try {
        const response = await newsService.getHighlights({
          fac: facId,
          langId,
          departmentCode: departmentCode || "",
          pageIndex: 1,
          pageSize: 100,
        });

        if (!isMounted) return;

        const result: HighlightDetails[] = Array.isArray(response?.result)
          ? response.result
          : [];

        const matchedHighlight = result.find(
          (item) => Number(item.id) === highlightId,
        );

        if (matchedHighlight) {
          setHighlight(matchedHighlight);
          setNotFound(false);
        } else {
          setHighlight(null);
          setNotFound(true);
        }
      } catch (error) {
        console.error("Failed to fetch highlight details:", error);

        if (isMounted) {
          setHighlight(null);
          setNotFound(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchHighlightDetails();

    return () => {
      isMounted = false;
    };
  }, [facId, highlightId, langId, departmentCode]);

  const title = useMemo(
    () => getShortTitle(highlight?.translationData || ""),
    [highlight?.translationData],
  );

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";

    return new Date(dateStr).toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleBack = () => {
    if (departmentCode) {
      navigate(`/fac/${facId}/department/${departmentCode}`, {
        state: {
          collegeName,
          langId,
        },
      });

      return;
    }

    navigate(`/fac/${facId}`, {
      state: {
        collegeName,
        langId,
      },
    });
  };

  if (notFound) {
    return <ErrorPage />;
  }

  return (
    <div className="fhd-wrapper" dir={isRTL ? "rtl" : "ltr"}>
      <div className="fhd-breadcrumb">
        <Link to="/" className="fhd-breadcrumb-link">
          {isArabic ? "الرئيسية" : "Home"}
        </Link>

        <span className="fhd-breadcrumb-sep">›</span>

        <button type="button" className="fhd-breadcrumb-btn" onClick={handleBack}>
          {collegeName ||
            (departmentCode
              ? isArabic
                ? "أخبار القسم"
                : "Department News"
              : isArabic
                ? "أخبار الكلية"
                : "Faculty News")}
        </button>

        <span className="fhd-breadcrumb-sep">›</span>

        <span className="fhd-breadcrumb-current">
          {isArabic ? "تفاصيل السلايدر" : "Highlight Details"}
        </span>
      </div>

      {loading ? (
        <div className="fhd-loading-wrap">
          <div className="fhd-spinner" />
        </div>
      ) : highlight ? (
        <article className="fhd-article">
          <header className="fhd-header">
            <h1 className="fhd-title">
              {title || (isArabic ? "تفاصيل الخبر" : "Highlight Details")}
            </h1>

            <div className="fhd-meta">
              {highlight.startDate && (
                <span className="fhd-meta-item">
                  <i className="fa-regular fa-calendar" />
                  {formatDate(highlight.startDate)}
                </span>
              )}
            </div>
          </header>

          {highlight.image && (
            <div className="fhd-img-wrap">
              <SmartImage
                src={highlight.image}
                alt={title || "Highlight image"}
              />
            </div>
          )}

          {highlight.translationData && (
            hasHtmlTags(highlight.translationData) ? (
              <div
                className="fhd-body"
                dangerouslySetInnerHTML={{ __html: highlight.translationData }}
              />
            ) : (
              <div className="fhd-body">
                <p>{highlight.translationData}</p>
              </div>
            )
          )}

          <div className="fhd-footer">
            <button className="fhd-back-btn" onClick={handleBack} type="button">
              {isArabic
                ? departmentCode
                  ? "→ رجوع لأخبار القسم"
                  : "→ رجوع لأخبار الكلية"
                : departmentCode
                  ? "← Back to Department News"
                  : "← Back to Faculty News"}
            </button>
          </div>
        </article>
      ) : null}
    </div>
  );
};

export default FacultyHighlightDetails;