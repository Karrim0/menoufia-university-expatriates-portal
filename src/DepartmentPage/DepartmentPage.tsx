import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import newsService from "../Services/newsService";
import { SmartImage } from "../utils/imageHelper";
import ErrorPage from "../ErrorPage/ErrorPage";
import "../NewsPage/News.css";
import "../NewsPage/News.filter.css";
import "./DepartmentPage.css";
import FacultyFooter from "../Shared/FacultyFooter/FacultyFooter";
import logo from "../../src/assets/logo.jpg";
import logo2 from "../../src/assets/MNF_logo.png";
import headerBg from "../../src/assets/01.jpg";

const ITEMS_PER_PAGE = 10;
const DEBOUNCE_DELAY = 500;

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
} as const;

type LanguageCode = keyof typeof LANGUAGE_IDS;

const RTL_LANGUAGE_CODES = new Set<LanguageCode>(["ar", "fa"]);

const DATE_FILTERS = [
  { value: 0, key: "allNews", fallback: "All News" },
  { value: 2, key: "today", fallback: "Today" },
  { value: 3, key: "lastWeek", fallback: "Last Week" },
  { value: 4, key: "lastMonth", fallback: "Last Month" },
];

const FOOTER_GROUP_TITLES = [
  "مواقع هامة",
  "مواقع مهمة",
  "روابط هامة",
  "روابط مهمة",
  "خدمات أكاديمية",
  "خدمات اكاديمية",
  "خدمات إلكترونية",
  "خدمات الكترونية",
  "important links",
  "useful links",
  "academic services",
  "electronic services",
  "e-services",
];


type MenuItem = {
  id?: number;
  menuId: number;
  parentId: number | null;
  sortOrder: number;
  order?: number;
  title: string;
  articleId: number | null;
  url: string;
  children: MenuItem[];
  subMenus?: MenuItem[];
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

type CollegeLogoItem = {
  id: number;
  title: string;
  logoUrl: string;
};

type ArticlePage = {
  articleId: number;
  menuItemId: number;
  title: string;
  content: string;
  imageDescription?: string | null;
};

type SavedLang = {
  id?: number;
  code?: string;
  name?: string;
  flag?: string;
};

type FooterMenuGroup = {
  menuId: number | string;
  title: string;
  children: MenuItem[];
};

type TranslationFn = (key: string, options?: Record<string, unknown>) => string;

const getDepartmentTopMenuLimit = () => {
  if (typeof window === "undefined") return 8;

  const width = window.innerWidth;

  if (width >= 1500) return 9;
  if (width >= 1280) return 8;
  if (width >= 1100) return 7;
  if (width >= 900) return 6;
  if (width >= 640) return 5;
  if (width >= 480) return 4;

  return 3;
};

const getSavedLang = (): SavedLang => {
  try {
    return JSON.parse(localStorage.getItem("lang") || "{}");
  } catch {
    return {};
  }
};

const normalizeLanguageCode = (code?: string): LanguageCode | "" => {
  const normalizedCode = String(code || "")
    .trim()
    .toLowerCase()
    .split("-")[0];

  return normalizedCode in LANGUAGE_IDS ? (normalizedCode as LanguageCode) : "";
};

const getCurrentLanguageCode = (i18nLanguage?: string): LanguageCode => {
  const i18nCode = normalizeLanguageCode(i18nLanguage);

  if (i18nCode) return i18nCode;

  const savedLang = getSavedLang();
  const savedCode = normalizeLanguageCode(savedLang?.code);

  if (savedCode) return savedCode;

  const savedId = Number(savedLang?.id);
  const matchedCodeById = Object.entries(LANGUAGE_IDS).find(([, id]) => id === savedId)?.[0] as LanguageCode | undefined;

  return matchedCodeById || "ar";
};

const getLanguageIdByCode = (code: LanguageCode) => LANGUAGE_IDS[code] || 1;

const getLocaleByLangCode = (code: LanguageCode) => {
  const locales: Record<LanguageCode, string> = {
    ar: "ar-EG",
    en: "en-US",
    fr: "fr-FR",
    ja: "ja-JP",
    de: "de-DE",
    tr: "tr-TR",
    fa: "fa-IR",
    ru: "ru-RU",
    ch: "en-US",
    it: "it-IT",
  };

  return locales[code] || "en-US";
};

const normalizeApiResponse = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.result)) return data.data.result;
  return [];
};

const cleanTitle = (value?: string) =>
  String(value || "")
    .replace(/\s+/g, " ")
    .trim();

