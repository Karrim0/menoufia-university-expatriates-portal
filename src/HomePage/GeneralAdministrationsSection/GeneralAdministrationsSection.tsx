import React, { useEffect, useMemo, useState } from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import newsService from "../../Services/newsService";
import "./GeneralAdministrationsSection.css";

type GeneralAdministration = {
  title: string;
  abbr: string;
};

type GeneralAdministrationsSectionProps = {
  defaultOpen?: boolean;
};

const normalizeApiArray = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.result)) return data.data.result;

  return [];
};

const cleanText = (value: string) => {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;

  return textarea.value.replace(/\s+/g, " ").trim();
};

const normalizeGeneralAdministrations = (data: any): GeneralAdministration[] => {
  const rawItems = normalizeApiArray(data);

  return rawItems
    .map((item) => {
      const title = cleanText(
        item?.title ||
          item?.Title ||
          item?.name ||
          item?.Name ||
          item?.administrationName ||
          item?.AdministrationName ||
          item?.generalAdministrationName ||
          item?.GeneralAdministrationName ||
          "",
      );

      const abbr = String(
        item?.abbr ||
          item?.Abbr ||
          item?.abbreviation ||
          item?.Abbreviation ||
          item?.code ||
          item?.Code ||
          item?.keyword ||
          item?.Keyword ||
          "",
      ).trim();

      return {
        title,
        abbr,
      };
    })
    .filter((item) => item.title && item.abbr);
};

const getLanguageDirection = (language: string) => {
  const lang = language.toLowerCase();

  return lang.startsWith("ar") || lang.startsWith("fa") ? "rtl" : "ltr";
};

const getGeneralAdministrationsLangId = (language: string) => {
  const lang = language.toLowerCase();

  return lang.startsWith("ar") ? 1 : 2;
};

const GeneralAdministrationsSection: React.FC<
  GeneralAdministrationsSectionProps
> = ({ defaultOpen = false }) => {
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();

  const currentLanguage = i18n.resolvedLanguage || i18n.language;

  const direction = useMemo(() => {
    return getLanguageDirection(currentLanguage);
  }, [currentLanguage]);

  const isRtl = direction === "rtl";

  const requestLangId = useMemo(() => {
    return getGeneralAdministrationsLangId(currentLanguage);
  }, [currentLanguage]);

  const [administrations, setAdministrations] = useState<
    GeneralAdministration[]
  >([]);

  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchAdministrations = async () => {
      setLoading(true);
      setAdministrations([]);

      try {
        const response = await newsService.getGeneralAdministrations({
          langId: requestLangId,
        });

        if (!isMounted) return;

        setAdministrations(normalizeGeneralAdministrations(response));
      } catch (error) {
        console.error("Error fetching general administrations:", error);

        if (isMounted) {
          setAdministrations([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAdministrations();

    return () => {
      isMounted = false;
    };
  }, [requestLangId]);

  const sectionTitle = t("generalAdministrations.title", {
    defaultValue: isRtl ? "الإدارات العامة" : "General Administrations",
  });

  const handleAdministrationClick = (administration: GeneralAdministration) => {
    if (!administration.abbr) return;

    sessionStorage.setItem(
      `generalAdministrationTitle:${requestLangId}:${administration.abbr.toLowerCase()}`,
      administration.title,
    );

    navigate(
      `/general-administrations/${encodeURIComponent(administration.abbr)}`,
      {
        state: {
          title: administration.title,
          keyword: administration.abbr,
        },
      },
    );
  };

  return (
    <section
      className={`general-administrations-section ${
        isRtl ? "is-rtl" : "is-ltr"
      }`}
      dir={direction}
      lang={currentLanguage}
    >
      <button
        type="button"
        className={`general-administrations-header ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <span className="general-administrations-title-wrap">
          <span className="general-administrations-dot" />

          <span className="general-administrations-title">{sectionTitle}</span>
        </span>

        <ChevronDown
          size={34}
          strokeWidth={2.4}
          className="general-administrations-arrow"
        />
      </button>

      {isOpen && (
        <div className="general-administrations-body">
          {loading ? (
            <div
              className="general-administrations-grid"
              aria-label={
                isRtl
                  ? "جاري تحميل الإدارات العامة"
                  : "Loading general administrations"
              }
            >
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={`general-administration-skeleton-${index}`}
                  className="general-administration-card skeleton-administration"
                  aria-hidden="true"
                />
              ))}
            </div>
          ) : administrations.length > 0 ? (
            <div className="general-administrations-grid">
              {administrations.map((administration, index) => (
                <button
                  key={`${administration.abbr}-${administration.title}-${index}`}
                  type="button"
                  className="general-administration-card"
                  onClick={() => handleAdministrationClick(administration)}
                  disabled={!administration.abbr}
                  aria-label={
                    isRtl
                      ? `فتح ${administration.title}`
                      : `Open ${administration.title}`
                  }
                >
                  <ExternalLink size={22} strokeWidth={2.5} />
                  <span>{administration.title}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="general-administrations-empty">
              {isRtl
                ? "لا توجد إدارات متاحة حاليًا"
                : "No general administrations available"}
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default GeneralAdministrationsSection;