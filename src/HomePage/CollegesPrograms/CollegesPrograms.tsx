import React, { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import "./CollegesPrograms.css";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import newsService from "../../Services/newsService";
import { getLanguageId } from "../../utils/language";

interface College {
  id: number;
  title: string;
  url: string;
  order: number;
  fac: number | null;
  apiIndex: number;
}

const getApiFac = (item: any): number | null => {
  const possibleCodes = [
    item?.fac,
    item?.Fac,
    item?.publicCode,
    item?.PublicCode,
    item?.facCode,
    item?.facultyCode,
    item?.code,
  ];

  for (const possibleCode of possibleCodes) {
    const numericCode = Number(possibleCode);

    if (Number.isFinite(numericCode) && numericCode > 0) {
      return numericCode;
    }
  }

  return null;
};

const hasValidFac = (fac: number | null): fac is number => {
  return Number.isFinite(Number(fac)) && Number(fac) > 0;
};

const normalizeApiResponse = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.result)) return data.data.result;

  return [];
};

const CollegesPrograms: React.FC = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);

  const requestIdRef = useRef(0);

  const selectedLangId = useMemo(() => {
    return getLanguageId(i18n.language);
  }, [i18n.language]);

  const isRTL = i18n.dir() === "rtl";
  const isArabic = i18n.language.toLowerCase().startsWith("ar");

  const mapColleges = (data: any[]): College[] => {
    return data
      .map((item, apiIndex): College | null => {
        const title = String(item?.title || "").trim();

        if (!title) return null;

        return {
          id: Number(item?.id || apiIndex),
          title,
          url: String(item?.url || ""),
          order: Number(item?.order || 0),
          fac: getApiFac(item),
          apiIndex,
        };
      })
      .filter((college): college is College => college !== null)
      .sort((firstCollege, secondCollege) => {
        const firstHasFac = hasValidFac(firstCollege.fac);
        const secondHasFac = hasValidFac(secondCollege.fac);

        if (firstHasFac && secondHasFac) {
          return (
            Number(firstCollege.fac) - Number(secondCollege.fac) ||
            firstCollege.apiIndex - secondCollege.apiIndex
          );
        }

        if (firstHasFac !== secondHasFac) {
          return firstHasFac ? -1 : 1;
        }

        return (
          firstCollege.order - secondCollege.order ||
          firstCollege.apiIndex - secondCollege.apiIndex
        );
      });
  };

  useEffect(() => {
    const fetchColleges = async () => {
      const requestId = ++requestIdRef.current;

      setLoading(true);

      try {
        let response = await newsService.getColleges(selectedLangId);
        let data = normalizeApiResponse(response);

        if (data.length === 0 && selectedLangId !== 2) {
          response = await newsService.getColleges(2);
          data = normalizeApiResponse(response);
        }

        if (requestId !== requestIdRef.current) return;

        setColleges(mapColleges(data));
      } catch (error) {
        if (requestId !== requestIdRef.current) return;

        console.error("Error fetching colleges:", error);

        try {
          const fallbackResponse = await newsService.getColleges(2);
          const fallbackData = normalizeApiResponse(fallbackResponse);

          if (requestId !== requestIdRef.current) return;

          setColleges(mapColleges(fallbackData));
        } catch (fallbackError) {
          if (requestId !== requestIdRef.current) return;

          console.error("Error fetching fallback colleges:", fallbackError);
          setColleges([]);
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    };

    fetchColleges();
  }, [selectedLangId]);

  const handleCollegeClick = (college: College) => {
    if (!hasValidFac(college.fac)) return;

    navigate(`/fac/${college.fac}`, {
      state: {
        collegeName: college.title,
        fac: college.fac,
        langId: selectedLangId,
      },
    });
  };

  const handleClassicClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
  ) => {
    event.stopPropagation();
  };

  return (
    <section
      className={`cp-section ${isRTL ? "cp-rtl" : "cp-ltr"}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="cp-container">
        <button
          type="button"
          className={`cp-collapse-header ${isOpen ? "open" : ""}`}
          onClick={() => setIsOpen((previousState) => !previousState)}
        >
          <span className="cp-titleWrap">
            <span className="cp-dot" />

            <span className="cp-title">
              {isArabic ? "الكليات" : "Colleges"}
            </span>
          </span>

          <ChevronDown
            size={34}
            strokeWidth={2.4}
            className="cp-collapse-arrow"
          />
        </button>

        {isOpen && (
          <div className="cp-collapse-body">
            {loading ? (
              <div className="cp-loading">
                {isArabic ? "جاري التحميل..." : "Loading..."}
              </div>
            ) : colleges.length === 0 ? (
              <div className="cp-empty">
                {isArabic ? "لا توجد كليات" : "No colleges found"}
              </div>
            ) : (
              <div className="cp-grid">
                {colleges.map((college) => {
                  const hasInternalPage = hasValidFac(college.fac);

                  return (
                    <article
                      key={`${college.fac ?? "new"}-${college.id}-${college.apiIndex}-${selectedLangId}`}
                      className="cp-card"
                      onClick={
                        hasInternalPage
                          ? () => handleCollegeClick(college)
                          : undefined
                      }
                      role={hasInternalPage ? "button" : undefined}
                      tabIndex={hasInternalPage ? 0 : undefined}
                      onKeyDown={
                        hasInternalPage
                          ? (event) => {
                              if (
                                event.key === "Enter" ||
                                event.key === " "
                              ) {
                                event.preventDefault();
                                handleCollegeClick(college);
                              }
                            }
                          : undefined
                      }
                    >
                      <div className="cp-card-title" title={college.title}>
                        <span className="cp-title-text">
                          {college.title}
                        </span>

                        {hasInternalPage && (
                          <svg
                            className="cp-arrow-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />

                            <polyline
                              points="15 3 21 3 21 9"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />

                            <line
                              x1="10"
                              y1="14"
                              x2="21"
                              y2="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>

                      {college.url && college.url !== "#" && (
                        <a
                          href={college.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cp-classic-link"
                          onClick={handleClassicClick}
                        >
                          <span className="cp-classic-text">
                            {isArabic
                              ? "الموقع الكلاسيكي"
                              : "Classic website"}
                          </span>

                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />

                            <polyline
                              points="15 3 21 3 21 9"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />

                            <line
                              x1="10"
                              y1="14"
                              x2="21"
                              y2="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </a>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default CollegesPrograms;