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
import { useTranslation } from "react-i18next";
import ErrorPage from "../ErrorPage/ErrorPage";
import {
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import newsService from "../Services/newsService";
import { SmartImage } from "../utils/imageHelper";
import "../NewsPage/News.css";
import "../NewsPage/News.filter.css";
import "./FacultyNews.css";
import FacultyFooter from "../Shared/FacultyFooter/FacultyFooter";
import logo from "../../src/assets/logo.jpg";
import logo2 from "../../src/assets/MNF_logo.png";
import headerBg from "../../src/assets/01.jpg";

const ITEMS_PER_PAGE = 10;
const DEBOUNCE_DELAY = 500;
const getFacultyTopMenuLimit = () => {
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

const FACULTY_NAV_PRIORITY_GROUPS = [
  {
    key: "about",
    aliases: [
      "عن الكلية",
      "عن الكليه",
      "نبذة عن الكلية",
      "نبذه عن الكليه",
      "حول الكلية",
      "حول الكليه",
      "about faculty",
      "about college",
      "about the faculty",
      "faculty overview",
      "college overview",
      "overview",
      "à propos de la faculté",
      "a propos de la faculte",
      "fakülte hakkında",
      "fakulte hakkinda",
      "sobre la facultad",
    ],
  },
  {
    key: "administration",
    aliases: [
      "إدارة الكلية",
      "ادارة الكلية",
      "إدارة الكليه",
      "ادارة الكليه",
      "ادارة",
      "الإدارة",
      "الادارة",
      "college administration",
      "faculty administration",
      "administration",
      "management",
      "verwaltung",
      "yönetim",
      "yonetim",
      "administración",
      "administration de la faculté",
    ],
  },
  {
    key: "sectors",
    aliases: [
      "قطاعات الكلية",
      "قطاعات الكليه",
      "قطاعات",
      "faculty sectors",
      "college sectors",
      "sectors",
      "secteurs",
      "sektörler",
      "sektorler",
      "sectores",
    ],
  },
  {
    key: "departments",
    aliases: [
      "أقسام الكلية",
      "اقسام الكلية",
      "أقسام الكليه",
      "اقسام الكليه",
      "الأقسام العلمية",
      "الاقسام العلمية",
      "الأقسام",
      "الاقسام",
      "departments",
      "academic departments",
      "faculty departments",
      "college departments",
      "départements",
      "departements",
      "bölümler",
      "bolumler",
      "departamentos",
    ],
  },
  {
    key: "students",
    aliases: [
      "الطلاب",
      "شؤون الطلاب",
      "شئون الطلاب",
      "شؤون التعليم والطلاب",
      "شئون التعليم والطلاب",
      "students",
      "student affairs",
      "education and student affairs",
      "étudiants",
      "etudiants",
      "öğrenciler",
      "ogrenciler",
      "estudiantes",
    ],
  },
  {
    key: "facultyMembers",
    aliases: [
      "أعضاء هيئة التدريس",
      "اعضاء هيئة التدريس",
      "اعضاء هيئه التدريس",
      "هيئة التدريس",
      "هيئه التدريس",
      "faculty members",
      "teaching staff",
      "academic staff",
      "staff members",
      "corps enseignant",
      "akademik personel",
      "personal académico",
    ],
  },
  {
    key: "administrativeStaff",
    aliases: [
      "الجهاز الإداري",
      "الجهاز الاداري",
      "الجهاز الإدارى",
      "الجهاز الادارى",
      "الجهازالإداري",
      "الجهازالاداري",
      "الإداريون",
      "الاداريون",
      "administrative staff",
      "admin staff",
      "administrative body",
      "administrative apparatus",
      "personnel administratif",
      "idari personel",
      "personal administrativo",
    ],
  },
] as const;

const TOP_MENU_TITLES = FACULTY_NAV_PRIORITY_GROUPS.flatMap(
  (group) => group.aliases,
);

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


type SavedLang = {
  id?: number;
  code?: string;
  name?: string;
  flag?: string;
};

interface NewsItem {
  id: number;
  title: string;
  date: string;
  currentDate?: string;
  image: string;
  source: string;
  imageAlt: string;
}

interface HighlightItem {
  id: number;
  startDate: string;
  endDate: string;
  image: string;
  translationData: string;
}

interface CollegeLogoItem {
  id: number;
  title: string;
  logoUrl: string;
}

interface FacultyMenuItem {
  id?: number;
  menuId: number;
  parentId: number | null;
  sortOrder: number;
  order?: number;
  title: string;
  articleId: number | null;
  url: string;
  children: FacultyMenuItem[];
  subMenus?: FacultyMenuItem[];
}

interface FacultyArticlePageData {
  articleId: number;
  menuItemId: number;
  title: string;
  content: string;
  imageDescription?: string | null;
}

type ArticleAssetLink = {
  href: string;
  text: string;
  extension: string;
  isFile: boolean;
  isVideo: boolean;
};

type ArticleImage = {
  src: string;
  alt: string;
};

type FooterMenuGroup = {
  menuId: number | string;
  title: string;
  children: FacultyMenuItem[];
};

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
  const matchedCodeById = Object.entries(LANGUAGE_IDS).find(
    ([, id]) => id === savedId,
  )?.[0] as LanguageCode | undefined;

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

const DATE_FILTERS = [
  { value: 0, labelKey: "allNews" },
  { value: 2, labelKey: "today" },
  { value: 3, labelKey: "lastWeek" },
  { value: 4, labelKey: "lastMonth" },
];

const normalizeName = (value: string): string =>
  String(value || "")
    .trim()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[ًٌٍَُِّْ]/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();

const normalizeMenuTitle = (title?: string): string =>
  normalizeName(String(title || ""));

const normalizeMenuSearchText = (value?: string) =>
  normalizeMenuTitle(value)
    .replace(/[ـ]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const doesMenuTitleMatchAlias = (title: string, alias: string) => {
  const normalizedTitle = normalizeMenuSearchText(title);
  const normalizedAlias = normalizeMenuSearchText(alias);

  if (!normalizedTitle || !normalizedAlias) return false;
  if (normalizedTitle === normalizedAlias) return true;

  const aliasWords = normalizedAlias.split(" ").filter(Boolean);

  if (aliasWords.length < 2) return false;

  return (
    normalizedTitle.includes(normalizedAlias) ||
    normalizedAlias.includes(normalizedTitle)
  );
};

const getFacultyMenuPriority = (item: FacultyMenuItem) => {
  const title = cleanMenuTitle(item.title);

  const matchedPriorityIndex = FACULTY_NAV_PRIORITY_GROUPS.findIndex((group) =>
    group.aliases.some((alias) => doesMenuTitleMatchAlias(title, alias)),
  );

  return matchedPriorityIndex === -1
    ? FACULTY_NAV_PRIORITY_GROUPS.length + 100
    : matchedPriorityIndex;
};

const sortFacultyMenuForTopNav = (items: FacultyMenuItem[] = []) => {
  return sanitizeFacultyMenuItems(items)
    .map((item, originalIndex) => ({
      item,
      originalIndex,
      priority: getFacultyMenuPriority(item),
    }))
    .sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority;

      const orderA = Number(a.item.sortOrder ?? a.item.order) || 0;
      const orderB = Number(b.item.sortOrder ?? b.item.order) || 0;

      if (orderA !== orderB) return orderA - orderB;

      return a.originalIndex - b.originalIndex;
    })
    .map(({ item }) => item);
};

const isValidLogoUrl = (url?: string) => {
  const value = String(url || "").trim();

  return (
    value.length > 0 &&
    value !== "YOUR_LOGO_URL_HERE" &&
    /^https?:\/\//i.test(value)
  );
};

const getCollegeLogoByName = (
  collegeTitle: string,
  logos: CollegeLogoItem[],
) => {
  const normalizedTitle = normalizeName(collegeTitle);

  const matchedLogo = logos.find(
    (item) => normalizeName(item.title) === normalizedTitle,
  );

  return isValidLogoUrl(matchedLogo?.logoUrl) ? matchedLogo?.logoUrl || "" : "";
};

const getCollegeLogoForCollege = (
  college: any,
  logos: CollegeLogoItem[],
  fallbackTitle = "",
) => {
  const possibleIds = [
    college?.id,
    college?.menuId,
    college?.collegeId,
    college?.CollegeId,
  ];

  for (const possibleId of possibleIds) {
    const numericId = Number(possibleId);

    if (!Number.isFinite(numericId) || numericId <= 0) continue;

    const matchedLogoById = logos.find(
      (item) => Number(item.id) === numericId && isValidLogoUrl(item.logoUrl),
    );

    if (matchedLogoById?.logoUrl) return matchedLogoById.logoUrl;
  }

  const titleLogo = getCollegeLogoByName(college?.title || fallbackTitle, logos);

  if (titleLogo) return titleLogo;

  return getCollegeLogoByName(fallbackTitle, logos);
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
  return colleges.find((college) => {
    return getCollegeFacFromApi(college) === facultyCode;
  });
};

const extractDepartmentCodeFromUrl = (url?: string) => {
  const value = String(url || "").trim();

  if (!value || value === "#") return "";

  const twoLevelMatch = value.match(/\/[^/]+\/([^/]+)\/Home(?:\/|$)/i);

  if (twoLevelMatch?.[1]) {
    return twoLevelMatch[1].toUpperCase();
  }

  const oneLevelMatch = value.match(/\/([^/]+)\/Home(?:\/|$)/i);

  if (oneLevelMatch?.[1]) {
    const code = oneLevelMatch[1].toUpperCase();

    if (!["COM", "SCI", "AGR", "MED", "EDU", "ART", "LAW"].includes(code)) {
      return code;
    }
  }

  return "";
};


const extractArticleIdFromMenuUrl = (url?: string): number | null => {
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

const getSavedLang = (): SavedLang => {
  try {
    return JSON.parse(localStorage.getItem("lang") || "{}");
  } catch {
    return {};
  }
};

const normalizeApiResponse = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.result)) return data.data.result;
  return [];
};

