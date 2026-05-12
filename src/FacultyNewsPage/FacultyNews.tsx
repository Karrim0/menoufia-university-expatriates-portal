import React, { useCallback, useEffect, useState } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import newsService from "../Services/newsService";
import { SmartImage } from "../utils/imageHelper";
import "../NewsPage/News.css";
import "./FacultyNews.css";

const ITEMS_PER_PAGE = 10;

interface NewsItem {
  id: number;
  title: string;
  date: string;
  currentDate?: string;
  image: string;
  source: string;
  imageAlt: string;
}

type SavedLang = {
  id?: number;
  code?: string;
  name?: string;
  flag?: string;
};

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
  [normalizeName("Faculty of Science")]: 100,

  [normalizeName("كلية الطب")]: 200,
  [normalizeName("Faculty of Medicine")]: 200,

  [normalizeName("كلية الزراعة")]: 300,
  [normalizeName("كليه الزراعه")]: 300,
  [normalizeName("Faculty of Agriculture")]: 300,

  [normalizeName("كلية الهندسة")]: 400,
  [normalizeName("كليه الهندسه")]: 400,
  [normalizeName("Faculty of Engineering")]: 400,

  [normalizeName("كلية التجارة")]: 500,
  [normalizeName("كليه التجاره")]: 500,
  [normalizeName("Faculty of Commerce")]: 500,

  [normalizeName("كلية الحقوق")]: 600,
  [normalizeName("Faculty of Law")]: 600,

  [normalizeName("كلية طب الأسنان")]: 700,
  [normalizeName("كلية طب الاسنان")]: 700,
  [normalizeName("Faculty of Dentistry")]: 700,

  [normalizeName("كلية التمريض")]: 800,
  [normalizeName("Faculty of Nursing")]: 800,

  [normalizeName("كلية الصيدلة")]: 900,
  [normalizeName("كليه الصيدله")]: 900,
  [normalizeName("Faculty of Pharmacy")]: 900,

  [normalizeName("كلية الطب البيطري")]: 1000,
  [normalizeName("كلية الطب البيطرى")]: 1000,
  [normalizeName("Faculty of Veterinary Medicine")]: 1000,

  [normalizeName("كلية الذكاء الاصطناعي")]: 1100,
  [normalizeName("Faculty of Artificial Intelligence")]: 1100,

  [normalizeName("كلية الآداب")]: 1200,
  [normalizeName("كلية الاداب")]: 1200,
  [normalizeName("Faculty of Arts")]: 1200,

  [normalizeName("كلية العلوم التطبيقية")]: 1300,
  [normalizeName("كلية العلوم الطبية التطبيقية")]: 1300,
  [normalizeName("Faculty of Applied Health Sciences Technology")]: 1300,

  [normalizeName("كلية التربية للطفولة المبكرة")]: 1400,
  [normalizeName("كلية تربية الطفولة المبكره")]: 1400,
  [normalizeName("Faculty of Early Childhood Education")]: 1400,

  [normalizeName("كلية التربية")]: 1500,
  [normalizeName("كلية تربية")]: 1500,
  [normalizeName("Faculty of Education")]: 1500,

  [normalizeName("كلية التربية النوعية")]: 1600,
  [normalizeName("Faculty of Specific Education")]: 1600,

  [normalizeName("كلية الفنون الجميلة")]: 1700,
  [normalizeName("Faculty of Fine Arts")]: 1700,

  [normalizeName("كلية الحاسبات والمعلومات")]: 1800,
  [normalizeName("كلية الحاسبات")]: 1800,
  [normalizeName("Faculty of Computers and Information")]: 1800,

  [normalizeName("كلية الهندسة الالكترونية")]: 1900,
  [normalizeName("كلية الهندسة الإلكترونية")]: 1900,
  [normalizeName("Faculty of Electronic Engineering")]: 1900,
  [normalizeName("FEE")]: 1900,

  [normalizeName("كلية التربية الرياضية")]: 2000,
  [normalizeName("Faculty of Physical Education")]: 2000,

  [normalizeName("كلية الاقتصاد المنزلي")]: 2100,
  [normalizeName("كلية الاقتصاد المنزلى")]: 2100,
  [normalizeName("Faculty of Home Economics")]: 2100,

  [normalizeName("Ho")]: 2200,

  [normalizeName("معهد الكبد القومي")]: 2300,
  [normalizeName("LIV")]: 2300,
  [normalizeName("National Liver Institute")]: 2300,

  [normalizeName("كلية الإعلام")]: 2400,
  [normalizeName("كلية الاعلام")]: 2400,
  [normalizeName("Faculty of Mass Communication")]: 2400,
};

