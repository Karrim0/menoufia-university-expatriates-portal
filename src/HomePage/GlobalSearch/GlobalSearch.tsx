import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import newsService from "../../Services/newsService";
import "./GlobalSearch.css";
import { getLanguageId } from "../../utils/language";

const DEBOUNCE = 400;
const MAX_PER_GRP = 4;

const LANGUAGE_IDS = {
  ar: 1,
  en: 2,
  fr: 3,
  ja: 23,
  de: 24,
  tr: 25,
  fa: 26,
  ru: 27,
  ch: 28,
  it: 29,
};

const LANGUAGE_CODES_BY_ID: Record<number, string> = {
  1: "AR",
  2: "EN",
  3: "FR",
  23: "JA",
  24: "DE",
  25: "TR",
  26: "FA",
  27: "RU",
  28: "CH",
  29: "IT",
};

const FACULTY_CODES = [
  100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200,
  1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400,
];

const detectSearchLanguageId = (text: string, fallbackLangId: number) => {
  const value = text.trim();

  if (!value) return fallbackLangId;

  if (/[پچژگک‌ی]/.test(value)) return LANGUAGE_IDS.fa;
  if (/[\u0600-\u06FF]/.test(value)) return LANGUAGE_IDS.ar;
  if (/[\u0400-\u04FF]/.test(value)) return LANGUAGE_IDS.ru;
  if (/[\u3040-\u30FF\u31F0-\u31FF]/.test(value)) return LANGUAGE_IDS.ja;
  if (/[\u4E00-\u9FFF]/.test(value)) return LANGUAGE_IDS.ch;
  if (/[çğıöşüÇĞİÖŞÜ]/.test(value)) return LANGUAGE_IDS.tr;
  if (/[äöüßÄÖÜ]/.test(value)) return LANGUAGE_IDS.de;
  if (/[âæçêëîïôœûüÿÂÆÇÊËÎÏÔŒÛÜŸ]/.test(value)) return LANGUAGE_IDS.fr;
  if (/[àèéìíîòóùúÀÈÉÌÍÎÒÓÙÚ]/.test(value)) return LANGUAGE_IDS.it;

  return LANGUAGE_IDS.en;
};

const SEARCH_ICON = (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const X_ICON = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ICONS: any = {
  news: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
      <path d="M18 14h-8M15 18h-5M10 6h8v4h-8z" />
    </svg>
  ),
  faculty: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  college: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  program: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  ),
};