const cleanMenuTitle = (title?: string) =>
  String(title || "")
    .replace(/\s+/g, " ")
    .trim();

const isExternalMenuUrl = (url?: string) =>
  typeof url === "string" && /^https?:\/\//i.test(url);

const getMenuChildren = (item?: FacultyMenuItem) => {
  const children = Array.isArray(item?.children)
    ? item?.children
    : Array.isArray(item?.subMenus)
      ? item?.subMenus
      : [];

  return children
    .filter((child) => child && typeof child === "object")
    .filter((child) => cleanMenuTitle(child.title).length > 0)
    .sort(
      (a, b) =>
        (Number(a.sortOrder ?? a.order) || 0) -
        (Number(b.sortOrder ?? b.order) || 0),
    );
};

const sanitizeFacultyMenuItems = (items: FacultyMenuItem[] = []) => {
  return items
    .filter((item) => item && typeof item === "object")
    .filter((item) => cleanMenuTitle(item.title).length > 0)
    .map((item) => {
      const normalizedItem = {
        ...item,
        menuId: Number(item.menuId ?? item.id) || 0,
        parentId: item.parentId ?? null,
        sortOrder: Number(item.sortOrder ?? item.order) || 0,
        articleId: item.articleId ?? null,
        url: item.url || "",
        title: cleanMenuTitle(item.title),
        children: getMenuChildren(item),
      };

      return normalizedItem;
    })
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
};