const getFac = (title: string): number | null => {
  return FAC_MAP[normalizeName(title)] ?? null;
};

const getSavedLang = (): SavedLang => {
  try {
    return JSON.parse(localStorage.getItem("lang") || "{}");
  } catch {
    return {};
  }
};

const getSavedLangId = () => {
  return Number(getSavedLang()?.id) || 1;
};

const normalizeApiResponse = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.result)) return data.result;
  return [];
};

const FacultyNews: React.FC = () => {
  const { fac } = useParams<{ fac: string }>();
  const location = useLocation();
  const { i18n } = useTranslation();

  const savedLang = getSavedLang();
  const isArabic = savedLang?.code === "ar" || i18n.language === "ar";
  const isRTL = isArabic;

  const [langId, setLangId] = useState<number>(
    Number(location.state?.langId) || getSavedLangId()
  );
const [collegeNameFallback, setCollegeNameFallback] = useState<string>("");

  const [collegeName, setCollegeName] = useState<string>("");
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [pageIndex, setPageIndex] = useState(1);
  const [moveNext, setMoveNext] = useState(false);
  const [movePrevious, setMovePrevious] = useState(false);

useEffect(() => {
  const fetchCollegeName = async () => {
    const currentLangId = getSavedLangId();
    const facultyCode = Number(fac);

    setLangId(currentLangId);
    setPageIndex(1);
    setSearch("");
    setSearchInput("");

    try {
      let response = await newsService.getColleges(currentLangId);
      let colleges = normalizeApiResponse(response);

      const matchedCollege = colleges.find((college: any) =>
        getFac(college.title) === facultyCode
      );

      if (matchedCollege?.title) {
        setCollegeName(matchedCollege.title);
      } else {
        setCollegeName(collegeNameFallback || "");
      }

      if (currentLangId !== 2) {
        const enResponse = await newsService.getColleges(2);
        const enColleges = normalizeApiResponse(enResponse);
        const enMatch = enColleges.find((college: any) =>
          getFac(college.title) === facultyCode
        );
        if (enMatch?.title) {
          setCollegeNameFallback(enMatch.title);
          if (!matchedCollege?.title) {
            setCollegeName(enMatch.title);
          }
        }
      } else {
        if (matchedCollege?.title) {
          setCollegeNameFallback(matchedCollege.title);
        }
      }

    } catch (error) {
      console.error("Failed to fetch college name:", error);
      setCollegeName(collegeNameFallback || "");
    }
  };

  fetchCollegeName();
}, [fac, i18n.language]);

  const fetchNews = useCallback(async () => {
    const facultyCode = Number(fac);

    if (!facultyCode || !langId) {
      setNews([]);
      setMoveNext(false);
      setMovePrevious(false);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const data = await newsService.getFacultyNews({
        fac: facultyCode,
        langId: Number(langId),
        pageIndex,
        pageSize: ITEMS_PER_PAGE,
        search,
      });

      const result: NewsItem[] = Array.isArray(data?.result)
        ? data.result
        : [];

      setNews(result);
      setMoveNext(Boolean(data?.moveNext));
      setMovePrevious(Boolean(data?.movePrevious));
    } catch (error) {
      console.error("Failed to fetch faculty news:", error);
      setNews([]);
      setMoveNext(false);
      setMovePrevious(false);
    } finally {
      setLoading(false);
    }
  }, [fac, langId, pageIndex, search]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  const handleSearch = (e: React.FormEvent) => {
  e.preventDefault();

  const value = searchInput.trim();

  setPageIndex(1);
  setSearch(value);
};

const handleClearSearch = () => {
  setSearchInput("");
  setSearch("");
  setPageIndex(1);
};

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";

    return new Date(dateStr).toLocaleDateString(
      isArabic ? "ar-EG" : "en-US",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  return (
    <div className="news-page-wrapper">
      <section className="news-hero">
        <div className="news-hero-overlay" />

        <div className="news-hero-content">
<h1 className="news-hero-title">
  {isArabic
    ? `أخبار ${collegeName || collegeNameFallback || "..."}`
    : `${collegeName || collegeNameFallback || "..."} News`}
</h1>
 

  <form className="news-search-bar" onSubmit={handleSearch}>
            <button
              type="submit"
              className="news-search-icon-btn"
              aria-label="search"
            >
              <i className="fa-solid fa-magnifying-glass"></i>
            </button>

            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={
                isArabic ? "ابحث في أخبار الكلية..." : "Search faculty news..."
              }
            />

            {searchInput && (
              <button
                type="button"
                className="news-clear-btn"
                onClick={handleClearSearch}
                aria-label="clear search"
              >
                ×
              </button>
            )}
          </form>
        </div>
      </section>

      <section className="news-main-content" dir={isRTL ? "rtl" : "ltr"}>
        <div className="news-content-wrapper">
          {loading ? (
            <div className="news-cards-grid">
              {Array.from({ length: 6 }).map((_, index) => (
                <article key={index} className="news-card skeleton-card">
                  <div className="news-card-text">
                    <div className="skeleton skeleton-title" />
                    <div className="skeleton skeleton-line" />
                    <div className="skeleton skeleton-line short" />
                    <div className="skeleton skeleton-date" />
                  </div>

                  <div className="news-card-image">
                    <div className="skeleton skeleton-image" />
                  </div>
                </article>
              ))}
            </div>
          ) : news.length === 0 ? (
            <div className="news-no-results">
              <h2>
                {isArabic
                  ? "لا توجد أخبار لهذه الكلية"
                  : "No news found for this faculty"}
              </h2>
            </div>
          ) : (
            <div className="news-cards-grid">
              {news.map((item) => (
                <article key={item.id} className="news-card">
                  <Link
                    to={`/fac/details/${item.id}`}
                    state={{
                      news: item,
                      newsType: "faculty",
                      fac: Number(fac),
                      langId: Number(langId),
                      collegeName,
                    }}
                    className="news-card-link"
                  >
                    <div className="news-card-text">
                      <h3 className="news-card-title">
                        {item.title?.slice(0, 85) || ""}
                        {(item.title?.length || 0) > 85 ? "..." : ""}
                      </h3>

                      {item.source && (
                        <p className="news-card-description">
                          {item.source}
                        </p>
                      )}

                      <span className="news-card-date">
                        {formatDate(item.date)}
                      </span>
                    </div>

                    <div className="news-card-image">
                      <SmartImage
                        src={item.image}
                        alt={item.imageAlt || item.title || ""}
                      />
                    </div>

                    <div className="news-card-arrow">
                      <i className="fa-solid fa-arrow-up"></i>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}

          {news.length > 0 && (
            <div className="news-pagination">
              <button
                className="news-pagination-arrow"
                disabled={!movePrevious || loading}
                onClick={() => setPageIndex((prev) => Math.max(1, prev - 1))}
                aria-label="Previous page"
              >
                <i className="fa-solid fa-chevron-left"></i>
              </button>

              <div className="news-pagination-number active">{pageIndex}</div>

              <button
                className="news-pagination-arrow"
                disabled={!moveNext || loading}
                onClick={() => setPageIndex((prev) => prev + 1)}
                aria-label="Next page"
              >
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default FacultyNews;