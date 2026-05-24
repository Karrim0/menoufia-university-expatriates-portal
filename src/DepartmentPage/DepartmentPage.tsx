import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Link,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { Calendar, ChevronDown, ChevronLeft, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import newsService from "../Services/newsService";
import { SmartImage } from "../utils/imageHelper";
import ErrorPage from "../ErrorPage/ErrorPage";
import "../NewsPage/News.css";
import "../NewsPage/News.filter.css";
import "./DepartmentPage.css";

import logo from "../../src/assets/logo.jpg";
import logo2 from "../../src/assets/MNF_logo.png";
import headerBg from "../../src/assets/01.jpg";

const ITEMS_PER_PAGE = 10;
const DEBOUNCE_DELAY = 500;

type MenuItem = {
  menuId: number;
  parentId: number | null;
  sortOrder: number;
  title: string;
  articleId: number | null;
  url: string;
  children: MenuItem[];
};

type NewsItem = {
  id: number;
  title: string;
  body?: string;
  date: string;
  currentDate?: string;
  image: string;
  source: string;
  imageAlt: string;
};

type HighlightItem = {
  id: number;
  startDate: string;
  endDate: string;
  image: string;
  translationData: string;
};

type ArticlePage = {
  articleId: number;
  menuItemId: number;
  title: string;
  content: string;
  imageDescription?: string | null;
};

const THEME_PRESETS = [
  {
    primary: "#840D0D",
    primaryRgb: "132, 13, 13",
    dark: "#262626",
    darkRgb: "38, 38, 38",
    secondary: "#EAEAEA",
    soft: "#F8F0E5",
    card: "#FFFFFF",
    muted: "#EAEAEA",
    button: "#840D0D",
    buttonHover: "#262626",
    headerOverlay: "#262626D9",
    footer: "#262626",
    footerRgb: "38, 38, 38",
    footerBottom: "#262626F2",
    iconBackground: "#840D0D",
    iconColor: "#FFFFFF",
    iconBackgroundHover: "#262626",
    iconHover: "#FFFFFF",
    primaryText: "#262626",
    secondaryText: "#6B6B6B",
    paginationBg: "#EAEAEA",
    paginationText: "#262626",
    paginationBorder: "#262626",
    paginationActiveBg: "#840D0D",
    paginationActiveText: "#FFFFFF",
    paginationArrowBg: "#262626",
    paginationArrowColor: "#FFFFFF",
    paginationDisabledBg: "#FFFFFF",
    paginationDisabledColor: "#C3C3C3",
    paginationInfoStrong: "#840D0D",
  },
  {
    primary: "#27374D",
    primaryRgb: "39, 55, 77",
    dark: "#27374D",
    darkRgb: "39, 55, 77",
    secondary: "#526D82",
    soft: "#DDE6ED",
    card: "#FFFFFF",
    muted: "#9DB2BF",
    button: "#27374D",
    buttonHover: "#9DB2BF",
    headerOverlay: "#27374DE5",
    footer: "#27374D",
    footerRgb: "39, 55, 77",
    footerBottom: "#27374DF2",
    iconBackground: "#27374D",
    iconColor: "#526D82",
    iconBackgroundHover: "#526D82",
    iconHover: "#526D82",
    primaryText: "#1A1A1A",
    secondaryText: "#526D82",
    paginationBg: "#F8FAFC",
    paginationText: "#27374D",
    paginationBorder: "#27374D",
    paginationActiveBg: "#27374D",
    paginationActiveText: "#FFFFFF",
    paginationArrowBg: "#FFFFFF",
    paginationArrowColor: "#27374D",
    paginationDisabledBg: "#FFFFFF",
    paginationDisabledColor: "#C3C3C3",
    paginationInfoStrong: "#27374D",
  },
  {
    primary: "#102C57",
    primaryRgb: "16, 44, 87",
    dark: "#102C57",
    darkRgb: "16, 44, 87",
    secondary: "#DAC0A3",
    soft: "#F8F9FA",
    card: "#FFFFFF",
    muted: "#DAC0A3",
    button: "#102C57",
    buttonHover: "#DAC0A3",
    headerOverlay: "#102C57E5",
    footer: "#102C57",
    footerRgb: "16, 44, 87",
    footerBottom: "#102C57F2",
    iconBackground: "#102C57",
    iconColor: "#FFFFFF",
    iconBackgroundHover: "#DAC0A3",
    iconHover: "#FFFFFF",
    primaryText: "#1A1A1A",
    secondaryText: "#6B7280",
    paginationBg: "#102C57",
    paginationText: "#FFFFFF",
    paginationBorder: "#DAC0A3",
    paginationActiveBg: "#DAC0A3",
    paginationActiveText: "#FFFFFF",
    paginationArrowBg: "#FFFFFF",
    paginationArrowColor: "#102C57",
    paginationDisabledBg: "#FFFFFF",
    paginationDisabledColor: "#C3C3C3",
    paginationInfoStrong: "#DAC0A3",
  },
];

const DEPARTMENT_NAV_LIMIT = 7;

const DATE_FILTERS = [
  { value: 0, labelAr: "كل الأخبار", labelEn: "All News" },
  { value: 2, labelAr: "اليوم", labelEn: "Today" },
  { value: 3, labelAr: "آخر أسبوع", labelEn: "Last Week" },
  { value: 4, labelAr: "آخر شهر", labelEn: "Last Month" },
];

const getSavedLang = () => {
  try {
    return JSON.parse(localStorage.getItem("lang") || "{}");
  } catch {
    return {};
  }
};

const getSavedLangId = () => Number(getSavedLang()?.id) || 1;

const cleanTitle = (value?: string) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim();

const isExternalUrl = (url?: string) =>
  typeof url === "string" && /^https?:\/\//i.test(url);

const getChildren = (item?: MenuItem) =>
  Array.isArray(item?.children)
    ? item.children
        .filter((child) => child && typeof child === "object")
        .filter((child) => cleanTitle(child.title).length > 0)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    : [];

const chunkItems = (items: MenuItem[], chunksCount: number) => {
  const chunks: MenuItem[][] = Array.from({ length: chunksCount }, () => []);

  items.forEach((item, index) => {
    chunks[index % chunksCount].push(item);
  });

  return chunks;
};

const getDepartmentMenuLink = ({
  item,
  fac,
  departmentCode,
}: {
  item: MenuItem;
  fac?: string;
  departmentCode?: string;
}) => {
  if (isExternalUrl(item.url)) return item.url;

  const params = new URLSearchParams();

  if (item.articleId !== null && item.articleId !== undefined) {
    params.set("articleId", String(item.articleId));
  }

  const query = params.toString();

  return `/fac/${fac}/department/${departmentCode}${query ? `?${query}` : ""}`;
};

const extractFirstUrl = (html = "") => {
  const hrefMatch = html.match(/href=["']([^"']+)["']/i);
  const srcMatch = html.match(/src=["']([^"']+)["']/i);

  return hrefMatch?.[1] || srcMatch?.[1] || "";
};

const getFileExtension = (url = "") => {
  const clean = url.split("?")[0].toLowerCase();
  const match = clean.match(/\.([a-z0-9]+)$/);

  return match?.[1] || "";
};

const stripHtml = (html = "") =>
  html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getGoogleViewerUrl = (url: string) =>
  `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;

const DepartmentMenuItem: React.FC<{
  item: MenuItem;
  fac?: string;
  departmentCode?: string;
  facultyTitle?: string;
  departmentTitle?: string;
  themeColor?: string;
  level?: number;
}> = ({
  item,
  fac,
  departmentCode,
  facultyTitle,
  departmentTitle,
  level = 0,
  themeColor,
}) => {
  const [open, setOpen] = useState(false);

  const children = getChildren(item);
  const hasChildren = children.length > 0;

  const link = getDepartmentMenuLink({
    item,
    fac,
    departmentCode,
  });

  const external = isExternalUrl(link);

  const handleToggle = (e: React.MouseEvent) => {
    if (!hasChildren) return;

    e.preventDefault();
    e.stopPropagation();
    setOpen((prev) => !prev);
  };

  const content = (
    <>
      <span>{cleanTitle(item.title)}</span>

      {hasChildren &&
        (level === 0 ? (
          <ChevronDown
            size={12}
            className={`department-menu-arrow ${open ? "open" : ""}`}
          />
        ) : (
          <ChevronLeft
            size={12}
            className={`department-menu-arrow ${open ? "open" : ""}`}
          />
        ))}
    </>
  );

  return (
    <div
      className={`department-menu-item level-${level} ${
        hasChildren ? "has-children" : ""
      } ${open ? "open" : ""}`}
      onMouseEnter={() => hasChildren && setOpen(true)}
      onMouseLeave={() => hasChildren && setOpen(false)}
    >
      {hasChildren ? (
        <button
          type="button"
          className="department-menu-link"
          onClick={handleToggle}
        >
          {content}
        </button>
      ) : external ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="department-menu-link"
        >
          {content}
        </a>
      ) : (
        <Link
          to={link}
          state={{
            facultyTitle,
            departmentTitle,
            themeColor,
          }}
          className="department-menu-link"
        >
          {content}
        </Link>
      )}

      {hasChildren && open && (
        <div className="department-sub-menu">
          {children.map((child) => (
            <DepartmentMenuItem
              key={child.menuId}
              item={child}
              fac={fac}
              departmentCode={departmentCode}
              facultyTitle={facultyTitle}
              departmentTitle={departmentTitle}
              themeColor={themeColor}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ArticleTitle: React.FC<{ title: string }> = ({ title }) => {
  return (
    <div className="department-section-heading">
      <span className="department-section-dot" />
      <h2>{title}</h2>
    </div>
  );
};

const ArticleRenderer: React.FC<{
  article: ArticlePage;
  isArabic: boolean;
}> = ({ article, isArabic }) => {
  const content = article.content || "";
  const firstUrl = extractFirstUrl(content);
  const fileExtension = getFileExtension(firstUrl);
  const isFile = ["pdf", "doc", "docx", "xls", "xlsx"].includes(fileExtension);
  const isVideo = ["mp4", "webm", "ogg"].includes(fileExtension);
  const hasImage = /<img/i.test(content);
  const plainText = stripHtml(content);
  const isImageOnly = hasImage && plainText.length < 80;

  if (isFile && firstUrl) {
    const viewerUrl =
      fileExtension === "pdf" ? firstUrl : getGoogleViewerUrl(firstUrl);

    return (
      <section
        className="department-article-section"
        dir={isArabic ? "rtl" : "ltr"}
      >
        <ArticleTitle title={article.title} />

        <div className="department-file-card">
          <div className="department-file-icon">
            <i className="fa-regular fa-file-lines" />
          </div>

          <div className="department-file-content">
            <h3>{article.title}</h3>

            <p>
              {isArabic ? "نوع الملف : " : "File type: "}
              <strong>{fileExtension.toUpperCase()}</strong>
            </p>

            <div className="department-file-actions">
              <a
                href={viewerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="file-view-btn"
              >
                <i className="fa-regular fa-eye" />
                {isArabic ? "عرض الملف" : "View file"}
              </a>

              <a href={firstUrl} download className="file-download-btn">
                <i className="fa-solid fa-download" />
                {isArabic ? "تحميل الملف" : "Download"}
              </a>
            </div>
          </div>
        </div>

        <div className="department-file-note">
          <i className="fa-solid fa-circle-info" />
          {isArabic
            ? "لعرض محتوى الملف يرجى الضغط على زر عرض الملف."
            : "To view the file content, click View file."}
        </div>
      </section>
    );
  }

  if (isVideo && firstUrl) {
    return (
      <section
        className="department-article-section"
        dir={isArabic ? "rtl" : "ltr"}
      >
        <ArticleTitle title={article.title} />

        <div className="department-article-card">
          <div className="department-card-heading">
            <div className="department-document-icon">
              <i className="fa-regular fa-file-lines" />
            </div>

            <h3>{article.title}</h3>
          </div>

          <video className="department-video" controls src={firstUrl} />
        </div>
      </section>
    );
  }

  if (isImageOnly) {
    return (
      <section
        className="department-article-section"
        dir={isArabic ? "rtl" : "ltr"}
      >
        <ArticleTitle title={article.title} />

        <div
          className="department-article-card department-image-article"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </section>
    );
  }

  return (
    <section
      className="department-article-section"
      dir={isArabic ? "rtl" : "ltr"}
    >
      <ArticleTitle title={article.title} />

      <div className="department-article-card">
        <div className="department-card-heading">
          <div className="department-document-icon">
            <i className="fa-regular fa-file-lines" />
          </div>

          <h3>{article.title}</h3>
        </div>

        <div
          className="department-article-html"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </section>
  );
};

const DepartmentPage: React.FC = () => {
  const { fac, departmentCode } = useParams<{
    fac: string;
    departmentCode: string;
  }>();

  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { i18n } = useTranslation();

  const savedLang = getSavedLang();
  const isArabic = savedLang?.code === "ar" || i18n.language === "ar";
  const isRTL = isArabic;

  const articleId = searchParams.get("articleId");
  const langId = getSavedLangId();

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstSearchRender = useRef(true);

  const facultyName = useMemo(() => {
    const stateFacultyTitle = location.state?.facultyTitle;

    if (stateFacultyTitle) {
      return stateFacultyTitle;
    }

    return "";
  }, [location.state]);

  const [departmentMenu, setDepartmentMenu] = useState<MenuItem[]>([]);
  const [departmentMenuLoading, setDepartmentMenuLoading] = useState(false);

  const [article, setArticle] = useState<ArticlePage | null>(null);
  const [articleLoading, setArticleLoading] = useState(false);

  const [notFound, setNotFound] = useState(false);
  const [articleNotFound, setArticleNotFound] = useState(false);

  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [highlights, setHighlights] = useState<HighlightItem[]>([]);
  const [highlightsLoading, setHighlightsLoading] = useState(false);
  const [activeHighlightIndex, setActiveHighlightIndex] = useState(0);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [pageIndex, setPageIndex] = useState(1);
  const [moveNext, setMoveNext] = useState(false);
  const [movePrevious, setMovePrevious] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  const [dateFilter, setDateFilter] = useState(0);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  const departmentName = useMemo(() => {
    const stateDepartmentTitle = location.state?.departmentTitle;

    if (stateDepartmentTitle) {
      return stateDepartmentTitle;
    }

    return departmentCode || "";
  }, [location.state, departmentCode]);

  const visibleDepartmentMenu = useMemo(() => {
    return departmentMenu
      .filter((item) => cleanTitle(item.title).length > 0)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }, [departmentMenu]);

  const selectedThemeColor =
    location.state?.themeColor ||
    sessionStorage.getItem(`faculty-theme-${fac}`) ||
    "#102C57";

  const activeTheme =
    THEME_PRESETS.find((theme) => theme.primary === selectedThemeColor) ||
    THEME_PRESETS[2];

  const pageThemeStyle = {
    "--department-primary": activeTheme.primary,
    "--department-primary-rgb": activeTheme.primaryRgb,
    "--department-dark": activeTheme.dark,
    "--department-dark-rgb": activeTheme.darkRgb,
    "--department-secondary": activeTheme.secondary,
    "--department-soft-bg": activeTheme.soft,
    "--department-card-bg": activeTheme.card,
    "--department-muted-bg": activeTheme.muted,
    "--department-button": activeTheme.button,
    "--department-button-hover": activeTheme.buttonHover,
    "--department-search-bg": activeTheme.secondary,
    "--department-header-overlay": activeTheme.headerOverlay,

    "--department-footer": activeTheme.footer,
    "--department-footer-top": activeTheme.footer,
    "--department-footer-rgb": activeTheme.footerRgb,
    "--department-footer-bottom": activeTheme.footerBottom,

    "--department-icon-bg": activeTheme.iconBackground,
    "--department-icon-color": activeTheme.iconColor,
    "--department-icon-bg-hover": activeTheme.iconBackgroundHover,
    "--department-icon-hover": activeTheme.iconHover,
    "--department-primary-text": activeTheme.primaryText,
    "--department-secondary-text": activeTheme.secondaryText,

    "--department-pagination-bg": activeTheme.paginationBg,
    "--department-pagination-text": activeTheme.paginationText,
    "--department-pagination-border": activeTheme.paginationBorder,
    "--department-pagination-active-bg": activeTheme.paginationActiveBg,
    "--department-pagination-active-text": activeTheme.paginationActiveText,
    "--department-pagination-arrow-bg": activeTheme.paginationArrowBg,
    "--department-pagination-arrow-color": activeTheme.paginationArrowColor,
    "--department-pagination-disabled-bg": activeTheme.paginationDisabledBg,
    "--department-pagination-disabled-color":
      activeTheme.paginationDisabledColor,
    "--department-pagination-info-strong": activeTheme.paginationInfoStrong,
  } as React.CSSProperties;

  const departmentTopMenu = useMemo(() => {
    return visibleDepartmentMenu.slice(0, DEPARTMENT_NAV_LIMIT);
  }, [visibleDepartmentMenu]);

  const departmentFooterItems = useMemo(() => {
    const restTopItems = visibleDepartmentMenu.slice(DEPARTMENT_NAV_LIMIT);
    const childrenFromTopItems = visibleDepartmentMenu.flatMap((item) =>
      getChildren(item),
    );

    const allFooterItems = [...restTopItems, ...childrenFromTopItems]
      .filter((item) => cleanTitle(item.title).length > 0)
      .filter(
        (item, index, array) =>
          array.findIndex((current) => current.menuId === item.menuId) ===
          index,
      );

    return chunkItems(allFooterItems, 3);
  }, [visibleDepartmentMenu]);

  useEffect(() => {
    let count = 0;

    if (dateFilter !== 0) count++;
    if (fromDate) count++;
    if (toDate) count++;

    setActiveFiltersCount(count);
  }, [dateFilter, fromDate, toDate]);

  useEffect(() => {
    let isMounted = true;

    const fetchDepartmentMenu = async () => {
      const facultyCode = Number(fac);

      if (!fac || !departmentCode || !facultyCode) {
        setDepartmentMenu([]);
        setNotFound(true);
        setDepartmentMenuLoading(false);
        return;
      }

      setDepartmentMenuLoading(true);
      setNotFound(false);

      try {
        const response = await newsService.getDepartmentMenu({
          facultyCode,
          departmentCode,
          lang: langId,
        });

        if (!isMounted) return;

        const result = Array.isArray(response?.result) ? response.result : [];

        setDepartmentMenu(result);

        if (result.length === 0) {
          setNotFound(true);
        } else {
          setNotFound(false);
        }
      } catch (error: any) {
        console.error("Failed to fetch department menu:", error);

        if (isMounted) {
          setDepartmentMenu([]);
          setNotFound(true);
        }
      } finally {
        if (isMounted) {
          setDepartmentMenuLoading(false);
        }
      }
    };

    fetchDepartmentMenu();

    return () => {
      isMounted = false;
    };
  }, [fac, departmentCode, langId]);

  useEffect(() => {
    let isMounted = true;

    const fetchArticle = async () => {
      if (!articleId) {
        setArticle(null);
        setArticleNotFound(false);
        return;
      }

      const numericArticleId = Number(articleId);

      if (!numericArticleId) {
        setArticle(null);
        setArticleNotFound(true);
        setArticleLoading(false);
        return;
      }

      setArticleLoading(true);
      setArticleNotFound(false);

      try {
        const response = await newsService.getSectorPage({
          articleId: numericArticleId,
          lang: langId,
        });

        if (!isMounted) return;

        if (response?.result) {
          setArticle(response.result);
          setArticleNotFound(false);
        } else {
          setArticle(null);
          setArticleNotFound(true);
        }
      } catch (error: any) {
        console.error("Failed to fetch department article:", error);

        if (isMounted) {
          setArticle(null);
          setArticleNotFound(true);
        }
      } finally {
        if (isMounted) {
          setArticleLoading(false);
        }
      }
    };

    fetchArticle();

    return () => {
      isMounted = false;
    };
  }, [articleId, langId]);

  const fetchHighlights = useCallback(async () => {
    if (!fac || notFound) return;

    setHighlightsLoading(true);

    try {
      const data = await newsService.getHighlights({
        fac: Number(fac),
        langId,
        pageIndex: 1,
        pageSize: 10,
        search: "",
      });

      const result: HighlightItem[] = Array.isArray(data?.result)
        ? data.result
        : [];

      setHighlights(result);
      setActiveHighlightIndex(0);
    } catch (error) {
      console.error("Failed to fetch department highlights:", error);
      setHighlights([]);
    } finally {
      setHighlightsLoading(false);
    }
  }, [fac, langId, notFound]);

  const fetchNews = useCallback(async () => {
    if (!fac || !departmentCode || notFound) return;

    setLoading(true);

    try {
      const data = await newsService.getFacultyNews({
        fac: Number(fac),
        langId,
        departmentCode,
        pageIndex,
        pageSize: ITEMS_PER_PAGE,
        search,
        ...(dateFilter !== 0 ? { dateFilter } : {}),
        ...(fromDate ? { fromDate } : {}),
        ...(toDate ? { toDate } : {}),
      });

      const result: NewsItem[] = Array.isArray(data?.result) ? data.result : [];

      setNews(result);
      setMoveNext(Boolean(data?.moveNext));
      setMovePrevious(Boolean(data?.movePrevious));
    } catch (error) {
      console.error("Failed to fetch department news:", error);
      setNews([]);
      setMoveNext(false);
      setMovePrevious(false);
    } finally {
      setLoading(false);
    }
  }, [
    fac,
    departmentCode,
    langId,
    pageIndex,
    search,
    dateFilter,
    fromDate,
    toDate,
    notFound,
  ]);

  useEffect(() => {
    fetchHighlights();
  }, [fetchHighlights]);

  useEffect(() => {
    if (!articleId) {
      fetchNews();
    }
  }, [fetchNews, articleId]);

  useEffect(() => {
    if (highlights.length <= 1) return;

    const timer = setInterval(() => {
      setActiveHighlightIndex((prev) =>
        prev === highlights.length - 1 ? 0 : prev + 1,
      );
    }, 5000);

    return () => clearInterval(timer);
  }, [highlights.length]);

  useEffect(() => {
    if (isFirstSearchRender.current) {
      isFirstSearchRender.current = false;
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setPageIndex(1);
      setSearch(searchInput.trim());
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchInput]);

  const handleManualSearch = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setPageIndex(1);
    setSearch(searchInput.trim());
  };

  const handleClearSearch = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setSearchInput("");
    setSearch("");
    setPageIndex(1);
  };

  const handleApplyDateFilter = (value: number) => {
    setDateFilter((prev) => (prev === value ? 0 : value));

    if (value !== 0) {
      setFromDate("");
      setToDate("");
    }

    setPageIndex(1);
  };

  const handleFromDate = (value: string) => {
    setFromDate(value);

    if (value) {
      setDateFilter(0);
    }

    setPageIndex(1);
  };

  const handleToDate = (value: string) => {
    setToDate(value);

    if (value) {
      setDateFilter(0);
    }

    setPageIndex(1);
  };

  const handleClearAllFilters = () => {
    setDateFilter(0);
    setFromDate("");
    setToDate("");
    setPageIndex(1);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";

    return new Date(dateStr).toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const activeHighlight = highlights[activeHighlightIndex];

  if (notFound || articleNotFound) {
    return <ErrorPage />;
  }

  return (
    <div className="department-page-wrapper" style={pageThemeStyle}>
      <header
        className="department-top-header"
        style={{ backgroundImage: `url(${headerBg})` }}
        dir="rtl"
      >
        <div className="department-top-header-overlay" />

        <div className="department-top-header-inner">
          <button
            type="button"
            className="department-back-btn"
            onClick={() => window.history.back()}
          >
            <i className="fa-solid fa-chevron-right" />
            <span>
              {isArabic ? "الرجوع الى موقع الجامعة" : "Back to University"}
            </span>
          </button>

          <div className="department-top-brand">
            <div className="department-top-brand-text">
              <h2>{facultyName}</h2>
              <p>{departmentName || departmentCode}</p>
            </div>

            <div className="department-top-logo-wrap">
              <img src={logo} alt="university logo" />
            </div>
          </div>
        </div>
      </header>

      <section className="department-menu-section" dir={isRTL ? "rtl" : "ltr"}>
        <div className="department-menu-wrapper">
          {departmentMenuLoading ? (
            <div className="department-menu-loading">
              {isArabic ? "جاري تحميل القائمة..." : "Loading menu..."}
            </div>
          ) : departmentTopMenu.length > 0 ? (
            <div className="department-menu-bar">
              {departmentTopMenu.map((item) => (
                <DepartmentMenuItem
                  key={item.menuId}
                  item={item}
                  fac={fac}
                  departmentCode={departmentCode}
                  facultyTitle={facultyName}
                  departmentTitle={departmentName}
                  themeColor={selectedThemeColor}
                />
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {articleId ? (
        <main className="department-article-main">
          {articleLoading ? (
            <div className="department-article-loading">
              {isArabic ? "جاري تحميل الصفحة..." : "Loading page..."}
            </div>
          ) : article ? (
            <ArticleRenderer article={article} isArabic={isArabic} />
          ) : (
            <div className="department-empty-state">
              {isArabic ? "لا يوجد محتوى متاح" : "No content available"}
            </div>
          )}
        </main>
      ) : (
        <>
          <section className="department-news-hero">
            <div className="department-news-hero-content">
              {highlightsLoading ? (
                <div className="department-highlight-slider skeleton-highlight" />
              ) : activeHighlight ? (
                <div className="department-highlight-slider">
                  <div className="department-highlight-image-wrap">
                    <Link
                      to={`/fac/${fac}/details/${activeHighlight.id}`}
                      state={{
                        news: activeHighlight,
                        newsType: "faculty",
                        fac: Number(fac),
                        departmentCode,
                        langId,
                      }}
                      className="department-highlight-link"
                    >
                      <SmartImage
                        src={activeHighlight.image}
                        alt={activeHighlight.translationData || departmentName}
                        className="department-highlight-image"
                      />

                      <div className="department-highlight-overlay" />

                      <div className="department-highlight-content">
                        <h2>{activeHighlight.translationData}</h2>
                        <span className="department-highlight-arrow">
                          <i className="fa-solid fa-arrow-up" />
                        </span>
                      </div>
                    </Link>

                    {highlights.length > 1 && (
                      <div className="department-highlight-dots">
                        {highlights.map((item, index) => (
                          <button
                            key={item.id || index}
                            type="button"
                            className={`department-highlight-dot ${
                              index === activeHighlightIndex ? "active" : ""
                            }`}
                            onClick={() => setActiveHighlightIndex(index)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              <div className="news-search-wrapper department-search-wrapper">
                <div className="news-search-bar">
                  <button
                    type="button"
                    className="news-search-icon-btn"
                    onClick={handleManualSearch}
                  >
                    <i className="fa-solid fa-magnifying-glass" />
                  </button>

                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
                    placeholder={
                      isArabic
                        ? "ابحث في أخبار القسم..."
                        : "Search department news..."
                    }
                  />

                  {searchInput && (
                    <button
                      type="button"
                      className="news-clear-btn"
                      onClick={handleClearSearch}
                    >
                      <X size={18} />
                    </button>
                  )}

                  <button
                    type="button"
                    className={`news-filter-toggle ${
                      showFilters ? "active" : ""
                    } ${activeFiltersCount > 0 ? "has-filters" : ""}`}
                    onClick={() => setShowFilters((prev) => !prev)}
                  >
                    <i className="fa-solid fa-sliders" />

                    {activeFiltersCount > 0 && (
                      <span className="filter-badge">{activeFiltersCount}</span>
                    )}
                  </button>
                </div>

                <div
                  className={`news-filterr-panel ${showFilters ? "open" : ""}`}
                >
                  <div
                    className="filter-panel-inner"
                    dir={isArabic ? "rtl" : "ltr"}
                  >
                    <div className="filter-panell-body">
                      <div
                        className="filter-section filterr-dates"
                        style={{ width: "100%" }}
                      >
                        <span className="filterr-labell">
                          <Calendar size={13} />
                          {isArabic ? "نطاق مخصص" : "Custom Range"}
                        </span>

                        <div className="filter-date-inputs">
                          <div className="date-input-wrap">
                            <label>{isArabic ? "من" : "From"}</label>

                            <input
                              type="date"
                              value={fromDate}
                              onChange={(e) => handleFromDate(e.target.value)}
                              max={toDate || undefined}
                            />
                          </div>

                          <span className="date-separator">—</span>

                          <div className="date-input-wrap">
                            <label>{isArabic ? "إلى" : "To"}</label>

                            <input
                              type="date"
                              value={toDate}
                              onChange={(e) => handleToDate(e.target.value)}
                              min={fromDate || undefined}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="filter-section" style={{ width: "100%" }}>
                        <span className="filter-labell">
                          <Calendar size={13} />
                          {isArabic ? "فلتر سريع" : "Quick Filter"}
                        </span>

                        <div className="filter-chips">
                          {DATE_FILTERS.map((filter) => (
                            <button
                              key={filter.value}
                              type="button"
                              className={`filter-chip ${
                                (filter.value === 0 &&
                                  dateFilter === 0 &&
                                  !fromDate &&
                                  !toDate) ||
                                (filter.value !== 0 &&
                                  dateFilter === filter.value)
                                  ? "chip-active"
                                  : ""
                              }`}
                              onClick={() =>
                                handleApplyDateFilter(filter.value)
                              }
                            >
                              {isArabic ? filter.labelAr : filter.labelEn}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {activeFiltersCount > 0 && (
                      <div className="filter-panel-footer">
                        <button
                          type="button"
                          className="filter-clear-all"
                          onClick={handleClearAllFilters}
                        >
                          <X size={12} />
                          {isArabic ? "مسح الفلاتر" : "Clear Filters"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            className="department-news-content"
            dir={isRTL ? "rtl" : "ltr"}
          >
            <div className="department-content-wrapper">
              <div className="department-section-heading">
                <span className="department-section-dot" />
                <h2>{isArabic ? "أخبار القسم" : "Department News"}</h2>
              </div>

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
                      ? "لا توجد أخبار لهذا القسم"
                      : "No department news found"}
                  </h2>
                </div>
              ) : (
                <div className="news-cards-grid">
                  {news.map((item) => (
                    <article key={item.id} className="news-card">
                      <Link
                        to={`/fac/${fac}/details/${item.id}`}
                        state={{
                          news: item,
                          newsType: "faculty",
                          fac: Number(fac),
                          departmentCode,
                          langId,
                        }}
                        className="news-card-link"
                      >
                        <div className="news-card-text">
                          <h3 className="news-card-title">
                            {item.title?.slice(0, 95)}
                          </h3>

                          <p className="news-card-description">
                            {(item.source || item.body || "").slice(0, 120)}
                          </p>

                          <span className="news-card-date">
                            {formatDate(item.currentDate || item.date)}
                          </span>
                        </div>

                        <div className="news-card-image">
                          <SmartImage
                            src={item.image}
                            alt={
                              item.imageAlt || item.title || "Department news"
                            }
                          />
                        </div>

                        <div className="news-card-arrow">
                          <i className="fa-solid fa-arrow-up" />
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
                    onClick={() => setPageIndex((prev) => prev - 1)}
                    disabled={!movePrevious || loading}
                  >
                    <i className="fa-solid fa-chevron-left" />
                  </button>

                  <div className="news-pagination-number active">
                    {pageIndex}
                  </div>

                  <button
                    className="news-pagination-arrow"
                    onClick={() => setPageIndex((prev) => prev + 1)}
                    disabled={!moveNext || loading}
                  >
                    <i className="fa-solid fa-chevron-right" />
                  </button>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {departmentFooterItems.some((group) => group.length > 0) && (
        <footer className="department-links-footer" dir={isRTL ? "rtl" : "ltr"}>
          <div className="department-links-footer-inner">
            {departmentFooterItems.map((group, index) => {
              if (group.length === 0) return null;

              const titles = isArabic
                ? ["روابط القسم", "خدمات القسم", "محتوى إضافي"]
                : ["Department Links", "Department Services", "More Content"];

              return (
                <div
                  className="department-footer-column"
                  key={`department-footer-${index}`}
                >
                  <h3>
                    <span>{titles[index]}</span>
                  </h3>

                  <div className="department-footer-links">
                    {group.slice(0, 5).map((item) => {
                      const link = getDepartmentMenuLink({
                        item,
                        fac,
                        departmentCode,
                      });

                      const external = isExternalUrl(link);

                      const content = (
                        <>
                          <span>{cleanTitle(item.title)}</span>
                          <i
                            className="fa-solid fa-arrow-up"
                            aria-hidden="true"
                          />
                        </>
                      );

                      return external ? (
                        <a
                          key={item.menuId}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="department-footer-link"
                        >
                          {content}
                        </a>
                      ) : (
                        <Link
                          key={item.menuId}
                          to={link}
                          state={{
                            facultyTitle: facultyName,
                            departmentTitle: departmentName,
                            themeColor: selectedThemeColor,
                          }}
                          className="department-footer-link"
                        >
                          {content}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="department-footer-bottom">
            <div className="department-footer-contact">
              <div className="department-footer-bottom-title">
                <span>{isArabic ? "تواصل معنا :" : "Contact us:"}</span>

                <span className="department-footer-bottom-icon">
                  <i className="fa-solid fa-phone"></i>
                </span>
              </div>

              <div className="department-footer-phones">
                <span>048-2235690</span>
                <span className="department-phone-separator">/</span>
                <span>048-2222753</span>
              </div>

              <div className="department-footer-social">
                <a href="#" aria-label="facebook">
                  <i className="fa-brands fa-facebook-f"></i>
                </a>

                <a href="#" aria-label="youtube">
                  <i className="fa-brands fa-youtube"></i>
                </a>

                <a href="#" aria-label="twitter">
                  <i className="fa-brands fa-twitter"></i>
                </a>
              </div>
            </div>

            <div className="department-footer-brand">
              <img src={logo2} alt="Menoufia University" />
            </div>

            <div className="department-footer-address">
              <div className="department-footer-bottom-title">
                <span>{isArabic ? "عنوان الكلية :" : "Faculty address:"}</span>

                <span className="department-footer-bottom-icon">
                  <i className="fa-solid fa-location-dot"></i>
                </span>
              </div>

              <p>
                {isArabic
                  ? "شبين الكوم _ المنوفية _ مصر"
                  : "Shebin El-Kom _ Menoufia _ Egypt"}
              </p>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default DepartmentPage;