const normalizeMenuUrl = (url?: string) => {
  const value = String(url || "").trim();

  if (!value || value === "#") return "";

  if (/^https?:\/\//i.test(value)) return value;

  if (value.startsWith("/")) {
    return `https://www.menofia.edu.eg${value}`;
  }

  return value;
};

const getFacultyMenuLink = (item: FacultyMenuItem, fac?: string) => {
  const departmentCode = extractDepartmentCodeFromUrl(item.url);

  if (departmentCode && fac) {
    return `/fac/${fac}/department/${departmentCode}`;
  }

  const responseArticleId =
    item.articleId !== null &&
    item.articleId !== undefined &&
    String(item.articleId).trim() !== ""
      ? Number(item.articleId)
      : null;

  if (responseArticleId && fac) {
    return `/fac/${fac}?articleId=${responseArticleId}`;
  }

  const extractedArticleId = extractArticleIdFromMenuUrl(item.url);

  if (extractedArticleId && fac) {
    return `/fac/${fac}?articleId=${extractedArticleId}`;
  }

  const menuUrl = normalizeMenuUrl(item.url);

  if (menuUrl) {
    return menuUrl;
  }

  return `/fac/${fac}`;
};

const chunkItems = (items: FacultyMenuItem[], chunksCount: number) => {
  const chunks: FacultyMenuItem[][] = Array.from(
    { length: chunksCount },
    () => [],
  );

  items.forEach((item, index) => {
    chunks[index % chunksCount].push(item);
  });

  return chunks;
};

const buildFooterMenuGroups = (
  items: FacultyMenuItem[],
  isArabic: boolean,
  options: { onlyFooterGroups?: boolean; excludeTopTitles?: boolean } = {},
): FooterMenuGroup[] => {
  const cleanItems = sanitizeFacultyMenuItems(items);
  const topTitles = TOP_MENU_TITLES.map(normalizeMenuSearchText);
  const footerTitles = FOOTER_GROUP_TITLES.map(normalizeMenuSearchText);

  const apiGroups = cleanItems
    .filter((item) =>
      footerTitles.includes(normalizeMenuSearchText(item.title)),
    )
    .slice(0, 3)
    .map((item) => ({
      menuId: item.menuId,
      title: cleanMenuTitle(item.title),
      children: getMenuChildren(item),
    }))
    .filter((group) => group.children.length > 0);

  if (apiGroups.length > 0) return apiGroups;

  if (options.onlyFooterGroups) return [];

  const sourceItems = options.excludeTopTitles
    ? cleanItems.filter(
        (item) => !topTitles.includes(normalizeMenuSearchText(item.title)),
      )
    : cleanItems;

  const fallbackTitles = isArabic
    ? ["روابط الكلية", "خدمات ومعلومات", "روابط إضافية"]
    : ["Faculty Links", "Services & Info", "More Links"];

  return chunkItems(sourceItems, 3)
    .map((children, index) => ({
      menuId: `footer-group-${index}`,
      title: fallbackTitles[index],
      children: children.filter(
        (item) => cleanMenuTitle(item.title).length > 0,
      ),
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

const useFacultyMenuRows = (items: FacultyMenuItem[]) => {
  const [itemsPerRow, setItemsPerRow] = useState<number>(() =>
    getFacultyTopMenuLimit(),
  );
  const [activeRowIndex, setActiveRowIndex] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      setItemsPerRow(getFacultyTopMenuLimit());
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const rows = useMemo(
    () => chunkMenuItemsBySize(items, itemsPerRow),
    [items, itemsPerRow],
  );

  useEffect(() => {
    setActiveRowIndex(0);
  }, [items.length, itemsPerRow]);

  useEffect(() => {
    setActiveRowIndex((current) =>
      Math.min(current, Math.max(rows.length - 1, 0)),
    );
  }, [rows.length]);

  const safeActiveRowIndex = Math.min(
    activeRowIndex,
    Math.max(rows.length - 1, 0),
  );

  const goNext = useCallback(() => {
    setActiveRowIndex((current) =>
      Math.min(current + 1, Math.max(rows.length - 1, 0)),
    );
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

const FacultyMenuItemView: React.FC<{
  item: FacultyMenuItem;
  fac?: string;
  facultyTitle?: string;
  level?: number;
}> = ({ item, fac, facultyTitle, level = 0 }) => {
  const [open, setOpen] = useState(false);
  const [dropDirection, setDropDirection] = useState<"default" | "flip">(
    "default",
  );

  const itemRef = useRef<HTMLDivElement | null>(null);
  const subMenuRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const children = getMenuChildren(item);
  const hasChildren = children.length > 0;
  const link = getFacultyMenuLink(item, fac);
  const isExternal = isExternalMenuUrl(link);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const updateDropDirection = useCallback(() => {
    if (!hasChildren || !itemRef.current || typeof window === "undefined") {
      return;
    }

    const rect = itemRef.current.getBoundingClientRect();
    const safeGap = 14;
    const viewportWidth = window.innerWidth;

    const menuWidth =
      subMenuRef.current?.offsetWidth || (level === 0 ? 300 : 260);

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

    if (leftSpace < menuWidth && rightSpace > leftSpace) {
      setDropDirection("flip");
    } else {
      setDropDirection("default");
    }
  }, [hasChildren, level]);

  const handleMouseEnter = () => {
    if (!hasChildren) return;

    clearCloseTimer();
    updateDropDirection();
    setOpen(true);

    requestAnimationFrame(() => {
      updateDropDirection();
    });
  };

  const handleMouseLeave = () => {
    if (!hasChildren) return;

    clearCloseTimer();

    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
    }, 260);
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

        requestAnimationFrame(() => {
          updateDropDirection();
        });
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

  useEffect(() => {
    return () => {
      clearCloseTimer();
    };
  }, []);

  const NestedArrow = dropDirection === "flip" ? ChevronRight : ChevronLeft;

  const content = (
    <>
      <span>{cleanMenuTitle(item.title)}</span>

      {hasChildren &&
        (level === 0 ? (
          <ChevronDown
            size={12}
            className={`faculty-menu-arrow root-arrow ${open ? "open" : ""}`}
          />
        ) : (
          <NestedArrow
            size={12}
            className="faculty-menu-arrow nested-arrow"
          />
        ))}
    </>
  );

  return (
    <div
      ref={itemRef}
      className={`faculty-menu-item level-${level} ${
        hasChildren ? "has-children" : ""
      } ${open ? "open" : ""} drop-${dropDirection}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {hasChildren ? (
        <button
          type="button"
          className="faculty-menu-link"
          onClick={handleToggle}
        >
          {content}
        </button>
      ) : isExternal ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="faculty-menu-link"
        >
          {content}
        </a>
      ) : (
        <Link
          to={link}
          state={{
            facultyTitle,
            departmentTitle: cleanMenuTitle(item.title),
          }}
          className="faculty-menu-link"
        >
          {content}
        </Link>
      )}

      {hasChildren && open && (
        <div ref={subMenuRef} className="faculty-sub-menu">
          {children.map((child) => (
            <FacultyMenuItemView
              key={child.menuId}
              item={child}
              fac={fac}
              facultyTitle={facultyTitle}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};


const getUrlExtension = (url = "") => {
  const cleanUrl = String(url).split("?")[0].split("#")[0];
  const match = cleanUrl.match(/\.([a-z0-9]+)$/i);

  return match ? match[1].toLowerCase() : "";
};

const isFileExtension = (extension: string) => {
  return ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx"].includes(
    extension.toLowerCase(),
  );
};

const isVideoExtension = (extension: string) => {
  return ["mp4", "webm", "ogg", "mov"].includes(extension.toLowerCase());
};

const removeWordNoise = (html = "") => {
  return String(html || "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<xml[\s\S]*?<\/xml>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\sclass=("|')Mso[^"']*("|')/gi, "")
    .replace(/\sstyle=("|')[\s\S]*?\1/gi, "")
    .replace(/<o:p>[\s\S]*?<\/o:p>/gi, "")
    .replace(/&nbsp;/g, " ")
    .trim();
};

const stripHtmlToText = (html = "") => {
  if (typeof window !== "undefined" && window.DOMParser) {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
  }

  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const removeImagesFromHtml = (html = "") => {
  return String(html || "")
    .replace(/<img[^>]*>/gi, "")
    .trim();
};

const parseArticleContent = (html = "") => {
  const cleanedHtml = removeWordNoise(html);
  const links: ArticleAssetLink[] = [];
  const images: ArticleImage[] = [];

  if (typeof window !== "undefined" && window.DOMParser) {
    const doc = new DOMParser().parseFromString(cleanedHtml, "text/html");

    doc.querySelectorAll("a[href]").forEach((anchor) => {
      const href = anchor.getAttribute("href") || "";
      const extension = getUrlExtension(href);
      const text = (anchor.textContent || href).replace(/\s+/g, " ").trim();

      if (href) {
        links.push({
          href,
          text,
          extension,
          isFile: isFileExtension(extension),
          isVideo: isVideoExtension(extension),
        });
      }
    });

    doc.querySelectorAll("img[src]").forEach((img) => {
      const src = img.getAttribute("src") || "";
      const alt = img.getAttribute("alt") || "";

      if (src) {
        images.push({ src, alt });
      }
    });
  } else {
    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let linkMatch;

    while ((linkMatch = linkRegex.exec(cleanedHtml)) !== null) {
      const href = linkMatch[1];
      const extension = getUrlExtension(href);
      const text = stripHtmlToText(linkMatch[2]) || href;

      links.push({
        href,
        text,
        extension,
        isFile: isFileExtension(extension),
        isVideo: isVideoExtension(extension),
      });
    }

    const imageRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    let imageMatch;

    while ((imageMatch = imageRegex.exec(cleanedHtml)) !== null) {
      images.push({ src: imageMatch[1], alt: "" });
    }
  }

  const text = stripHtmlToText(cleanedHtml);

  return {
    cleanedHtml,
    htmlWithoutImages: removeImagesFromHtml(cleanedHtml),
    text,
    links,
    images,
    fileLinks: links.filter((link) => link.isFile),
    videoLinks: links.filter((link) => link.isVideo),
  };
};
type HistoricalTimelineItem = {
  year: string;
  content: string;
};

const isHistoricalOverviewArticle = (title = "") => {
  const normalizedTitle = normalizeMenuTitle(title);

  return (
    normalizedTitle.includes("نبذه تاريخيه") ||
    normalizedTitle.includes("نبذة تاريخية") ||
    normalizedTitle.includes("historical overview") ||
    normalizedTitle.includes("history")
  );
};

const extractHistoricalTimeline = (
  html = "",
): {
  intro: string;
  timeline: HistoricalTimelineItem[];
} => {
  const text = stripHtmlToText(html).replace(/\s+/g, " ").trim();

  if (!text) {
    return {
      intro: "",
      timeline: [],
    };
  }

  const yearRegex = /\b(?:18|19|20)\d{2}\b/g;
  const matches = Array.from(text.matchAll(yearRegex));

  if (matches.length === 0) {
    return {
      intro: text,
      timeline: [],
    };
  }

  const firstYearIndex = matches[0].index ?? 0;
  const intro = text.slice(0, firstYearIndex).trim();

  const timeline = matches
    .map((match, index) => {
      const year = match[0];
      const start = (match.index ?? 0) + year.length;
      const end =
        index < matches.length - 1
          ? (matches[index + 1].index ?? text.length)
          : text.length;

      const content = text
        .slice(start, end)
        .replace(/^(\s*[-–—:،,.])+\s*/, "")
        .trim();

      return {
        year,
        content,
      };
    })
    .filter((item) => item.content);

  return {
    intro,
    timeline,
  };
};

const isGoalsArticle = (title = "") => {
  const normalizedTitle = normalizeMenuTitle(title);

  return (
    normalizedTitle.includes("الاهداف") ||
    normalizedTitle.includes("اهداف") ||
    normalizedTitle.includes("goals") ||
    normalizedTitle.includes("objectives")
  );
};

const extractGoalsList = (html = ""): string[] => {
  const cleanedHtml = removeWordNoise(html);

  if (typeof window !== "undefined" && window.DOMParser) {
    const doc = new DOMParser().parseFromString(cleanedHtml, "text/html");

    const listItems = Array.from(doc.querySelectorAll("li"))
      .map((item) => (item.textContent || "").replace(/\s+/g, " ").trim())
      .filter(Boolean);

    if (listItems.length > 0) return listItems;

    return (doc.body.textContent || "")
      .split(/[•\n\r]+|(?<=[.!؟])\s+/)
      .map((item) => item.replace(/\s+/g, " ").trim())
      .filter((item) => item.length > 4);
  }

  return stripHtmlToText(cleanedHtml)
    .split(/[•\n\r]+|(?<=[.!؟])\s+/)
    .map((item) => item.replace(/\s+/g, " ").trim())
    .filter((item) => item.length > 4);
};

type FacultyAccordionItem = {
  title: string;
  contentHtml: string;
};

const isStudentAffairsAccordionArticle = (title = "") => {
  const normalizedTitle = normalizeMenuTitle(title);

  return (
    normalizedTitle.includes("شؤون التعليم والطلاب") ||
    normalizedTitle.includes("شئون التعليم والطلاب") ||
    normalizedTitle.includes("اداره شؤون التعليم والطلاب") ||
    normalizedTitle.includes("ادارة شؤون التعليم والطلاب") ||
    normalizedTitle.includes("education and student affairs") ||
    normalizedTitle.includes("student affairs")
  );
};

const isAccordionHeadingText = (value = "") => {
  const text = String(value || "")
    .replace(/\s+/g, " ")
    .trim();

  if (!text || text.length > 180) return false;

  return /^(?:أولاً|أولا|ثانياً|ثانيا|ثالثاً|ثالثا|رابعاً|رابعا|خامساً|خامسا|سادساً|سادسا|سابعاً|سابعا|ثامناً|ثامنا|تاسعاً|تاسعا|عاشراً|عاشرا)\s*[:：\-–—]?/i.test(
    text,
  );
};

const extractStudentAffairsAccordion = (
  html = "",
  noExtraContentText = "No extra content available for this item.",
): FacultyAccordionItem[] => {
  const cleanedHtml = removeWordNoise(html);

  if (typeof window === "undefined" || !window.DOMParser) {
    return [];
  }

  const doc = new DOMParser().parseFromString(cleanedHtml, "text/html");
  const body = doc.body;

  const blockElements = Array.from(
    body.querySelectorAll(
      ":scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6, :scope > p, :scope > div, :scope > ul, :scope > ol",
    ),
  );

  const items: FacultyAccordionItem[] = [];
  let currentTitle = "";
  let currentContent: string[] = [];

  const pushCurrentItem = () => {
    if (!currentTitle) return;

    items.push({
      title: currentTitle,
      contentHtml:
        currentContent.join("").trim() ||
        `<p>${noExtraContentText}</p>`,
    });

    currentTitle = "";
    currentContent = [];
  };

  blockElements.forEach((element) => {
    const elementText = (element.textContent || "").replace(/\s+/g, " ").trim();

    const tagName = element.tagName.toLowerCase();
    const isHeadingTag = /^h[1-6]$/.test(tagName);
    const strongText =
      element.querySelector(":scope > strong, :scope > b")?.textContent || "";
    const titleCandidate = strongText.replace(/\s+/g, " ").trim();

    const shouldStartItem =
      isAccordionHeadingText(elementText) ||
      isAccordionHeadingText(titleCandidate) ||
      (isHeadingTag && elementText.length > 0);

    if (shouldStartItem) {
      pushCurrentItem();
      currentTitle = titleCandidate || elementText;
      return;
    }

    if (currentTitle) {
      currentContent.push(element.outerHTML);
    }
  });

  pushCurrentItem();

  if (items.length > 0) {
    return items;
  }

  const plainText = (body.textContent || "").replace(/\s+/g, " ").trim();
  const headingRegex =
    /(?:أولاً|أولا|ثانياً|ثانيا|ثالثاً|ثالثا|رابعاً|رابعا|خامساً|خامسا|سادساً|سادسا|سابعاً|سابعا|ثامناً|ثامنا|تاسعاً|تاسعا|عاشراً|عاشرا)\s*[:：\-–—]?/g;

  const matches = Array.from(plainText.matchAll(headingRegex));

  return matches
    .map((match, index) => {
      const start = match.index ?? 0;
      const nextStart =
        index < matches.length - 1
          ? (matches[index + 1].index ?? plainText.length)
          : plainText.length;

      const sectionText = plainText.slice(start, nextStart).trim();
      const separatorIndex = sectionText.search(/[.،؛]\s/);

      const title =
        separatorIndex > 0
          ? sectionText.slice(0, separatorIndex + 1).trim()
          : sectionText.slice(0, 120).trim();

      const content =
        separatorIndex > 0 ? sectionText.slice(separatorIndex + 1).trim() : "";

      return {
        title,
        contentHtml: content
          ? `<p>${content}</p>`
          : `<p>${noExtraContentText}</p>`,
      };
    })
    .filter((item) => item.title);
};
type VisionMissionType = "vision" | "mission";

type VisionMissionItem = {
  type: VisionMissionType;
  title: string;
  content: string;
};

const isVisionMissionArticle = (title = "", html = "") => {
  const normalizedTitle = normalizeMenuTitle(title);
  const normalizedContent = normalizeMenuTitle(stripHtmlToText(html));

  return (
    normalizedTitle.includes("رؤيه") ||
    normalizedTitle.includes("رؤية") ||
    normalizedTitle.includes("رساله") ||
    normalizedTitle.includes("رسالة") ||
    normalizedTitle.includes("vision") ||
    normalizedTitle.includes("mission") ||
    normalizedContent.includes("رؤيه") ||
    normalizedContent.includes("رؤية") ||
    normalizedContent.includes("رساله") ||
    normalizedContent.includes("رسالة") ||
    normalizedContent.includes("vision") ||
    normalizedContent.includes("mission")
  );
};

const getVisionMissionTitle = (
  type: VisionMissionType,
  _isArabic: boolean,
) => type;

const cleanVisionMissionText = (value = "") => {
  return String(value || "")
    .replace(/^(الرؤية|الرؤيه|رؤية الكلية|رؤيه الكليه|vision)\s*[:：\-–—.]?\s*/i, "")
    .replace(/^(الرسالة|الرساله|رسالة الكلية|رساله الكليه|mission)\s*[:：\-–—.]?\s*/i, "")
    .replace(/^["“”'«»]+|["“”'«»]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

const getMarkerType = (marker = ""): VisionMissionType => {
  const normalizedMarker = normalizeMenuTitle(marker);

  if (
    normalizedMarker.includes("رساله") ||
    normalizedMarker.includes("mission")
  ) {
    return "mission";
  }

  return "vision";
};

const extractVisionMissionItems = (
  title = "",
  html = "",
  isArabic: boolean,
): VisionMissionItem[] => {
  const text = stripHtmlToText(html).replace(/\s+/g, " ").trim();
  const normalizedTitle = normalizeMenuTitle(title);

  if (!text && !normalizedTitle) return [];

  const markerRegex =
    /(رؤية\s*الكلية|رؤيه\s*الكليه|الرؤية|الرؤيه|رؤية|رؤيه|رسالة\s*الكلية|رساله\s*الكليه|الرسالة|الرساله|رسالة|رساله|vision|mission)/gi;

  const matches = Array.from(text.matchAll(markerRegex));

  if (matches.length > 0) {
    const items = matches
      .map((match, index) => {
        const marker = match[0];
        const type = getMarkerType(marker);
        const start = (match.index ?? 0) + marker.length;
        const end =
          index < matches.length - 1
            ? matches[index + 1].index ?? text.length
            : text.length;

        const content = cleanVisionMissionText(text.slice(start, end));

        return {
          type,
          title: getVisionMissionTitle(type, isArabic),
          content,
        };
      })
      .filter((item) => item.content.length > 0);

    const uniqueItems = items.filter(
      (item, index, array) =>
        array.findIndex((current) => current.type === item.type) === index,
    );

    if (uniqueItems.length > 0) return uniqueItems;
  }

  if (
    normalizedTitle.includes("رؤيه") ||
    normalizedTitle.includes("رؤية") ||
    normalizedTitle.includes("vision")
  ) {
    return [
      {
        type: "vision",
        title: getVisionMissionTitle("vision", isArabic),
        content: cleanVisionMissionText(text),
      },
    ].filter((item) => item.content.length > 0);
  }

  if (
    normalizedTitle.includes("رساله") ||
    normalizedTitle.includes("رسالة") ||
    normalizedTitle.includes("mission")
  ) {
    return [
      {
        type: "mission",
        title: getVisionMissionTitle("mission", isArabic),
        content: cleanVisionMissionText(text),
      },
    ].filter((item) => item.content.length > 0);
  }

  return [];
};
const getArticleType = (
  article: FacultyArticlePageData,
  parsed: ReturnType<typeof parseArticleContent>,
) => {
  const normalizedTitle = normalizeMenuTitle(article.title);

  if (parsed.videoLinks.length > 0) return "video";
  if (parsed.fileLinks.length > 0) return "file";

  if (
    parsed.images.length > 0 &&
    (normalizedTitle.includes("عميد") ||
      normalizedTitle.includes("وكيل") ||
      normalizedTitle.includes("امين") ||
      normalizedTitle.includes("مدير"))
  ) {
    return "profile";
  }

  if (parsed.images.length > 0 && parsed.text.length < 140) return "image";

  return "default";
};

const getFileLabel = (extension: string) => {
  const value = extension.toUpperCase();
  if (!value) return "FILE";
  return value;
};

const FacultyArticleRenderer: React.FC<{
  article: FacultyArticlePageData;
  isArabic: boolean;
}> = ({ article, isArabic }) => {
  const { t } = useTranslation("FacultyNews");

  const parsed = useMemo(
    () => parseArticleContent(article.content || ""),
    [article.content],
  );

  const articleType = getArticleType(article, parsed);

  const historicalData = useMemo(
    () => extractHistoricalTimeline(article.content || ""),
    [article.content],
  );

  const goalsList = useMemo(
    () => extractGoalsList(article.content || ""),
    [article.content],
  );

  const accordionItems = useMemo(
    () => extractStudentAffairsAccordion(article.content || "", t("noExtraContent")),
    [article.content, t],
  );

  const [openAccordionIndex, setOpenAccordionIndex] = useState<number | null>(
    null,
  );

  const isHistoricalArticle = isHistoricalOverviewArticle(article.title);
  const isGoalsPage = isGoalsArticle(article.title);
  const isStudentAffairsAccordion = isStudentAffairsAccordionArticle(
    article.title,
  );
  const visionMissionItems = useMemo(
  () => extractVisionMissionItems(article.title, article.content || "", isArabic),
  [article.title, article.content, isArabic],
);

const isVisionMissionPage =
  isVisionMissionArticle(article.title, article.content || "") &&
  visionMissionItems.length > 0;
  if (isVisionMissionPage) {
  const hasBoth = visionMissionItems.length > 1;

  return (
    <article
      className={`faculty-vision-mission-card ${
        hasBoth ? "combined" : "single"
      }`}
    >
      <div className="faculty-vision-mission-page-title">
        <span className="faculty-vision-mission-title-dot" />
        <h2>
          {hasBoth
            ? t("facultyVisionMission")
            : visionMissionItems[0]?.type === "vision"
              ? t("facultyVision")
              : visionMissionItems[0]?.type === "mission"
                ? t("facultyMission")
                : visionMissionItems[0]?.title || article.title}
        </h2>
      </div>

      <div className="faculty-vision-mission-items">
        {visionMissionItems.map((item) => (
          <section
            key={item.type}
            className={`faculty-vision-mission-item ${item.type}`}
          >
            <div className="faculty-vision-mission-heading">
              <span className="faculty-vision-mission-icon" aria-hidden="true">
                <i
                  className={
                    item.type === "vision"
                      ? "fa-regular fa-eye"
                      : "fa-regular fa-paper-plane"
                  }
                />
              </span>

              <div>
                <h3>
                  {item.type === "vision"
                    ? t("facultyVision")
                    : item.type === "mission"
                      ? t("facultyMission")
                      : item.title}
                </h3>
                <span className="faculty-vision-mission-heading-line" />
              </div>
            </div>

            <div className="faculty-vision-mission-text-box">
              <p>{item.content}</p>
            </div>
          </section>
        ))}
      </div>
    </article>
  );
}

  if (isHistoricalArticle) {
    return (
      <article className="faculty-history-card">
        <div className="faculty-history-card-header">
          <span className="faculty-history-icon" aria-hidden="true">
            <i className="fa-regular fa-file-lines" />
          </span>

          <div className="faculty-history-heading">
            <h2>
              {article.title || t("historicalOverview")}
            </h2>
            <span className="faculty-history-heading-line" />
          </div>
        </div>

        <div className="faculty-history-body">
          <div className="faculty-history-content">
            {historicalData.intro && (
              <p className="faculty-history-intro">{historicalData.intro}</p>
            )}

            {historicalData.timeline.length > 0 ? (
              <div className="faculty-history-timeline">
                {historicalData.timeline.map((item, index) => (
                  <div
                    key={`${item.year}-${index}`}
                    className="faculty-history-timeline-item"
                  >
                    <div className="faculty-history-year">
                      <span className="faculty-history-year-dot" />
                      <strong>{item.year}</strong>
                    </div>

                    <p className="faculty-history-description">
                      {item.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="faculty-history-fallback-content"
                dangerouslySetInnerHTML={{
                  __html:
                    parsed.cleanedHtml ||
                    `<p>${
                      t("noContent")
                    }</p>`,
                }}
              />
            )}
          </div>
        </div>
      </article>
    );
  }

  if (isGoalsPage) {
    return (
      <article className="faculty-goals-card">
        <div className="faculty-goals-card-header">
          <span className="faculty-goals-icon" aria-hidden="true">
            <i className="fa-regular fa-file-lines" />
          </span>

          <div className="faculty-goals-heading">
            <h2>
              {article.title || t("facultyGoals")}
            </h2>
            <span className="faculty-goals-heading-line" />
          </div>
        </div>

        <div className="faculty-goals-content">
          {goalsList.length > 0 ? (
            <ul className="faculty-goals-list">
              {goalsList.map((goal, index) => (
                <li key={`${index}-${goal.slice(0, 32)}`}>
                  <span className="faculty-goals-dot" aria-hidden="true" />
                  <p>{goal}</p>
                </li>
              ))}
            </ul>
          ) : (
            <div
              className="faculty-goals-fallback"
              dangerouslySetInnerHTML={{
                __html:
                  parsed.cleanedHtml ||
                  `<p>${
                    t("noGoals")
                  }</p>`,
              }}
            />
          )}
        </div>
      </article>
    );
  }

  if (isStudentAffairsAccordion) {
    return (
      <article className="faculty-student-affairs-card">
        <div className="faculty-student-affairs-header">
          <span className="faculty-student-affairs-icon" aria-hidden="true">
            <i className="fa-regular fa-file-lines" />
          </span>

          <div className="faculty-student-affairs-heading">
            <h2>{article.title}</h2>
            <span className="faculty-student-affairs-heading-line" />
          </div>
        </div>

        <div className="faculty-student-affairs-accordion">
          {accordionItems.length > 0 ? (
            accordionItems.map((item, index) => {
              const isOpen = openAccordionIndex === index;
              const titleMatch = item.title.match(
                /^((?:أولاً|أولا|ثانياً|ثانيا|ثالثاً|ثالثا|رابعاً|رابعا|خامساً|خامسا|سادساً|سادسا|سابعاً|سابعا|ثامناً|ثامنا|تاسعاً|تاسعا|عاشراً|عاشرا)\s*[:：\-–—]?)(.*)$/i,
              );

              return (
                <section
                  key={`${item.title}-${index}`}
                  className={`faculty-student-affairs-item ${
                    isOpen ? "open" : ""
                  }`}
                >
                  <button
                    type="button"
                    className="faculty-student-affairs-trigger"
                    onClick={() =>
                      setOpenAccordionIndex((currentIndex) =>
                        currentIndex === index ? null : index,
                      )
                    }
                    aria-expanded={isOpen}
                  >
                    <span className="faculty-student-affairs-title-wrap">
                      <span
                        className="faculty-student-affairs-dot"
                        aria-hidden="true"
                      />

                      <span className="faculty-student-affairs-title">
                        {titleMatch ? (
                          <>
                            <strong className="faculty-student-affairs-order">
                              {titleMatch[1]}
                            </strong>
                            <span>{titleMatch[2]}</span>
                          </>
                        ) : (
                          item.title
                        )}
                      </span>
                    </span>

                    <ChevronDown
                      size={18}
                      strokeWidth={1.8}
                      className="faculty-student-affairs-chevron"
                      aria-hidden="true"
                    />
                  </button>

                  {isOpen && (
                    <div className="faculty-student-affairs-panel">
                      <div
                        className="faculty-student-affairs-content"
                        dangerouslySetInnerHTML={{
                          __html: item.contentHtml,
                        }}
                      />
                    </div>
                  )}
                </section>
              );
            })
          ) : (
            <div
              className="faculty-student-affairs-empty"
              dangerouslySetInnerHTML={{
                __html:
                  parsed.cleanedHtml ||
                  `<p>${
                    t("noContent")
                  }</p>`,
              }}
            />
          )}
        </div>
      </article>
    );
  }

  if (articleType === "video") {
    const video = parsed.videoLinks[0];

    return (
      <article className="faculty-article-card faculty-article-video-card">
        <div className="faculty-article-card-head">
          <span className="faculty-article-card-icon">
            <i className="fa-solid fa-play" />
          </span>
          <h2>{article.title}</h2>
        </div>

        <div className="faculty-article-video-wrap">
          <video controls src={video.href} className="faculty-article-video">
            {t("videoNotSupported")}
          </video>
        </div>

        <a
          href={video.href}
          target="_blank"
          rel="noopener noreferrer"
          className="faculty-article-main-action"
        >
          {t("openVideo")}
        </a>
      </article>
    );
  }

  if (articleType === "file") {
    const file = parsed.fileLinks[0];
    const fileLabel = getFileLabel(file.extension);
    const isPdfFile = file.extension.toLowerCase() === "pdf";

    return (
      <div className="faculty-pdf-page-content">
        <article className="faculty-pdf-card">
          <div className="faculty-pdf-illustration" aria-hidden="true">
            <div className="faculty-pdf-illustration-circle">
              <div className="faculty-pdf-document">
                <span className="faculty-pdf-label">{fileLabel}</span>
                <i
                  className={
                    isPdfFile
                      ? "fa-solid fa-file-pdf"
                      : "fa-solid fa-file-lines"
                  }
                />
              </div>
            </div>
          </div>

          <div className="faculty-pdf-details">
            <div className="faculty-pdf-header">
              <span className="faculty-pdf-header-icon" aria-hidden="true">
                <i className="fa-regular fa-file-lines" />
              </span>

              <div className="faculty-pdf-heading">
                <h2>{article.title}</h2>
                <span className="faculty-pdf-heading-line" />
              </div>
            </div>

            <div className="faculty-pdf-type">
              <span>{t("fileType")}</span>
              <strong>{fileLabel}</strong>
              <i className="fa-regular fa-file-lines" aria-hidden="true" />
            </div>

            <div className="faculty-pdf-actions">
              <a
                href={file.href}
                target="_blank"
                rel="noopener noreferrer"
                className="faculty-pdf-view-button"
              >
                <i className="fa-regular fa-eye" aria-hidden="true" />
                <span>{t("viewFile")}</span>
              </a>

              <a
                href={file.href}
                download
                className="faculty-pdf-download-button"
              >
                <i className="fa-solid fa-download" aria-hidden="true" />
                <span>{t("downloadFile")}</span>
              </a>
            </div>
          </div>
        </article>

        <div className="faculty-pdf-note">
          <i className="fa-solid fa-circle-info" aria-hidden="true" />
          <p>
            {t("pdfNote")}
          </p>
        </div>
      </div>
    );
  }

  if (articleType === "profile") {
    const image = parsed.images[0];

    return (
      <article className="faculty-article-card faculty-article-profile-card">
        <div className="faculty-article-profile-image-wrap">
          <img
            src={image.src}
            alt={image.alt || article.title}
            className="faculty-article-profile-image"
          />
        </div>

        <div className="faculty-article-profile-content">
          <h2>{article.title}</h2>
          <div
            className="faculty-article-html faculty-article-profile-html"
            dangerouslySetInnerHTML={{ __html: parsed.htmlWithoutImages }}
          />
        </div>
      </article>
    );
  }

  if (articleType === "image") {
    return (
      <article className="faculty-article-card faculty-article-image-card">
        <div className="faculty-article-card-head">
          <span className="faculty-article-card-icon">
            <i className="fa-solid fa-image" />
          </span>
          <h2>{article.title}</h2>
        </div>

        <div className="faculty-article-images-grid">
          {parsed.images.map((image, index) => (
            <img
              key={`${image.src}-${index}`}
              src={image.src}
              alt={image.alt || article.title}
              className="faculty-article-image"
            />
          ))}
        </div>
      </article>
    );
  }

  return (
    <article className="faculty-article-card faculty-article-default-card">
      <div className="faculty-article-card-head">
        <span className="faculty-article-card-icon">
          <i className="fa-solid fa-align-right" />
        </span>
        <h2>{article.title}</h2>
      </div>

      <div
        className="faculty-article-html"
        dangerouslySetInnerHTML={{
          __html:
            parsed.cleanedHtml ||
            `<p>${t("noContent")}</p>`,
        }}
      />
    </article>
  );
};
const FacultyArticlePage: React.FC<{
  article: FacultyArticlePageData | null;
  loading: boolean;
  error: string;
  isArabic: boolean;
  isRTL: boolean;
  fac?: string;
}> = ({ article, loading, error, isArabic, isRTL }) => {
  const { t } = useTranslation("FacultyNews");

  const parsedArticle = useMemo(
    () => parseArticleContent(article?.content || ""),
    [article?.content],
  );

  const isHistoryPage = Boolean(
    article && isHistoricalOverviewArticle(article.title),
  );

  const isGoalsPage = Boolean(article && isGoalsArticle(article.title));

  const isFilePage = Boolean(article && parsedArticle.fileLinks.length > 0);

  const isStudentAffairsPage = Boolean(
    article && isStudentAffairsAccordionArticle(article.title),
  );
  const isVisionMissionPage = Boolean(
  article && isVisionMissionArticle(article.title, article.content || ""),
);

const specialPageClass = isHistoryPage
  ? "faculty-history-page-section"
  : isGoalsPage
    ? "faculty-goals-page-section"
    : isVisionMissionPage
      ? "faculty-vision-mission-page-section"
      : isFilePage
        ? "faculty-pdf-page-section"
        : isStudentAffairsPage
          ? "faculty-student-affairs-page-section"
          : "";

  const shouldShowExternalTitle =
    Boolean(article) && (isHistoryPage || isGoalsPage || isFilePage);

  return (
    <section
      className={`faculty-article-section ${specialPageClass}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="faculty-article-wrapper">
        {shouldShowExternalTitle && (
          <div
            className={`faculty-section-heading faculty-special-page-title ${
              isHistoryPage ? "faculty-history-page-title" : ""
            }`}
            dir={isRTL ? "rtl" : "ltr"}
          >
            <span className="faculty-section-dot" />
            <h1 className="faculty-section-title">
              {article?.title ||
                t("facultyContent")}
            </h1>
          </div>
        )}

        {loading ? (
          <div className="faculty-article-card faculty-article-loading-card">
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line" />
            <div className="skeleton skeleton-line short" />
          </div>
        ) : error ? (
          <div className="faculty-article-card faculty-article-error-card">
            <h2>
              {t("couldNotLoadContent")}
            </h2>
            <p>{error}</p>
          </div>
        ) : article ? (
          <FacultyArticleRenderer article={article} isArabic={isArabic} />
        ) : (
          <div className="faculty-article-card faculty-article-error-card">
            <h2>{t("noContent")}</h2>
          </div>
        )}
      </div>
    </section>
  );
};

const FacultyNews: React.FC = () => {
  const { fac } = useParams<{ fac: string }>();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { t, i18n } = useTranslation("FacultyNews");

  const currentLangCode = useMemo(
    () => getCurrentLanguageCode(i18n.language),
    [i18n.language],
  );
  const langId = useMemo(
    () => getLanguageIdByCode(currentLangCode),
    [currentLangCode],
  );
  const currentLocale = useMemo(
    () => getLocaleByLangCode(currentLangCode),
    [currentLangCode],
  );
  const isArabic = currentLangCode === "ar";
  const isRTL = RTL_LANGUAGE_CODES.has(currentLangCode);

  const articleIdParam = searchParams.get("articleId");
  const invalidArticleId = Boolean(
    articleIdParam && !/^\d+$/.test(articleIdParam),
  );
  const articleId =
    articleIdParam && /^\d+$/.test(articleIdParam)
      ? Number(articleIdParam)
      : null;
  const isArticleMode = Boolean(articleIdParam);

  const isFacShapeValid = Boolean(fac && /^\d+$/.test(String(fac)));

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstSearchRender = useRef(true);

  const [collegeNameFallback, setCollegeNameFallback] = useState<string>(
    String(location.state?.collegeName || location.state?.facultyTitle || ""),
  );
  const [collegeName, setCollegeName] = useState<string>(
    String(location.state?.collegeName || location.state?.facultyTitle || ""),
  );
  const [collegeData, setCollegeData] = useState<any | null>(null);
  const [collegeLogos, setCollegeLogos] = useState<CollegeLogoItem[]>([]);
  const [collegeLogoUrl, setCollegeLogoUrl] = useState<string>("");

  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [highlights, setHighlights] = useState<HighlightItem[]>([]);
  const [highlightsLoading, setHighlightsLoading] = useState(false);
  const [activeHighlightIndex, setActiveHighlightIndex] = useState(0);

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [pageIndex, setPageIndex] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [moveNext, setMoveNext] = useState(false);
  const [movePrevious, setMovePrevious] = useState(false);

  const [showFilters, setShowFilters] = useState(false);
  const [dateFilter, setDateFilter] = useState<number>(0);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [activeFiltersCount, setActiveFiltersCount] = useState(0);

  const [facultyMenu, setFacultyMenu] = useState<FacultyMenuItem[]>([]);
const [facultyMenuLoading, setFacultyMenuLoading] = useState(false);
  const [articlePage, setArticlePage] = useState<FacultyArticlePageData | null>(
    null,
  );
  const [articleLoading, setArticleLoading] = useState(false);
  const [articleError, setArticleError] = useState("");

  const [notFound, setNotFound] = useState(false);
  const [articleNotFound, setArticleNotFound] = useState(false);

  const orderedFacultyMenu = useMemo(() => {
  return sortFacultyMenuForTopNav(facultyMenu);
}, [facultyMenu]);

const {
  currentRow: visibleFacultyMenu,
  canGoNext: canGoNextFacultyMenuRow,
  canGoPrevious: canGoPreviousFacultyMenuRow,
  goNext: handleNextFacultyMenuRow,
  goPrevious: handlePreviousFacultyMenuRow,
} = useFacultyMenuRows(orderedFacultyMenu);

const footerMenuGroups = useMemo(
  () =>
    buildFooterMenuGroups(orderedFacultyMenu, isArabic, {
      onlyFooterGroups: true,
    }),
  [orderedFacultyMenu, isArabic],
);

  useEffect(() => {
    let count = 0;

    if (dateFilter !== 0) count++;
    if (fromDate) count++;
    if (toDate) count++;

    setActiveFiltersCount(count);
  }, [dateFilter, fromDate, toDate]);

  useEffect(() => {
    let isMounted = true;

    const fetchCollegeName = async () => {
      const currentLangId = Number(langId) || 1;
      const facultyCode = Number(fac);

      setPageIndex(1);
      setSearch("");
      setSearchInput("");
      setDateFilter(0);
      setFromDate("");
      setToDate("");
      setActiveHighlightIndex(0);
      setNotFound(false);
      setArticleNotFound(false);

      if (!fac || !facultyCode || !/^\d+$/.test(String(fac))) {
        setCollegeName("");
        setCollegeNameFallback("");
        setCollegeData(null);
        setNotFound(true);
        setLoading(false);
        setHighlightsLoading(false);
        setFacultyMenuLoading(false);
        return;
      }

      try {
        const response = await newsService.getColleges(currentLangId);
        const colleges = normalizeApiResponse(response);

        let matchedCollege = findCollegeByFacultyCode(colleges, facultyCode);

        if (!matchedCollege && currentLangId !== 1) {
          const fallbackResponse = await newsService.getColleges(1);
          const fallbackColleges = normalizeApiResponse(fallbackResponse);
          matchedCollege = findCollegeByFacultyCode(fallbackColleges, facultyCode);
        }

        if (!isMounted) return;

        if (!matchedCollege) {
          setCollegeName("");
          setCollegeNameFallback("");
          setCollegeData(null);
          setNotFound(true);
          setLoading(false);
          setHighlightsLoading(false);
          setFacultyMenuLoading(false);
          return;
        }

        setNotFound(false);
        setCollegeData(matchedCollege);
        setCollegeName(matchedCollege.title || "");

        if (currentLangId !== 2) {
          const enResponse = await newsService.getColleges(2);
          const enColleges = normalizeApiResponse(enResponse);
          const enMatch = findCollegeByFacultyCode(enColleges, facultyCode);

          if (!isMounted) return;

          setCollegeNameFallback(enMatch?.title || matchedCollege.title || "");
        } else {
          setCollegeNameFallback(matchedCollege.title || "");
        }
      } catch (error) {
        console.error("Failed to fetch college name:", error);

        if (isMounted) {
          setCollegeName("");
          setCollegeNameFallback("");
          setCollegeData(null);
          setNotFound(true);
          setLoading(false);
          setHighlightsLoading(false);
          setFacultyMenuLoading(false);
        }
      }
    };

    fetchCollegeName();

    return () => {
      isMounted = false;
    };
  }, [fac, langId]);

  useEffect(() => {
    let isMounted = true;

    const fetchCollegeLogos = async () => {
      const currentLangId = Number(langId) || 1;
      const logoLangIds = Array.from(new Set([currentLangId, 1]));

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

          return Array.isArray(response.value?.result)
            ? response.value.result
            : [];
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
        console.error("Failed to fetch colleges logos:", error);

        if (isMounted) {
          setCollegeLogos([]);
        }
      }
    };

    fetchCollegeLogos();

    return () => {
      isMounted = false;
    };
  }, [langId]);

  useEffect(() => {
    const currentCollegeName = collegeName || collegeNameFallback;

    if ((!collegeData && !currentCollegeName) || collegeLogos.length === 0) {
      setCollegeLogoUrl("");
      return;
    }

    const matchedLogoUrl = getCollegeLogoForCollege(
      collegeData,
      collegeLogos,
      currentCollegeName,
    );

    setCollegeLogoUrl(matchedLogoUrl || "");
  }, [collegeData, collegeName, collegeNameFallback, collegeLogos]);

  useEffect(() => {
    let isMounted = true;

    const fetchFacultyMenu = async () => {
      const facultyCode = Number(fac);

      if (!facultyCode || !langId || notFound) {
        setFacultyMenu([]);
        setFacultyMenuLoading(false);
        return;
      }

      setFacultyMenuLoading(true);

      try {
        const response = await newsService.getSectorMenu({
          keyword: String(facultyCode),
          lang: Number(langId) || 1,
        });

        if (!isMounted) return;

        const cleanMenu = sanitizeFacultyMenuItems(
          normalizeApiResponse(response),
        );

        setFacultyMenu(cleanMenu);
      } catch (error) {
        console.error("Failed to fetch faculty menu:", error);

        if (isMounted) {
          setFacultyMenu([]);
        }
      } finally {
        if (isMounted) {
          setFacultyMenuLoading(false);
        }
      }
    };

    fetchFacultyMenu();

    return () => {
      isMounted = false;
    };
  }, [fac, langId, notFound]);

  useEffect(() => {
    let isMounted = true;

    const fetchArticlePage = async () => {
      if (invalidArticleId) {
        setArticlePage(null);
        setArticleError("");
        setArticleNotFound(true);
        setArticleLoading(false);
        return;
      }

      if (!articleId) {
        setArticlePage(null);
        setArticleError("");
        setArticleNotFound(false);
        setArticleLoading(false);
        return;
      }

      if (notFound) {
        setArticlePage(null);
        setArticleError("");
        setArticleNotFound(false);
        setArticleLoading(false);
        return;
      }

      setArticleLoading(true);
      setArticleError("");
      setArticleNotFound(false);

      try {
        const response = await newsService.getSectorPage({
          articleId,
          lang: Number(langId) || 1,
        });

        if (!isMounted) return;

        if (response?.result) {
          setArticlePage(response.result);
          setArticleNotFound(false);
          window.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          setArticlePage(null);
          setArticleNotFound(true);
        }
      } catch (error) {
        console.error("Failed to fetch faculty article page:", error);

        if (isMounted) {
          setArticlePage(null);
          setArticleError("");
          setArticleNotFound(true);
        }
      } finally {
        if (isMounted) {
          setArticleLoading(false);
        }
      }
    };

    fetchArticlePage();

    return () => {
      isMounted = false;
    };
  }, [articleId, langId, invalidArticleId, notFound]);

  const getSearchLangId = useCallback(
    (_term: string) => Number(langId) || 1,
    [langId],
  );

  const getActiveSearchLangId = () => Number(langId) || 1;

  const fetchHighlights = useCallback(async () => {
    const facultyCode = Number(fac);

    if (notFound) {
      setHighlights([]);
      setHighlightsLoading(false);
      return;
    }

    if (isArticleMode) {
      setHighlights([]);
      setHighlightsLoading(false);
      return;
    }

    if (!facultyCode || !langId) {
      setHighlights([]);
      setHighlightsLoading(false);
      return;
    }

    const activeLangId = getSearchLangId(search);
    setHighlightsLoading(true);

    try {
      const data = await newsService.getHighlights({
        fac: facultyCode,
        langId: activeLangId,
        pageIndex: 1,
        pageSize: 10,
        search,
        ...(fromDate ? { fromDate } : {}),
        ...(toDate ? { toDate } : {}),
      });

      const result: HighlightItem[] = Array.isArray(data?.result)
        ? data.result
        : [];

      setHighlights(result);
      setActiveHighlightIndex(0);
    } catch (error) {
      console.error("Failed to fetch faculty highlights:", error);
      setHighlights([]);
      setActiveHighlightIndex(0);
    } finally {
      setHighlightsLoading(false);
    }
  }, [
    fac,
    langId,
    search,
    fromDate,
    toDate,
    getSearchLangId,
    isArticleMode,
    notFound,
  ]);

  const fetchNews = useCallback(async () => {
    const facultyCode = Number(fac);

    if (notFound) {
      setNews([]);
      setMoveNext(false);
      setMovePrevious(false);
      setLoading(false);
      return;
    }

    if (isArticleMode) {
      setNews([]);
      setMoveNext(false);
      setMovePrevious(false);
      setLoading(false);
      return;
    }

    if (!facultyCode || !langId) {
      setNews([]);
      setMoveNext(false);
      setMovePrevious(false);
      setLoading(false);
      return;
    }

    const activeLangId = getSearchLangId(search);
    setLoading(true);

    try {
      const data = await newsService.getFacultyNews({
        fac: facultyCode,
        langId: activeLangId,
        departmentCode: "",
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

      const totalFromApi =
        Number(data?.totalPages) ||
        Number(data?.pageCount) ||
        (Number(data?.totalCount)
          ? Math.ceil(Number(data.totalCount) / ITEMS_PER_PAGE)
          : 0);

      setTotalPages(
        totalFromApi || (data?.moveNext ? pageIndex + 1 : pageIndex),
      );
    } catch (error) {
      console.error("Failed to fetch faculty news:", error);

      setNews([]);
      setMoveNext(false);
      setMovePrevious(false);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [
    fac,
    langId,
    pageIndex,
    search,
    dateFilter,
    fromDate,
    toDate,
    getSearchLangId,
    isArticleMode,
    notFound,
  ]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  useEffect(() => {
    fetchHighlights();
  }, [fetchHighlights]);

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

  useEffect(() => {
    if (highlights.length <= 1) return;

    const timer = setInterval(() => {
      setActiveHighlightIndex((prev) =>
        prev === highlights.length - 1 ? 0 : prev + 1,
      );
    }, 5000);

    return () => clearInterval(timer);
  }, [highlights.length]);

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

  const handleClearAllFilters = () => {
    setDateFilter(0);
    setFromDate("");
    setToDate("");
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

  const handleNextHighlight = () => {
    if (highlights.length <= 1) return;

    setActiveHighlightIndex((prev) =>
      prev === highlights.length - 1 ? 0 : prev + 1,
    );
  };

  const handlePrevHighlight = () => {
    if (highlights.length <= 1) return;

    setActiveHighlightIndex((prev) =>
      prev === 0 ? highlights.length - 1 : prev - 1,
    );
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";

    return new Date(dateStr).toLocaleDateString(currentLocale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const highlightText = (text = "", term = "") => {
    if (!term || !text) return text;

    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escapedTerm})`, "gi");

    return text.split(regex).map((part, index) =>
      part.toLowerCase() === term.toLowerCase() ? (
        <span key={index} className="highlight">
          {part}
        </span>
      ) : (
        part
      ),
    );
  };

  const activeHighlight = highlights[activeHighlightIndex];
  const displayName = collegeName || collegeNameFallback || "...";

  const paginationNumbers = useMemo<(number | "...")[]>(() => {
    if (totalPages <= 6) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (pageIndex <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }

    if (pageIndex >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    return [
      1,
      "...",
      pageIndex - 1,
      pageIndex,
      pageIndex + 1,
      "...",
      totalPages,
    ];
  }, [pageIndex, totalPages]);

  if (!isFacShapeValid || notFound || articleNotFound || invalidArticleId) {
    return <ErrorPage />;
  }

  return (
    <div className="news-page-wrapper faculty-page-wrapper">
      <header
        className="faculty-top-header"
        style={{ backgroundImage: `url(${headerBg})` }}
        dir="rtl"
      >
        <div className="faculty-top-header-overlay" />

        <div className="faculty-top-header-inner">
          <button
            type="button"
            className="faculty-back-btn"
            onClick={() => window.history.back()}
            aria-label={t("backToUniversity")}
          >
            <i className="fa-solid fa-chevron-right"></i>
            <span>
              {t("backToUniversity")}
            </span>
          </button>

          <div className="faculty-top-brand">
            <div className="faculty-top-brand-text">
              <h2 className="faculty-top-college-name">{displayName}</h2>
              <p className="faculty-top-university-name">
                {t("universityName")}
              </p>
            </div>

            <div className="faculty-top-logo-wrap">
              <img
                src={collegeLogoUrl || logo}
                alt={displayName || "faculty logo"}
                className="faculty-top-logo"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = logo;
                }}
              />
            </div>
          </div>
        </div>
      </header>

      <section className="faculty-menu-section" dir={isRTL ? "rtl" : "ltr"}>
        <div className="faculty-menu-wrapper">
          {facultyMenuLoading ? (
            <div className="faculty-menu-loading">
              {t("loadingMenu")}
            </div>
          ) : visibleFacultyMenu.length > 0 ? (
            <div className="faculty-menu-shell">
              <button
                type="button"
                className="faculty-menu-page-btn faculty-menu-page-btn-prev"
                onClick={handlePreviousFacultyMenuRow}
                disabled={!canGoPreviousFacultyMenuRow}
                aria-label={t("previousMenuRow")}
              >
                {isRTL ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </button>

              <div
  className="faculty-menu-bar"
  style={
    {
      "--faculty-nav-count": Math.max(
        visibleFacultyMenu.length,
        1,
      ),
    } as React.CSSProperties
  }
>
  {visibleFacultyMenu.map((item) => (
    <FacultyMenuItemView
      key={item.menuId}
      item={item}
      fac={fac}
      facultyTitle={displayName}
    />
  ))}
</div>

              <button
                type="button"
                className="faculty-menu-page-btn faculty-menu-page-btn-next"
                onClick={handleNextFacultyMenuRow}
                disabled={!canGoNextFacultyMenuRow}
                aria-label={t("nextMenuRow")}
              >
                {isRTL ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
              </button>

            </div>
          ) : null}
        </div>
      </section>

      {isArticleMode ? (
        <FacultyArticlePage
          article={articlePage}
          loading={articleLoading}
          error={articleError}
          isArabic={isArabic}
          isRTL={isRTL}
          fac={fac}
        />
      ) : (
        <>
          <section className="faculty-news-hero">
            <div className="news-hero-content">
              {highlightsLoading ? (
                <div className="faculty-highlight-slider skeleton-highlight" />
              ) : activeHighlight ? (
                <div className="faculty-highlight-slider">
                  <div className="faculty-highlight-image-wrap">
                    <Link
                      to={`/fac/${fac}/highlight/${activeHighlight.id}?lang=${getActiveSearchLangId()}`}
                      state={{
                        highlight: activeHighlight,
                        fac: Number(fac),
                        langId: getActiveSearchLangId(),
                        collegeName: displayName,
                      }}
                      className="faculty-highlight-link"
                      aria-label={
                        activeHighlight.translationData ||
                        displayName ||
                        "Highlight details"
                      }
                    >
                      <SmartImage
                        src={activeHighlight.image}
                        alt={
                          activeHighlight.translationData ||
                          displayName ||
                          "Highlight"
                        }
                        className="faculty-highlight-image"
                      />

                      <div className="faculty-highlight-overlay" />

                      <div className="faculty-highlight-content">
                        <h2>{activeHighlight.translationData}</h2>
                        <span
                          className="faculty-highlight-arrow"
                          aria-hidden="true"
                        >
                          <i className="fa-solid fa-arrow-up"></i>
                        </span>
                      </div>
                    </Link>

                    {highlights.length > 1 && (
                      <>
                        <button
                          type="button"
                          className="faculty-highlight-nav faculty-highlight-prev"
                          onClick={handlePrevHighlight}
                          aria-label={t("previousHighlight")}
                        >
                          <ChevronLeft size={26} strokeWidth={2.6} />
                        </button>

                        <button
                          type="button"
                          className="faculty-highlight-nav faculty-highlight-next"
                          onClick={handleNextHighlight}
                          aria-label={t("nextHighlight")}
                        >
                          <ChevronRight size={26} strokeWidth={2.6} />
                        </button>
                      </>
                    )}

                    {highlights.length > 1 && (
                      <div className="faculty-highlight-dots">
                        {highlights.map((item, index) => (
                          <button
                            key={item.id || index}
                            type="button"
                            className={`faculty-highlight-dot ${
                              index === activeHighlightIndex ? "active" : ""
                            }`}
                            onClick={() => setActiveHighlightIndex(index)}
                            aria-label={t("goToHighlight", { number: index + 1 })}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}

              <div className="news-search-wrapper">
                <div className="news-search-bar">
                  <button
                    type="button"
                    className="news-search-icon-btn"
                    onClick={handleManualSearch}
                    aria-label={t("search")}
                  >
                    <i className="fa-solid fa-magnifying-glass"></i>
                  </button>

                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
                    placeholder={t("searchFacultyNews")}
                  />

                  {searchInput && (
                    <button
                      type="button"
                      className="news-clear-btn"
                      onClick={handleClearSearch}
                      aria-label={t("clearSearch")}
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
                    aria-label={t("toggleFilters")}
                  >
                    <i className="fa-solid fa-sliders"></i>
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
                    dir={isRTL ? "rtl" : "ltr"}
                  >
                    <div className="filter-panell-body">
                      <div
                        className="filter-section filterr-dates"
                        style={{ width: "100%" }}
                      >
                        <span className="filterr-labell">
                          <Calendar size={13} />
                          {t("customRange")}
                        </span>

                        <div className="filter-date-inputs">
                          <div className="date-input-wrap">
                            <label>{t("from")}</label>
                            <input
                              type="date"
                              value={fromDate}
                              onChange={(e) => handleFromDate(e.target.value)}
                              max={toDate || undefined}
                            />
                          </div>

                          <span className="date-separator">—</span>

                          <div className="date-input-wrap">
                            <label>{t("to")}</label>
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
                          {t("quickFilter")}
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
                              {t(filter.labelKey)}
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
                          {t("clearFilters")}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {activeFiltersCount > 0 && (
                <div className="news-active-filters">
                  {dateFilter !== 0 && (
                    <span className="active-tag">
                      {t(
                        DATE_FILTERS.find(
                          (filter) => filter.value === dateFilter,
                        )?.labelKey || "allNews",
                      )}

                      <button onClick={() => setDateFilter(0)}>
                        <X size={11} />
                      </button>
                    </span>
                  )}

                  {fromDate && (
                    <span className="active-tag">
                      {t("fromWithColon")}
                      {fromDate}
                      <button onClick={() => setFromDate("")}>
                        <X size={11} />
                      </button>
                    </span>
                  )}

                  {toDate && (
                    <span className="active-tag">
                      {t("toWithColon")}
                      {toDate}
                      <button onClick={() => setToDate("")}>
                        <X size={11} />
                      </button>
                    </span>
                  )}
                </div>
              )}

              {search && (
                <div className="news-search-status">
                  <span>{t("resultsFor")}</span>
                  <strong>{search}</strong>
                </div>
              )}
            </div>
          </section>

          <section className="news-main-content" dir={isRTL ? "rtl" : "ltr"}>
            <div className="news-content-wrapper">
              <div
                className="faculty-section-heading"
                dir={isRTL ? "rtl" : "ltr"}
              >
                <span className="faculty-section-dot" />
                <h2 className="faculty-section-title">
                  {t("newsAndEvents")}
                </h2>
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
                  <h2>{t("noResults")}</h2>
                </div>
              ) : (
                <div className="news-cards-grid">
                  {news.map((item) => (
                    <article key={item.id} className="news-card">
                      <Link
                        to={`/fac/${fac}/details/${item.id}?lang=${getActiveSearchLangId()}`}
                        state={{
                          news: item,
                          newsType: "faculty",
                          fac: Number(fac),
                          langId: getActiveSearchLangId(),
                          collegeName: displayName,
                        }}
                        className="news-card-link"
                      >
                        <div className="news-card-text">
                          <h3 className="news-card-title">
                            {highlightText(item.title?.slice(0, 95), search)}
                          </h3>

                          <p className="news-card-description">
                            {highlightText(
                              item.source?.slice(0, 120) || "",
                              search,
                            )}
                          </p>

                          <span className="news-card-date">
                            {formatDate(item.currentDate || item.date)}
                          </span>
                        </div>

                        <div className="news-card-image">
                          <SmartImage
                            src={item.image}
                            alt={item.imageAlt || item.title || "Faculty news"}
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
                  <div className="news-pagination-pages">
                    <button
                      type="button"
                      className="news-pagination-arrow"
                      onClick={() =>
                        setPageIndex((prev) => Math.max(1, prev - 1))
                      }
                      disabled={!movePrevious || loading}
                      aria-label={t("previousPage")}
                    >
                      <i className="fa-solid fa-chevron-left" />
                    </button>

                    {paginationNumbers.map((page, index) =>
                      page === "..." ? (
                        <span
                          key={`dots-${index}`}
                          className="news-pagination-dots"
                        >
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          type="button"
                          className={`news-pagination-number ${
                            pageIndex === page ? "active" : ""
                          }`}
                          onClick={() => {
                            if (!loading) {
                              setPageIndex(page);
                            }
                          }}
                          disabled={loading || pageIndex === page}
                        >
                          {page}
                        </button>
                      ),
                    )}

                    <button
                      type="button"
                      className="news-pagination-arrow"
                      onClick={() => setPageIndex((prev) => prev + 1)}
                      disabled={!moveNext || loading}
                      aria-label={t("nextPage")}
                    >
                      <i className="fa-solid fa-chevron-right" />
                    </button>
                  </div>

                  <div className="news-page-info">
                    <>
                      {t("page")} <strong>{pageIndex}</strong> {t("of")}{" "}
                      <strong>{totalPages}</strong>
                    </>
                  </div>
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
  getItemLink={(item) => getFacultyMenuLink(item as FacultyMenuItem, fac)}
/>
    </div>
  );
};

export default FacultyNews;
