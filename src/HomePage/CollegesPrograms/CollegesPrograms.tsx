import React, { useEffect, useMemo, useRef, useState } from "react";
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
  fac: number;
}

const normalizeName = (value: string): string =>
  String(value || "")
    .trim()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .toLowerCase();

const FAC_MAP: Record<string, number> = {
  [normalizeName("كلية العلوم")]: 100,
  [normalizeName("كلية علوم")]: 100,

  [normalizeName("كلية الطب")]: 200,

  [normalizeName("كلية الزراعة")]: 300,
  [normalizeName("كليه الزراعه")]: 300,

  [normalizeName("كلية الهندسة")]: 400,
  [normalizeName("كليه الهندسه")]: 400,

  [normalizeName("كلية التجارة")]: 500,
  [normalizeName("كليه التجاره")]: 500,

  [normalizeName("كلية الحقوق")]: 600,

  [normalizeName("كلية طب الأسنان")]: 700,
  [normalizeName("كلية طب الاسنان")]: 700,

  [normalizeName("كلية التمريض")]: 800,

  [normalizeName("كلية الصيدلة")]: 900,
  [normalizeName("كليه الصيدله")]: 900,

  [normalizeName("كلية الطب البيطري")]: 1000,
  [normalizeName("كلية الطب البيطرى")]: 1000,
  [normalizeName("كليه الطب البيطري")]: 1000,

  [normalizeName("كلية الذكاء الاصطناعي")]: 1100,

  [normalizeName("كلية الآداب")]: 1200,
  [normalizeName("كلية الاداب")]: 1200,

  [normalizeName("كلية العلوم التطبيقية")]: 1300,
  [normalizeName("كلية العلوم الطبية التطبيقية")]: 1300,

  [normalizeName("كلية التربية للطفولة المبكرة")]: 1400,
  [normalizeName("كلية تربية الطفولة المبكره")]: 1400,

  [normalizeName("كلية التربية")]: 1500,
  [normalizeName("كلية تربية")]: 1500,

  [normalizeName("كلية التربية النوعية")]: 1600,

  [normalizeName("كلية الفنون الجميلة")]: 1700,

  [normalizeName("كلية الحاسبات والمعلومات")]: 1800,
  [normalizeName("كلية الحاسبات")]: 1800,

  [normalizeName("كلية الهندسة الالكترونية")]: 1900,
  [normalizeName("كلية الهندسة الإلكترونية")]: 1900,
  [normalizeName("FEE")]: 1900,

  [normalizeName("كلية التربية الرياضية")]: 2000,

  [normalizeName("كلية الاقتصاد المنزلي")]: 2100,
  [normalizeName("كلية الاقتصاد المنزلى")]: 2100,

  [normalizeName("Ho")]: 2200,

  [normalizeName("LIV")]: 2300,
  [normalizeName("معهد الكبد القومي")]: 2300,

  [normalizeName("كلية الإعلام")]: 2400,
  [normalizeName("كلية الاعلام")]: 2400,

  [normalizeName("Faculty of Science")]: 100,
  [normalizeName("Faculty of Medicine")]: 200,
  [normalizeName("Faculty of Agriculture")]: 300,
  [normalizeName("Faculty of Engineering")]: 400,
  [normalizeName("Faculty of Commerce")]: 500,
  [normalizeName("Faculty of Law")]: 600,
  [normalizeName("Faculty of Dentistry")]: 700,
  [normalizeName("Faculty of Nursing")]: 800,
  [normalizeName("Faculty of Pharmacy")]: 900,
  [normalizeName("Faculty of Veterinary Medicine")]: 1000,
  [normalizeName("Faculty of Artificial Intelligence")]: 1100,
  [normalizeName("Faculty of Arts")]: 1200,
  [normalizeName("Faculty of Applied Health Sciences Technology")]: 1300,
  [normalizeName("Faculty of Early Childhood Education")]: 1400,
  [normalizeName("Faculty of Education")]: 1500,
  [normalizeName("Faculty of Specific Education")]: 1600,
  [normalizeName("Faculty of Fine Arts")]: 1700,
  [normalizeName("Faculty of Computers and Information")]: 1800,
  [normalizeName("Faculty of Electronic Engineering")]: 1900,
  [normalizeName("Faculty of Physical Education")]: 2000,
  [normalizeName("Faculty of Home Economics")]: 2100,
  [normalizeName("National Liver Institute")]: 2300,
  [normalizeName("Faculty of Mass Communication")]: 2400,
};

const getFac = (title: string): number | null => {
  return FAC_MAP[normalizeName(title)] ?? null;
};

const normalizeApiResponse = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.result)) return data.result;
  return [];
};

const CollegesPrograms: React.FC = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();

  const [colleges, setColleges] = useState<College[]>([]);
  const [loading, setLoading] = useState(true);

  const requestIdRef = useRef(0);

  const selectedLangId = useMemo(() => {
    return getLanguageId(i18n.language);
  }, [i18n.language]);

  const isRTL = i18n.dir() === "rtl";
  const isArabic = i18n.language === "ar";

  const mapColleges = (data: any[]): College[] =>
    data
      .map((item) => {
        const fac = getFac(item.title);

        if (!fac) return null;

        return {
          id: Number(item.id),
          title: String(item.title || ""),
          url: String(item.url || "#"),
          order: Number(item.order || 0),
          fac,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => Number(a.fac) - Number(b.fac)) as College[];

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
        } catch {
          if (requestId !== requestIdRef.current) return;
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
    navigate(`/fac/${college.fac}`, {
      state: {
        collegeName: college.title,
        fac: college.fac,
        langId: selectedLangId,
      },
    });
  };

  const handleClassicClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation();
  };

  return (
    <section
      className={`cp-section ${isRTL ? "cp-rtl" : "cp-ltr"}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="cp-container">
        <div className="cp-titleWrap">
          <h2 className="cp-title">{isArabic ? "الكليات" : "Colleges"}</h2>
          <span className="cp-underline" />
        </div>

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
            {colleges.map((college) => (
              <article
                key={`${college.fac}-${college.id}-${selectedLangId}`}
                className="cp-card"
                onClick={() => handleCollegeClick(college)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleCollegeClick(college);
                  }
                }}
              >
                <div className="cp-card-title" title={college.title}>
                  <span className="cp-title-text">{college.title}</span>
                  <svg
  className="cp-arrow-icon"
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
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
                      {isArabic ? "الموقع الكلاسيكي" : "Classic website"}
                    </span>

                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CollegesPrograms;