function GlobalSearch() {
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const isRTL = i18n.dir() === "rtl";

  const fallbackLangId = useMemo(() => {
    return getLanguageId(i18n.language);
  }, [i18n.language]);

  const [query, setQuery] = useState("");

  const [results, setResults] = useState<any>({
    news: [],
    faculty: [],
    college: [],
    program: [],
  });

  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [cachedColleges, setCachedColleges] = useState<any[]>([]);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const emptyResults = () => {
    setResults({
      news: [],
      faculty: [],
      college: [],
      program: [],
    });
  };

  useEffect(() => {
    setCachedColleges([]);

    newsService
      .getColleges(fallbackLangId)
      .then((data: any) => {
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.result)
          ? data.result
          : [];

        setCachedColleges(list);
      })
      .catch(() => {
        setCachedColleges([]);
      });
  }, [fallbackLangId]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);

    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setOpen(false);
    setQuery("");
    emptyResults();
  }, [location.pathname, i18n.language]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
        emptyResults();
      }
    };

    document.addEventListener("keydown", handler);

    return () => document.removeEventListener("keydown", handler);
  }, []);

  const fetchFacultySearch = async (q: string, activeLangId: number) => {
    const facultyRequests = FACULTY_CODES.map((facCode) =>
      newsService
        .getFacultyNews({
          fac: facCode,
          langId: activeLangId,
          pageIndex: 1,
          pageSize: 2,
          search: q,
        })
        .then((res: any) => {
          const list = Array.isArray(res?.result) ? res.result : [];

          return list.map((item: any) => ({
            ...item,
            facultyCode: facCode,
          }));
        })
        .catch(() => [])
    );

    const facultyGroups = await Promise.all(facultyRequests);

    return facultyGroups
      .flat()
      .slice(0, MAX_PER_GRP);
  };

  const getProgramResults = async (q: string, activeLangId: number) => {
    const activeLangCode = LANGUAGE_CODES_BY_ID[activeLangId] || "EN";
    const programResults: any[] = [];

    try {
      const json = await import(`../../Local/${activeLangCode}/Programs.json`);
      const colleges = json?.colleges || json?.default?.colleges || [];

      if (Array.isArray(colleges)) {
        colleges.forEach((college: any) => {
          const programs = Array.isArray(college?.programs)
            ? college.programs
            : [];

          programs.forEach((program: string, index: number) => {
            if (
              String(program || "")
                .toLowerCase()
                .includes(q.toLowerCase())
            ) {
              programResults.push({
                id: `${college.name}-${index}`,
                title: program,
                subtitle: college.name,
                link: "/colleges-programs",
                type: "program",
              });
            }
          });
        });
      }
    } catch {}

    return programResults.slice(0, MAX_PER_GRP);
  };

  const doSearch = useCallback(
    async (term: string) => {
      const q = term.trim();

      if (!q) {
        emptyResults();
        setOpen(false);
        return;
      }

      const activeLangId = detectSearchLanguageId(q, fallbackLangId);
      const requestId = ++requestIdRef.current;

      setLoading(true);
      setOpen(true);

      try {
        const [newsRes, facultyList, collegesRes, programResults] =
          await Promise.all([
            newsService
              .getUniversityNews({
                languageId: activeLangId,
                pageIndex: 1,
                pageSize: MAX_PER_GRP,
                search: q,
              })
              .catch(() => null),

            fetchFacultySearch(q, activeLangId),

            newsService
              .getColleges(activeLangId)
              .catch(() => null),

            getProgramResults(q, activeLangId),
          ]);

        if (requestId !== requestIdRef.current) return;

        const collegesList = Array.isArray(collegesRes)
          ? collegesRes
          : Array.isArray(collegesRes?.result)
          ? collegesRes.result
          : cachedColleges;

        const collegeResults = collegesList
          .filter((college: any) =>
            String(college?.title || "")
              .toLowerCase()
              .includes(q.toLowerCase())
          )
          .slice(0, MAX_PER_GRP)
          .map((college: any) => ({
            id: college.id,
            title: college.title,
            link: college.url || "#",
            type: "college",
          }));

        setResults({
          news: (newsRes?.result || [])
            .slice(0, MAX_PER_GRP)
            .map((news: any) => ({
              id: news.id,
              title: news?.newsDetails?.head || "",
              subtitle: news?.newsDetails?.abbr?.slice(0, 55) || "",
              link: `/details/${news.id}`,
              type: "news",
              state: {
                news,
                newsType: "university",
                lid: activeLangId,
              },
            })),

          faculty: facultyList.slice(0, MAX_PER_GRP).map((news: any) => ({
  id: news.id,
  title: news.title || "",
  subtitle: news.source || "",
  link: `/fac/${news.facultyCode}/details/${news.id}`,
  type: "faculty",
  state: {
    news,
    newsType: "faculty",
    fac: Number(news.facultyCode),
    langId: activeLangId,
  },
})),

          college: collegeResults,
          program: programResults,
        });
      } catch {
        if (requestId === requestIdRef.current) {
          emptyResults();
        }
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [fallbackLangId, cachedColleges]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      emptyResults();
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(() => doSearch(query), DEBOUNCE);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  const handleSelect = (result: any) => {
    setOpen(false);
    setQuery("");

    if (result.link?.startsWith("http")) {
      window.open(result.link, "_blank", "noopener");
    } else if (result.link && result.link !== "#") {
      navigate(result.link, { state: result.state });
      window.scrollTo(0, 0);
    }
  };

  const handleClear = () => {
    setQuery("");
    emptyResults();
    setOpen(false);
    inputRef.current?.focus();
  };

  const GROUPS = [
    {
      key: "news",
      label: t("globalSearch.groups.news"),
      items: results.news,
    },
    {
      key: "faculty",
      label: t("globalSearch.groups.faculty"),
      items: results.faculty,
    },
    {
      key: "college",
      label: t("globalSearch.groups.college"),
      items: results.college,
    },
    {
      key: "program",
      label: t("globalSearch.groups.program"),
      items: results.program,
    },
  ].filter((group) => group.items.length > 0);

  const hasResults = GROUPS.length > 0;

  return (
    <div className="gs-section" dir={isRTL ? "rtl" : "ltr"}>
      <h1 className="search-title">{t("globalSearch.title")}</h1>

      <div className="gs-inner" ref={wrapperRef}>
        <div className={`gs-bar ${open ? "gs-bar--open" : ""}`}>
          <button
            className="gs-btn-search"
            type="button"
            aria-label={t("globalSearch.searchAria")}
          >
            <i className="fa-solid fa-magnifying-glass"></i>
          </button>

          <input
            ref={inputRef}
            type="text"
            className="gs-input"
            placeholder={t("globalSearch.placeholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (query.trim()) setOpen(true);
            }}
            autoComplete="off"
            spellCheck={false}
          />

          {query && (
            <button
              className="gs-btn-clear"
              type="button"
              onClick={handleClear}
              aria-label={t("globalSearch.clearAria")}
            >
              {X_ICON}
            </button>
          )}
        </div>

        {open && query.trim() && (
          <div className="gs-dropdown">
            {loading ? (
              <div className="gs-state">
                <span className="gs-spinner" />
                <span>{t("globalSearch.loading")}</span>
              </div>
            ) : !hasResults ? (
              <div className="gs-state gs-state--empty">
                <div className="gs-empty-icon">{SEARCH_ICON}</div>
                <p>{t("globalSearch.noResults")}</p>
                <span>"{query}"</span>
              </div>
            ) : (
              <>
                {GROUPS.map((group, groupIndex) => (
                  <div
                    key={group.key}
                    className={`gs-group ${
                      groupIndex > 0 ? "gs-group--divider" : ""
                    }`}
                  >
                    <div className="gs-group-head">
                      <span className="gs-group-icon">{ICONS[group.key]}</span>
                      <span className="gs-group-label">{group.label}</span>
                      <span className="gs-group-badge">{group.items.length}</span>
                    </div>

                    {group.items.map((item: any) => (
                      <button
                        key={`${item.type}-${item.id}`}
                        className="gs-item"
                        type="button"
                        onClick={() => handleSelect(item)}
                      >
                        <div className="gs-item-body">
                          <span className="gs-item-title">{item.title}</span>

                          {item.subtitle && (
                            <span className="gs-item-sub">{item.subtitle}</span>
                          )}
                        </div>

                        {item.link?.startsWith("http") && (
                          <span className="gs-item-ext" aria-hidden="true">
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default GlobalSearch;