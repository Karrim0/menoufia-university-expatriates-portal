import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import newsService from "../../Services/newsService";
import "./GlobalSearch.css";

const DEBOUNCE = 400;
const MAX_PER_GRP = 4;

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

  const savedLang = (() => {
    try {
      return JSON.parse(localStorage.getItem("lang") || "{}");
    } catch {
      return {};
    }
  })();

  const langId = savedLang?.id || 1;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState({
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

  useEffect(() => {
    newsService
      .getColleges(langId)
      .then((data: any) => {
        if (Array.isArray(data)) setCachedColleges(data);
      })
      .catch(() => {});
  }, [langId]);

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
  }, [location.pathname]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("keydown", handler);

    return () => document.removeEventListener("keydown", handler);
  }, []);

  const emptyResults = () => {
    setResults({
      news: [],
      faculty: [],
      college: [],
      program: [],
    });
  };

  const doSearch = useCallback(
    async (term: string) => {
      const q = term.trim();

      if (!q) {
        emptyResults();
        setOpen(false);
        return;
      }

      setLoading(true);
      setOpen(true);

      try {
        const [newsRes, facultyRes] = await Promise.all([
          newsService
            .getUniversityNews({
              languageId: langId,
              pageIndex: 1,
              pageSize: MAX_PER_GRP,
              search: q,
            })
            .catch(() => null),

          newsService
            .getFacultyNews({
              langId,
              pageIndex: 1,
              pageSize: MAX_PER_GRP,
              search: q,
            })
            .catch(() => null),
        ]);

        const collegeResults = cachedColleges
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

        const programResults: any[] = [];

        try {
          const langCode = String(savedLang?.code || "ar").toUpperCase();
          const json = await import(`../../Local/${langCode}/Programs.json`);
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

        setResults({
          news: (newsRes?.result || []).slice(0, MAX_PER_GRP).map((news: any) => ({
            id: news.id,
            title: news?.newsDetails?.head || "",
            subtitle: news?.newsDetails?.abbr?.slice(0, 55) || "",
            link: `/details/${news.id}`,
            type: "news",
            state: {
              news,
              newsType: "university",
              lid: langId,
            },
          })),

          faculty: (facultyRes?.result || []).slice(0, MAX_PER_GRP).map((news: any) => ({
            id: news.id,
            title: news.title || "",
            subtitle: news.source || "",
            link: `/faculty-news/${news.id}`,
            type: "faculty",
            state: {
              news,
            },
          })),

          college: collegeResults,
          program: programResults.slice(0, MAX_PER_GRP),
        });
      } catch {
        emptyResults();
      } finally {
        setLoading(false);
      }
    },
    [langId, cachedColleges, savedLang?.code]
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
    } else {
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