const normalizeText = (value?: string) =>
  String(value || "")
    .trim()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[ًٌٍَُِّْ]/g, "")
    .replace(/[ـ]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();

const getMenuChildren = (item?: MenuItem) => {
  const children = Array.isArray(item?.children)
    ? item?.children
    : Array.isArray(item?.subMenus)
      ? item?.subMenus
      : [];

  return children
    .filter((child) => child && typeof child === "object")
    .filter((child) => cleanTitle(child.title).length > 0)
    .map(normalizeMenuItem)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
};

const normalizeMenuItem = (item: any): MenuItem => ({
  ...item,
  menuId: Number(item?.menuId ?? item?.id) || 0,
  parentId: item?.parentId ?? null,
  sortOrder: Number(item?.sortOrder ?? item?.order) || 0,
  articleId: item?.articleId ?? null,
  url: String(item?.url || ""),
  title: cleanTitle(item?.title),
  children: Array.isArray(item?.children)
    ? item.children
        .filter((child: any) => child && typeof child === "object")
        .filter((child: any) => cleanTitle(child.title).length > 0)
        .map(normalizeMenuItem)
        .sort((a: MenuItem, b: MenuItem) => (a.sortOrder || 0) - (b.sortOrder || 0))
    : Array.isArray(item?.subMenus)
      ? item.subMenus
          .filter((child: any) => child && typeof child === "object")
          .filter((child: any) => cleanTitle(child.title).length > 0)
          .map(normalizeMenuItem)
          .sort((a: MenuItem, b: MenuItem) => (a.sortOrder || 0) - (b.sortOrder || 0))
      : [],
});

const sanitizeDepartmentMenuItems = (items: MenuItem[] = []) => {
  return items
    .filter((item) => item && typeof item === "object")
    .filter((item) => cleanTitle(item.title).length > 0)
    .map(normalizeMenuItem)
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
};

const isValidLogoUrl = (url?: string) => {
  const value = String(url || "").trim();

  return value.length > 0 && value !== "YOUR_LOGO_URL_HERE" && /^https?:\/\//i.test(value);
};

const getCollegeFacFromApi = (college: any): number | null => {
  const possibleCodes = [
    college?.fac,
    college?.Fac,
    college?.publicCode,
    college?.PublicCode,
    college?.facCode,
    college?.FacCode,
    college?.facultyCode,
    college?.FacultyCode,
    college?.code,
    college?.Code,
  ];

  for (const possibleCode of possibleCodes) {
    const numericCode = Number(possibleCode);

    if (Number.isFinite(numericCode) && numericCode > 0) {
      return numericCode;
    }
  }

  return null;
};

const findCollegeByFacultyCode = (colleges: any[], facultyCode: number) => {
  return colleges.find((college) => getCollegeFacFromApi(college) === facultyCode);
};

const getCollegeLogoByName = (collegeTitle: string, logos: CollegeLogoItem[]) => {
  const normalizedTitle = normalizeText(collegeTitle);

  const matchedLogo = logos.find((item) => normalizeText(item.title) === normalizedTitle);

  return isValidLogoUrl(matchedLogo?.logoUrl) ? matchedLogo?.logoUrl || "" : "";
};

const getCollegeLogoForCollege = (college: any, logos: CollegeLogoItem[], fallbackTitle = "") => {
  const possibleIds = [college?.id, college?.menuId, college?.collegeId, college?.CollegeId];

  for (const possibleId of possibleIds) {
    const numericId = Number(possibleId);

    if (!Number.isFinite(numericId) || numericId <= 0) continue;

    const matchedLogoById = logos.find((item) => Number(item.id) === numericId && isValidLogoUrl(item.logoUrl));

    if (matchedLogoById?.logoUrl) return matchedLogoById.logoUrl;
  }

  const titleLogo = getCollegeLogoByName(college?.title || fallbackTitle, logos);

  if (titleLogo) return titleLogo;

  return getCollegeLogoByName(fallbackTitle, logos);
};

const isExternalUrl = (url?: string) => typeof url === "string" && /^https?:\/\//i.test(url);

const normalizeMenuUrl = (url?: string) => {
  const value = String(url || "").trim();

  if (!value || value === "#") return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `https://www.menofia.edu.eg${value}`;

  return value;
};

const extractArticleIdFromUrl = (url?: string): number | null => {
  const value = String(url || "").trim();

  if (!value || value === "#") return null;

  const viewMatch = value.match(/\/view\/(\d+)(?:\/|$|\?)/i);

  if (viewMatch?.[1]) {
    const articleId = Number(viewMatch[1]);
    return Number.isFinite(articleId) && articleId > 0 ? articleId : null;
  }

  const queryMatch = value.match(/[?&](?:articleId|id)=(\d+)/i);

  if (queryMatch?.[1]) {
    const articleId = Number(queryMatch[1]);
    return Number.isFinite(articleId) && articleId > 0 ? articleId : null;
  }

  return null;
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
  const responseArticleId =
    item.articleId !== null && item.articleId !== undefined && String(item.articleId).trim() !== ""
      ? Number(item.articleId)
      : null;

  const extractedArticleId = extractArticleIdFromUrl(item.url);
  const finalArticleId = responseArticleId || extractedArticleId;

  if (finalArticleId && fac && departmentCode) {
    return `/fac/${fac}/department/${departmentCode}?articleId=${finalArticleId}`;
  }

  const menuUrl = normalizeMenuUrl(item.url);

  if (menuUrl) return menuUrl;

  return `/fac/${fac}/department/${departmentCode}`;
};

const buildFooterMenuGroups = (items: MenuItem[]): FooterMenuGroup[] => {
  const cleanItems = sanitizeDepartmentMenuItems(items);
  const footerTitles = FOOTER_GROUP_TITLES.map(normalizeText);

  return cleanItems
    .filter((item) => footerTitles.includes(normalizeText(item.title)))
    .slice(0, 3)
    .map((item) => ({
      menuId: item.menuId,
      title: cleanTitle(item.title),
      children: getMenuChildren(item),
    }))
    .filter((group) => group.children.length > 0);
};

const chunkMenuItemsBySize = <T,>(items: T[], size: number) => {
  const safeSize = Math.max(1, size || 1);
  const rows: T[][] = [];

  for (let index = 0; index < items.length; index += safeSize) {
    rows.push(items.slice(index, index + safeSize));
  }

  return rows;
};

const useDepartmentMenuRows = (items: MenuItem[]) => {
  const [itemsPerRow, setItemsPerRow] = useState<number>(() => getDepartmentTopMenuLimit());
  const [activeRowIndex, setActiveRowIndex] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setItemsPerRow(getDepartmentTopMenuLimit());
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const rows = useMemo(() => chunkMenuItemsBySize(items, itemsPerRow), [items, itemsPerRow]);

  useEffect(() => {
    setActiveRowIndex(0);
  }, [items.length, itemsPerRow]);

  useEffect(() => {
    setActiveRowIndex((current) => Math.min(current, Math.max(rows.length - 1, 0)));
  }, [rows.length]);

  const safeActiveRowIndex = Math.min(activeRowIndex, Math.max(rows.length - 1, 0));

  const goNext = useCallback(() => {
    setActiveRowIndex((current) => Math.min(current + 1, Math.max(rows.length - 1, 0)));
  }, [rows.length]);

  const goPrevious = useCallback(() => {
    setActiveRowIndex((current) => Math.max(current - 1, 0));
  }, []);

  return {
    itemsPerRow,
    rows,
    activeRowIndex: safeActiveRowIndex,
    currentRow: rows[safeActiveRowIndex] || [],
    canGoNext: safeActiveRowIndex < rows.length - 1,
    canGoPrevious: safeActiveRowIndex > 0,
    goNext,
    goPrevious,
  };
};

const normalizeContentUrl = (url = "") => {
  const value = String(url || "").trim();

  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `https://www.menofia.edu.eg${value}`;
  if (/^(PrtlFiles|uploads)\//i.test(value)) return `https://www.menofia.edu.eg/${value}`;

  return value;
};

const extractFirstUrl = (html = "") => {
  const hrefMatch = html.match(/href=["']([^"']+)["']/i);
  const srcMatch = html.match(/src=["']([^"']+)["']/i);

  return normalizeContentUrl(hrefMatch?.[1] || srcMatch?.[1] || "");
};

const getFileExtension = (url = "") => {
  const clean = String(url || "").split("?")[0].split("#")[0].toLowerCase();
  const match = clean.match(/\.([a-z0-9]+)$/);

  return match?.[1] || "";
};

const stripHtml = (html = "") =>
  String(html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const getGoogleViewerUrl = (url: string) => `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`;

const DepartmentMenuItem: React.FC<{
  item: MenuItem;
  fac?: string;
  departmentCode?: string;
  facultyTitle?: string;
  departmentTitle?: string;
  level?: number;
}> = ({ item, fac, departmentCode, facultyTitle, departmentTitle, level = 0 }) => {
  const [open, setOpen] = useState(false);
  const [dropDirection, setDropDirection] = useState<"default" | "flip">("default");

  const itemRef = useRef<HTMLDivElement | null>(null);
  const subMenuRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const children = getMenuChildren(item);
  const hasChildren = children.length > 0;
  const link = getDepartmentMenuLink({ item, fac, departmentCode });
  const external = isExternalUrl(link);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const updateDropDirection = useCallback(() => {
    if (!hasChildren || !itemRef.current || typeof window === "undefined") return;

    const rect = itemRef.current.getBoundingClientRect();
    const safeGap = 14;
    const viewportWidth = window.innerWidth;
    const menuWidth = subMenuRef.current?.offsetWidth || (level === 0 ? 300 : 260);

    if (level === 0) {
      const defaultLeftEdge = rect.right - menuWidth;
      const flipRightEdge = rect.left + menuWidth;

      if (defaultLeftEdge < safeGap && flipRightEdge <= viewportWidth - safeGap) {
        setDropDirection("flip");
      } else {
        setDropDirection("default");
      }

      return;
    }

    const leftSpace = rect.left - safeGap;
    const rightSpace = viewportWidth - rect.right - safeGap;

    setDropDirection(leftSpace < menuWidth && rightSpace > leftSpace ? "flip" : "default");
  }, [hasChildren, level]);

  const handleMouseEnter = () => {
    if (!hasChildren) return;

    clearCloseTimer();
    updateDropDirection();
    setOpen(true);

    requestAnimationFrame(updateDropDirection);
  };

  const handleMouseLeave = () => {
    if (!hasChildren) return;

    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setOpen(false), 260);
  };

  const handleToggle = (e: React.MouseEvent) => {
    if (!hasChildren) return;

    e.preventDefault();
    e.stopPropagation();
    clearCloseTimer();

    setOpen((prev) => {
      const next = !prev;

      if (next) {
        updateDropDirection();
        requestAnimationFrame(updateDropDirection);
      }

      return next;
    });
  };

  useEffect(() => {
    if (!open || !hasChildren || typeof window === "undefined") return;

    updateDropDirection();
    window.addEventListener("resize", updateDropDirection);
    window.addEventListener("scroll", updateDropDirection, true);

    return () => {
      window.removeEventListener("resize", updateDropDirection);
      window.removeEventListener("scroll", updateDropDirection, true);
    };
  }, [open, hasChildren, updateDropDirection]);

  useEffect(() => () => clearCloseTimer(), []);

  const NestedArrow = dropDirection === "flip" ? ChevronRight : ChevronLeft;

  const content = (
    <>
      <span>{cleanTitle(item.title)}</span>
      {hasChildren &&
        (level === 0 ? (
          <ChevronDown size={12} className={`department-menu-arrow ${open ? "open" : ""}`} />
        ) : (
          <NestedArrow size={12} className="department-menu-arrow" />
        ))}
    </>
  );

  return (
    <div
      ref={itemRef}
      className={`department-menu-item level-${level} ${hasChildren ? "has-children" : ""} ${open ? "open" : ""} drop-${dropDirection}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {hasChildren ? (
        <button type="button" className="department-menu-link" onClick={handleToggle}>
          {content}
        </button>
      ) : external ? (
        <a href={link} target="_blank" rel="noopener noreferrer" className="department-menu-link">
          {content}
        </a>
      ) : (
        <Link
          to={link}
          state={{ facultyTitle, departmentTitle }}
          className="department-menu-link"
        >
          {content}
        </Link>
      )}

      {hasChildren && open && (
        <div ref={subMenuRef} className="department-sub-menu">
          {children.map((child) => (
            <DepartmentMenuItem
              key={child.menuId}
              item={child}
              fac={fac}
              departmentCode={departmentCode}
              facultyTitle={facultyTitle}
              departmentTitle={departmentTitle}
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
  isRTL: boolean;
  t: TranslationFn;
}> = ({ article, isRTL, t }) => {
  const content = article.content || "";
  const firstUrl = extractFirstUrl(content);
  const fileExtension = getFileExtension(firstUrl);
  const isFile = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(fileExtension);
  const isVideo = ["mp4", "webm", "ogg", "mov"].includes(fileExtension);
  const hasImage = /<img/i.test(content);
  const plainText = stripHtml(content);
  const isImageOnly = hasImage && plainText.length < 80;

  if (isFile && firstUrl) {
    const viewerUrl = fileExtension === "pdf" ? firstUrl : getGoogleViewerUrl(firstUrl);

    return (
      <section className="department-article-section" dir={isRTL ? "rtl" : "ltr"}>
        <ArticleTitle title={article.title} />

        <div className="department-file-card">
          <div className="department-file-icon">
            <i className="fa-regular fa-file-lines" />
          </div>

          <div className="department-file-content">
            <h3>{article.title}</h3>

            <p>
              {t("fileType", { defaultValue: "File type:" })} <strong>{fileExtension.toUpperCase()}</strong>
            </p>

            <div className="department-file-actions">
              <a href={viewerUrl} target="_blank" rel="noopener noreferrer" className="file-view-btn">
                <i className="fa-regular fa-eye" />
                {t("viewFile", { defaultValue: "View file" })}
              </a>

              <a href={firstUrl} download className="file-download-btn">
                <i className="fa-solid fa-download" />
                {t("downloadFile", { defaultValue: "Download file" })}
              </a>
            </div>
          </div>
        </div>

        <div className="department-file-note">
          <i className="fa-solid fa-circle-info" />
          {t("fileNote", { defaultValue: "To view the file content, click View file." })}
        </div>
      </section>
    );
  }

  if (isVideo && firstUrl) {
    return (
      <section className="department-article-section" dir={isRTL ? "rtl" : "ltr"}>
        <ArticleTitle title={article.title} />

        <div className="department-article-card">
          <div className="department-card-heading">
            <div className="department-document-icon">
              <i className="fa-regular fa-file-lines" />
            </div>
            <h3>{article.title}</h3>
          </div>

          <video className="department-video" controls src={firstUrl}>
            {t("videoNotSupported", { defaultValue: "Your browser does not support video playback." })}
          </video>
        </div>
      </section>
    );
  }

  if (isImageOnly) {
    return (
      <section className="department-article-section" dir={isRTL ? "rtl" : "ltr"}>
        <ArticleTitle title={article.title} />

        <div className="department-article-card department-image-article" dangerouslySetInnerHTML={{ __html: content }} />
      </section>
    );
  }

  return (
    <section className="department-article-section" dir={isRTL ? "rtl" : "ltr"}>
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
          dangerouslySetInnerHTML={{
            __html: content || `<p>${t("noContent", { defaultValue: "No content available" })}</p>`,
          }}
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
  const { t, i18n } = useTranslation("DepartmentPage");

  const currentLangCode = useMemo(() => getCurrentLanguageCode(i18n.language), [i18n.language]);
  const langId = useMemo(() => getLanguageIdByCode(currentLangCode), [currentLangCode]);
  const currentLocale = useMemo(() => getLocaleByLangCode(currentLangCode), [currentLangCode]);
  const isRTL = RTL_LANGUAGE_CODES.has(currentLangCode);

  const articleIdParam = searchParams.get("articleId");
  const invalidArticleId = Boolean(articleIdParam && !/^\d+$/.test(articleIdParam));
  const articleId = articleIdParam && /^\d+$/.test(articleIdParam) ? Number(articleIdParam) : null;

  const isRouteShapeValid = Boolean(fac && /^\d+$/.test(String(fac)) && departmentCode);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstSearchRender = useRef(true);

  const [collegeName, setCollegeName] = useState<string>(String(location.state?.facultyTitle || location.state?.collegeName || ""));
  const [collegeData, setCollegeData] = useState<any | null>(null);
  const [collegeLogoUrl, setCollegeLogoUrl] = useState("");
  const [collegeLogos, setCollegeLogos] = useState<CollegeLogoItem[]>([]);

  const [departmentMenu, setDepartmentMenu] = useState<MenuItem[]>([]);
  const [departmentMenuLoading, setDepartmentMenuLoading] = useState(false);

  const [article, setArticle] = useState<ArticlePage | null>(null);
  const [articleLoading, setArticleLoading] = useState(false);
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

    if (stateDepartmentTitle) return String(stateDepartmentTitle);

    const matchingMenuTitle = departmentMenu.find((item) => normalizeText(item.url).includes(normalizeText(String(departmentCode || ""))))?.title;

    return matchingMenuTitle || departmentCode || "";
  }, [location.state, departmentCode, departmentMenu]);

  const visibleDepartmentMenu = useMemo(() => sanitizeDepartmentMenuItems(departmentMenu), [departmentMenu]);

  const {
    currentRow: visibleDepartmentMenuRow,
    canGoNext: canGoNextDepartmentMenuRow,
    canGoPrevious: canGoPreviousDepartmentMenuRow,
    goNext: handleNextDepartmentMenuRow,
    goPrevious: handlePreviousDepartmentMenuRow,
    
  } = useDepartmentMenuRows(visibleDepartmentMenu);

  const footerMenuGroups = useMemo(() => buildFooterMenuGroups(visibleDepartmentMenu), [visibleDepartmentMenu]);

  useEffect(() => {
    let count = 0;

    if (dateFilter !== 0) count++;
    if (fromDate) count++;
    if (toDate) count++;

    setActiveFiltersCount(count);
  }, [dateFilter, fromDate, toDate]);

  useEffect(() => {
    let isMounted = true;

    const fetchCollegeData = async () => {
      const facultyCode = Number(fac);

      setPageIndex(1);
      setSearch("");
      setSearchInput("");
      setDateFilter(0);
      setFromDate("");
      setToDate("");
      setActiveHighlightIndex(0);
      setArticleNotFound(false);

      if (!facultyCode || !isRouteShapeValid) {
        setCollegeName("");
        setCollegeData(null);
        setLoading(false);
        setHighlightsLoading(false);
        setDepartmentMenuLoading(false);
        return;
      }

      try {
        const response = await newsService.getColleges(langId);
        const colleges = normalizeApiResponse(response);
        let matchedCollege = findCollegeByFacultyCode(colleges, facultyCode);

        if (!matchedCollege && langId !== 1) {
          const fallbackResponse = await newsService.getColleges(1);
          const fallbackColleges = normalizeApiResponse(fallbackResponse);
          matchedCollege = findCollegeByFacultyCode(fallbackColleges, facultyCode);
        }

        if (!isMounted) return;

        setCollegeData(matchedCollege || null);
        setCollegeName(matchedCollege?.title || String(location.state?.facultyTitle || location.state?.collegeName || ""));
      } catch (error) {
        console.error("Failed to fetch department college data:", error);

        if (isMounted) {
          setCollegeData(null);
          setCollegeName(String(location.state?.facultyTitle || location.state?.collegeName || ""));
        }
      }
    };

    fetchCollegeData();

    return () => {
      isMounted = false;
    };
  }, [fac, isRouteShapeValid, langId, location.state]);

  useEffect(() => {
    let isMounted = true;

    const fetchCollegeLogos = async () => {
      const logoLangIds = Array.from(new Set([langId, 1]));

      try {
        const responses = await Promise.allSettled(
          logoLangIds.map((logoLangId) =>
            newsService.getCollegesLogos({
              langId: logoLangId,
              pageIndex: 1,
              pageSize: 500,
            }),
          ),
        );

        if (!isMounted) return;

        const logos = responses.flatMap((response) => {
          if (response.status !== "fulfilled") return [];
          return Array.isArray(response.value?.result) ? response.value.result : [];
        });

        const uniqueLogos = Array.from(
          new Map(
            logos
              .filter((item) => item && isValidLogoUrl(item.logoUrl))
              .map((item) => [String(item.id || item.title), item]),
          ).values(),
        );

        setCollegeLogos(uniqueLogos);
      } catch (error) {
        console.error("Failed to fetch department college logos:", error);

        if (isMounted) setCollegeLogos([]);
      }
    };

    fetchCollegeLogos();

    return () => {
      isMounted = false;
    };
  }, [langId]);

  useEffect(() => {
    if ((!collegeData && !collegeName) || collegeLogos.length === 0) {
      setCollegeLogoUrl("");
      return;
    }

    const matchedLogoUrl = getCollegeLogoForCollege(collegeData, collegeLogos, collegeName);
    setCollegeLogoUrl(matchedLogoUrl || "");
  }, [collegeData, collegeName, collegeLogos]);

  useEffect(() => {
    let isMounted = true;

    const fetchDepartmentMenu = async () => {
      const facultyCode = Number(fac);

      if (!facultyCode || !departmentCode || !isRouteShapeValid) {
        setDepartmentMenu([]);
        setDepartmentMenuLoading(false);
        return;
      }

      setDepartmentMenuLoading(true);

      try {
        const response = await newsService.getDepartmentMenu({
          facultyCode,
          departmentCode,
          lang: langId,
        });

        let result = normalizeApiResponse(response);

        if (result.length === 0 && langId !== 1) {
          const fallbackResponse = await newsService.getDepartmentMenu({
            facultyCode,
            departmentCode,
            lang: 1,
          });

          result = normalizeApiResponse(fallbackResponse);
        }

        if (!isMounted) return;

        setDepartmentMenu(sanitizeDepartmentMenuItems(result as MenuItem[]));
      } catch (error) {
        console.error("Failed to fetch department menu:", error);

        if (isMounted) setDepartmentMenu([]);
      } finally {
        if (isMounted) setDepartmentMenuLoading(false);
      }
    };

    fetchDepartmentMenu();

    return () => {
      isMounted = false;
    };
  }, [fac, departmentCode, isRouteShapeValid, langId]);

  useEffect(() => {
    let isMounted = true;

    const fetchArticle = async () => {
      if (invalidArticleId) {
        setArticle(null);
        setArticleNotFound(true);
        setArticleLoading(false);
        return;
      }

      if (!articleId) {
        setArticle(null);
        setArticleNotFound(false);
        setArticleLoading(false);
        return;
      }

      setArticleLoading(true);
      setArticleNotFound(false);

      try {
        const response = await newsService.getSectorPage({
          articleId,
          lang: langId,
        });

        if (!isMounted) return;

        if (response?.result) {
          setArticle(response.result);
        } else {
          setArticle(null);
        }
      } catch (error) {
        console.error("Failed to fetch department article:", error);

        if (isMounted) setArticle(null);
      } finally {
        if (isMounted) setArticleLoading(false);
      }
    };

    fetchArticle();

    return () => {
      isMounted = false;
    };
  }, [articleId, invalidArticleId, langId]);

  const fetchHighlights = useCallback(async () => {
    if (!fac || !departmentCode || !isRouteShapeValid) {
      setHighlights([]);
      setActiveHighlightIndex(0);
      setHighlightsLoading(false);
      return;
    }

    setHighlightsLoading(true);

    try {
      const data = await newsService.getHighlights({
        fac: Number(fac),
        langId,
        departmentCode,
        pageIndex: 1,
        pageSize: 10,
        search: "",
      });

      const result: HighlightItem[] = Array.isArray(data?.result) ? data.result : [];

      setHighlights(result);
      setActiveHighlightIndex(0);
    } catch (error) {
      console.error("Failed to fetch department highlights:", error);
      setHighlights([]);
      setActiveHighlightIndex(0);
    } finally {
      setHighlightsLoading(false);
    }
  }, [fac, departmentCode, langId, isRouteShapeValid]);

  const fetchNews = useCallback(async () => {
    if (!fac || !departmentCode || !isRouteShapeValid) {
      setLoading(false);
      setNews([]);
      return;
    }

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
  }, [fac, departmentCode, isRouteShapeValid, langId, pageIndex, search, dateFilter, fromDate, toDate]);

  useEffect(() => {
    fetchHighlights();
  }, [fetchHighlights]);

  useEffect(() => {
    if (!articleId) fetchNews();
  }, [fetchNews, articleId]);

  useEffect(() => {
    if (highlights.length <= 1) return;

    const timer = setInterval(() => {
      setActiveHighlightIndex((prev) => (prev === highlights.length - 1 ? 0 : prev + 1));
    }, 5000);

    return () => clearInterval(timer);
  }, [highlights.length]);

  useEffect(() => {
    if (isFirstSearchRender.current) {
      isFirstSearchRender.current = false;
      return;
    }

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(() => {
      setPageIndex(1);
      setSearch(searchInput.trim());
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchInput]);

  const handleManualSearch = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    setPageIndex(1);
    setSearch(searchInput.trim());
  };

  const handleClearSearch = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

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

    if (value) setDateFilter(0);

    setPageIndex(1);
  };

  const handleToDate = (value: string) => {
    setToDate(value);

    if (value) setDateFilter(0);

    setPageIndex(1);
  };

  const handleClearAllFilters = () => {
    setDateFilter(0);
    setFromDate("");
    setToDate("");
    setPageIndex(1);
  };

  const handleNextHighlight = () => {
    if (highlights.length <= 1) return;

    setActiveHighlightIndex((prev) => (prev === highlights.length - 1 ? 0 : prev + 1));
  };

  const handlePrevHighlight = () => {
    if (highlights.length <= 1) return;

    setActiveHighlightIndex((prev) => (prev === 0 ? highlights.length - 1 : prev - 1));
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";

    return new Date(dateStr).toLocaleDateString(currentLocale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const activeHighlight = highlights[activeHighlightIndex];

  if (!isRouteShapeValid || articleNotFound) {
    return <ErrorPage />;
  }

  return (
    <div className="department-page-wrapper">
      <header className="department-top-header" style={{ backgroundImage: `url(${headerBg})` }} dir="rtl">
        <div className="department-top-header-overlay" />

        <div className="department-top-header-inner">
          <button type="button" className="department-back-btn" onClick={() => window.location.assign("/")}>
            <i className="fa-solid fa-chevron-right" />
            <span>{t("backToUniversity", { defaultValue: "Back to University" })}</span>
          </button>

          <Link
            to={`/fac/${fac}`}
            state={{ facultyTitle: collegeName, langId }}
            className="department-top-brand"
            aria-label={t("backToFacultyPage", { defaultValue: "Back to faculty page" })}
          >
            <div className="department-top-brand-text">
              <h2>{collegeName || t("faculty", { defaultValue: "Faculty" })}</h2>
              <p>{departmentName || departmentCode}</p>
            </div>

            <div className="department-top-logo-wrap">
              <img
                src={collegeLogoUrl || logo}
                alt={collegeName || t("facultyLogo", { defaultValue: "Faculty logo" })}
                onError={(e) => {
                  e.currentTarget.src = logo;
                }}
              />
            </div>
          </Link>
        </div>
      </header>

      <section className="department-menu-section" dir={isRTL ? "rtl" : "ltr"}>
        <div className="department-menu-wrapper">
          {departmentMenuLoading ? (
            <div className="department-menu-loading">{t("loadingMenu", { defaultValue: "Loading menu..." })}</div>
          ) : visibleDepartmentMenu.length > 0 ? (
            <div className="department-menu-shell">
              <button
                type="button"
                className="department-menu-page-btn"
                onClick={handlePreviousDepartmentMenuRow}
                disabled={!canGoPreviousDepartmentMenuRow}
                aria-label={t("previousMenuRow", { defaultValue: "Previous menu row" })}
              >
                {isRTL ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
              </button>

              <div
  className="department-menu-bar"
  style={
    {
      "--department-nav-count": Math.max(visibleDepartmentMenuRow.length, 1),
    } as React.CSSProperties
  }
>
                {visibleDepartmentMenuRow.map((item) => (
                  <DepartmentMenuItem
                    key={item.menuId}
                    item={item}
                    fac={fac}
                    departmentCode={departmentCode}
                    facultyTitle={collegeName}
                    departmentTitle={departmentName}
                  />
                ))}
              </div>

              <button
                type="button"
                className="department-menu-page-btn"
                onClick={handleNextDepartmentMenuRow}
                disabled={!canGoNextDepartmentMenuRow}
                aria-label={t("nextMenuRow", { defaultValue: "Next menu row" })}
              >
                {isRTL ? <ChevronLeft size={17} /> : <ChevronRight size={17} />}
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {articleId ? (
        <main className="department-article-main">
          {articleLoading ? (
            <div className="department-article-loading">{t("loadingPage", { defaultValue: "Loading page..." })}</div>
          ) : article ? (
            <ArticleRenderer article={article} isRTL={isRTL} t={t} />
          ) : (
            <div className="department-empty-state">{t("noContent", { defaultValue: "No content available" })}</div>
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
                      to={`/fac/${fac}/department/${departmentCode}/highlight/${activeHighlight.id}?lang=${langId}`}
                      state={{
                        highlight: activeHighlight,
                        newsType: "department",
                        fac: Number(fac),
                        departmentCode,
                        langId,
                        collegeName,
                        departmentName,
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
                          <i className="fa-solid fa-arrow-up department-highlight-arrow-icon" />
                        </span>
                      </div>
                    </Link>

                    {highlights.length > 1 && (
                      <>
                        <button
                          type="button"
                          className="department-slider-control department-slider-control-right"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleNextHighlight();
                          }}
                          aria-label={t("nextHighlight", { defaultValue: "Next highlight" })}
                        >
                          <i className="fa-solid fa-chevron-right" aria-hidden="true" />
                        </button>

                        <button
                          type="button"
                          className="department-slider-control department-slider-control-left"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handlePrevHighlight();
                          }}
                          aria-label={t("previousHighlight", { defaultValue: "Previous highlight" })}
                        >
                          <i className="fa-solid fa-chevron-left" aria-hidden="true" />
                        </button>

                        <div className="department-highlight-dots">
                          {highlights.map((item, index) => (
                            <button
                              key={item.id || index}
                              type="button"
                              className={`department-highlight-dot ${index === activeHighlightIndex ? "active" : ""}`}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setActiveHighlightIndex(index);
                              }}
                              aria-label={t("goToHighlight", {
                                defaultValue: "Go to highlight {{number}}",
                                number: index + 1,
                              })}
                            />
                          ))}
                        </div>
                      </>
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
                    aria-label={t("search", { defaultValue: "Search" })}
                  >
                    <i className="fa-solid fa-magnifying-glass" />
                  </button>

                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
                    placeholder={t("searchDepartmentNews", { defaultValue: "Search department news..." })}
                  />

                  {searchInput && (
                    <button
                      type="button"
                      className="news-clear-btn"
                      onClick={handleClearSearch}
                      aria-label={t("clearSearch", { defaultValue: "Clear search" })}
                    >
                      <X size={18} />
                    </button>
                  )}

                  <button
                    type="button"
                    className={`news-filter-toggle ${showFilters ? "active" : ""} ${activeFiltersCount > 0 ? "has-filters" : ""}`}
                    onClick={() => setShowFilters((prev) => !prev)}
                    aria-label={t("toggleFilters", { defaultValue: "Toggle filters" })}
                  >
                    <i className="fa-solid fa-sliders" />

                    {activeFiltersCount > 0 && <span className="filter-badge">{activeFiltersCount}</span>}
                  </button>
                </div>

                <div className={`news-filterr-panel ${showFilters ? "open" : ""}`}>
                  <div className="filter-panel-inner" dir={isRTL ? "rtl" : "ltr"}>
                    <div className="filter-panell-body">
                      <div className="filter-section filterr-dates" style={{ width: "100%" }}>
                        <span className="filterr-labell">
                          <Calendar size={13} />
                          {t("customRange", { defaultValue: "Custom Range" })}
                        </span>

                        <div className="filter-date-inputs">
                          <div className="date-input-wrap">
                            <label>{t("from", { defaultValue: "From" })}</label>
                            <input type="date" value={fromDate} onChange={(e) => handleFromDate(e.target.value)} max={toDate || undefined} />
                          </div>

                          <span className="date-separator">—</span>

                          <div className="date-input-wrap">
                            <label>{t("to", { defaultValue: "To" })}</label>
                            <input type="date" value={toDate} onChange={(e) => handleToDate(e.target.value)} min={fromDate || undefined} />
                          </div>
                        </div>
                      </div>

                      <div className="filter-section" style={{ width: "100%" }}>
                        <span className="filter-labell">
                          <Calendar size={13} />
                          {t("quickFilter", { defaultValue: "Quick Filter" })}
                        </span>

                        <div className="filter-chips">
                          {DATE_FILTERS.map((filter) => (
                            <button
                              key={filter.value}
                              type="button"
                              className={`filter-chip ${
                                (filter.value === 0 && dateFilter === 0 && !fromDate && !toDate) ||
                                (filter.value !== 0 && dateFilter === filter.value)
                                  ? "chip-active"
                                  : ""
                              }`}
                              onClick={() => handleApplyDateFilter(filter.value)}
                            >
                              {t(filter.key, { defaultValue: filter.fallback })}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {activeFiltersCount > 0 && (
                      <div className="filter-panel-footer">
                        <button type="button" className="filter-clear-all" onClick={handleClearAllFilters}>
                          <X size={12} />
                          {t("clearFilters", { defaultValue: "Clear Filters" })}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="department-news-content" dir={isRTL ? "rtl" : "ltr"}>
            <div className="department-content-wrapper">
              <div className="department-section-heading">
                <span className="department-section-dot" />
                <h2>{t("departmentNews", { defaultValue: "Department News" })}</h2>
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
                  <h2>{t("noDepartmentNews", { defaultValue: "No department news found" })}</h2>
                </div>
              ) : (
                <div className="news-cards-grid">
                  {news.map((item) => (
                    <article key={item.id} className="news-card">
                      <Link
                        to={`/fac/${fac}/department/${departmentCode}/details/${item.id}?lang=${langId}`}
                        state={{
                          news: item,
                          newsType: "department",
                          fac: Number(fac),
                          departmentCode,
                          langId,
                        }}
                        className="news-card-link"
                      >
                        <div className="news-card-text">
                          <h3 className="news-card-title">{item.title?.slice(0, 95)}</h3>
                          <p className="news-card-description">{(item.source || item.body || "").slice(0, 120)}</p>
                          <span className="news-card-date">{formatDate(item.currentDate || item.date)}</span>
                        </div>

                        <div className="news-card-image">
                          <SmartImage src={item.image} alt={item.imageAlt || item.title || t("departmentNewsAlt", { defaultValue: "Department news" })} />
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
                    onClick={() => setPageIndex((prev) => Math.max(prev - 1, 1))}
                    disabled={!movePrevious || loading}
                    aria-label={t("previousPage", { defaultValue: "Previous page" })}
                  >
                    <i className="fa-solid fa-chevron-left" />
                  </button>

                  <div className="news-pagination-number active">{pageIndex}</div>

                  <button
                    className="news-pagination-arrow"
                    onClick={() => setPageIndex((prev) => prev + 1)}
                    disabled={!moveNext || loading}
                    aria-label={t("nextPage", { defaultValue: "Next page" })}
                  >
                    <i className="fa-solid fa-chevron-right" />
                  </button>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      <FacultyFooter
  footerMenuGroups={footerMenuGroups}
  isRTL={isRTL}
  logo2={logo2}
  getItemLink={(item) =>
    getDepartmentMenuLink({
      item: item as MenuItem,
      fac,
      departmentCode,
    })
  }
/>
    </div>
  );
};

export default DepartmentPage;
