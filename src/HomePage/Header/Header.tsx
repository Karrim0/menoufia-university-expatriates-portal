import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Globe,
  Menu as MenuIcon,
  Palette as PaletteIcon,
  X,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import "./Header.css";
import logo from "../../assets/logo.jpg";
import newsService from "../../Services/newsService";
import { saveLanguage } from "../../utils/language";
import { useTheme } from "../../theme/ThemeContext";

type LanguageItem = {
  code: string;
  name: string;
  id: number;
  flag?: string;
};

type ApiMenuItem = {
  menuId?: number;
  id?: number;
  parentId?: number | null;
  sortOrder?: number;
  title?: string | null;
  label?: string | null;
  articleId?: number | null;
  url?: string | null;
  link?: string | null;
  children?: ApiMenuItem[];
  subMenus?: ApiMenuItem[];
};

type NavMenuItem = {
  key: string;
  label: string;
  link?: string | null;
  children?: NavMenuItem[];
};

type FacultyRouteMaps = {
  byAbbr: Record<string, number>;
  byTitle: Record<string, number>;
};

const EMPTY_FACULTY_ROUTE_MAPS: FacultyRouteMaps = {
  byAbbr: {},
  byTitle: {},
};

const LANGUAGE_ORDER = [
  "ar",
  "en",
  "fr",
  "de",
  "ja",
  "tr",
  "fa",
  "ru",
  "ch",
  "it",
];

const FIXED_LANGUAGES: LanguageItem[] = [
  { code: "ar", name: "عربي", id: 1, flag: "https://flagcdn.com/w40/eg.png" },
  { code: "en", name: "English", id: 2, flag: "https://flagcdn.com/w40/gb.png" },
  { code: "fr", name: "Français", id: 3, flag: "https://flagcdn.com/w40/fr.png" },
  { code: "de", name: "Deutsch", id: 24, flag: "https://flagcdn.com/w40/de.png" },
  { code: "ja", name: "Japanese", id: 23, flag: "https://flagcdn.com/w40/jp.png" },
  { code: "tr", name: "Turkish", id: 25, flag: "https://flagcdn.com/w40/tr.png" },
  { code: "fa", name: "Persian", id: 26, flag: "https://flagcdn.com/w40/ir.png" },
  { code: "ru", name: "Russian", id: 27, flag: "https://flagcdn.com/w40/ru.png" },
  { code: "ch", name: "Chamorro", id: 28, flag: "https://flagcdn.com/w40/mp.png" },
  { code: "it", name: "Italian", id: 29, flag: "https://flagcdn.com/w40/it.png" },
];

const SECTOR_KEYWORDS = ["univpres", "educ", "env", "postgrad", "secr"];

const FACULTY_URL_ALIASES: Record<string, string> = {
  agr: "AGR",
  eng: "ENG",
  fee: "FEE",
  edu: "EDU",
  sci: "SCI",
  com: "COM",
  ai: "AI",
  media: "MEDIA",
  fa: "FA",
  ecedu: "ECEDU",
  pharm: "PHARM",
  vmed: "VMED",
  dent: "DENT",
  mci: "MCI",
  fpe: "FPE",
};

const cleanText = (value?: string | null) =>
  String(value || "").replace(/\s+/g, " ").trim();

const normalizeRouteTitle = (value?: string | null) =>
  cleanText(value)
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[ًٌٍَُِّْ]/g, "")
    .replace(/\s+/g, " ")
    .toLowerCase();

const removeCollegePrefix = (value: string) =>
  value.replace(/^(كليه|كلية|معهد)\s+/i, "").trim();

const isDesktop = () => window.innerWidth > 1100;

const isRtlLang = (code?: string) => code === "ar" || code === "fa";

const sortLanguages = (langs: LanguageItem[]) =>
  [...langs].sort((a, b) => {
    const firstIndex = LANGUAGE_ORDER.indexOf(a.code);
    const secondIndex = LANGUAGE_ORDER.indexOf(b.code);

    return (
      (firstIndex === -1 ? 999 : firstIndex) -
      (secondIndex === -1 ? 999 : secondIndex)
    );
  });

const getSavedLang = (): LanguageItem => {
  try {
    return JSON.parse(localStorage.getItem("lang") || '{"code":"ar","id":1}');
  } catch {
    return { code: "ar", name: "عربي", id: 1 };
  }
};

const isValidArticleId = (value: unknown) => {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue > 0;
};

const normalizeApiResponse = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.result)) return data.data.result;

  return [];
};

const getApiFac = (item: any): number | null => {
  const possibleCodes = [
    item?.fac,
    item?.Fac,
    item?.publicCode,
    item?.PublicCode,
    item?.facCode,
    item?.FacCode,
    item?.facultyCode,
    item?.FacultyCode,
  ];

  for (const possibleCode of possibleCodes) {
    const numericCode = Number(possibleCode);

    if (Number.isFinite(numericCode) && numericCode > 0) {
      return numericCode;
    }
  }

  return null;
};

const getPathFromUrl = (url?: string | null) => {
  const value = cleanText(url);

  if (!value || value === "#") return "";

  try {
    return new URL(value).pathname;
  } catch {
    return value.startsWith("/") ? value : `/${value}`;
  }
};

const extractFacultyAbbrFromUrl = (url?: string | null) => {
  const path = getPathFromUrl(url);
  const segments = path.split("/").filter(Boolean);

  const portalIndex = segments.findIndex(
    (segment) => segment.toLowerCase() === "portal",
  );

  if (portalIndex !== -1) {
    const possibleCode = segments[portalIndex + 1];
    const lowerCode = possibleCode?.toLowerCase();

    if (possibleCode && lowerCode !== "view" && lowerCode !== "webform2") {
      return possibleCode.toUpperCase();
    }
  }

  const firstSegment = segments[0]?.toLowerCase();

  if (firstSegment && FACULTY_URL_ALIASES[firstSegment]) {
    return FACULTY_URL_ALIASES[firstSegment].toUpperCase();
  }

  return "";
};

const getApiFacultyAbbr = (item: any) => {
  const abbrFromUrl = extractFacultyAbbrFromUrl(item?.url || item?.link);

  if (abbrFromUrl) return abbrFromUrl;

  const possibleAbbrs = [
    item?.abbr,
    item?.Abbr,
    item?.facultyAbbr,
    item?.FacultyAbbr,
    item?.facAbbr,
    item?.FacAbbr,
    item?.code,
    item?.Code,
  ];

  for (const possibleAbbr of possibleAbbrs) {
    const value = cleanText(possibleAbbr);

    if (!value || /^\d+$/.test(value)) continue;

    return value.toUpperCase();
  }

  return "";
};

const buildFacultyRouteMaps = (colleges: any[]): FacultyRouteMaps => {
  const maps: FacultyRouteMaps = {
    byAbbr: {},
    byTitle: {},
  };

  colleges.forEach((college) => {
    const fac = getApiFac(college);

    if (!fac) return;

    const abbr = getApiFacultyAbbr(college);
    const title = normalizeRouteTitle(
      college?.title ||
        college?.name ||
        college?.collegeName ||
        college?.facultyName,
    );

    if (abbr) {
      maps.byAbbr[abbr] = fac;
    }

    if (title) {
      maps.byTitle[title] = fac;
    }
  });

  return maps;
};

const getFacultyFacByTitle = (
  title?: string | null,
  facultyRouteMaps: FacultyRouteMaps = EMPTY_FACULTY_ROUTE_MAPS,
) => {
  const normalizedTitle = normalizeRouteTitle(title);

  if (!normalizedTitle) return null;

  const directFac = facultyRouteMaps.byTitle[normalizedTitle];

  if (directFac) return directFac;

  const comparableTitle = removeCollegePrefix(normalizedTitle);

  if (!comparableTitle || comparableTitle.length < 3) return null;

  const matchedEntry = Object.entries(facultyRouteMaps.byTitle).find(
    ([savedTitle]) => {
      const comparableSavedTitle = removeCollegePrefix(savedTitle);

      return (
        comparableSavedTitle === comparableTitle ||
        comparableSavedTitle.includes(comparableTitle) ||
        comparableTitle.includes(comparableSavedTitle)
      );
    },
  );

  return matchedEntry?.[1] || null;
};

const getSectorLink = (url?: string | null) => {
  const path = getPathFromUrl(url).toLowerCase();
  const segments = path.split("/").filter(Boolean);

  const matchedKeyword = segments.find((segment) =>
    SECTOR_KEYWORDS.includes(segment),
  );

  return matchedKeyword ? `/university-sectors/${matchedKeyword}` : null;
};

const getFacultyLink = (
  item: ApiMenuItem,
  facultyRouteMaps: FacultyRouteMaps = EMPTY_FACULTY_ROUTE_MAPS,
) => {
  const abbr = extractFacultyAbbrFromUrl(item.url || item.link);

  if (abbr && facultyRouteMaps.byAbbr[abbr]) {
    return `/fac/${facultyRouteMaps.byAbbr[abbr]}`;
  }

  const facByTitle = getFacultyFacByTitle(
    item.title || item.label,
    facultyRouteMaps,
  );

  if (facByTitle) {
    return `/fac/${facByTitle}`;
  }

  return null;
};

const getKnownInternalLink = (item: ApiMenuItem) => {
  const title = cleanText(item.title || item.label).toLowerCase();
  const url = cleanText(item.url || item.link).toLowerCase();

  if (title.includes("اتصل") || title.includes("contact")) {
    return "/contactUs";
  }

  if (
    title.includes("خبر") ||
    title.includes("news") ||
    title.includes("media") ||
    title.includes("الإعلام") ||
    url.includes("univ_news")
  ) {
    return "/news";
  }

  if (title.includes("برنامج") || title.includes("program")) {
    return "/colleges-programs";
  }

  return null;
};

const resolveInternalLink = (
  item: ApiMenuItem,
  facultyRouteMaps: FacultyRouteMaps = EMPTY_FACULTY_ROUTE_MAPS,
) => {
  const sectorLink = getSectorLink(item.url || item.link);
  if (sectorLink) return sectorLink;

  const facultyLink = getFacultyLink(item, facultyRouteMaps);
  if (facultyLink) return facultyLink;

  const knownLink = getKnownInternalLink(item);
  if (knownLink) return knownLink;

  if (isValidArticleId(item.articleId)) {
    return `/university-page/${Number(item.articleId)}`;
  }

  return null;
};

const getChildrenSource = (item: ApiMenuItem) => {
  if (Array.isArray(item.children)) return item.children;
  if (Array.isArray(item.subMenus)) return item.subMenus;
  return [];
};

const mapApiMenuItem = (
  item: ApiMenuItem,
  facultyRouteMaps: FacultyRouteMaps = EMPTY_FACULTY_ROUTE_MAPS,
): NavMenuItem | null => {
  const label = cleanText(item.title || item.label);

  if (!label) return null;

  const rawChildren = getChildrenSource(item)
    .filter((child) => child && typeof child === "object")
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0));

  const children = rawChildren
    .map((child) => mapApiMenuItem(child, facultyRouteMaps))
    .filter(Boolean) as NavMenuItem[];

  const link =
    rawChildren.length > 0 ? null : resolveInternalLink(item, facultyRouteMaps);

  if (!link && children.length === 0) return null;

  return {
    key: String(
      item.menuId ??
        item.id ??
        `${label}-${item.articleId ?? cleanText(item.url || item.link)}`,
    ),
    label,
    link,
    ...(children.length > 0 ? { children } : {}),
  };
};

const hasLinkDeep = (items: NavMenuItem[], link: string): boolean => {
  return items.some((item) => {
    if (item.link === link) return true;
    return item.children ? hasLinkDeep(item.children, link) : false;
  });
};

const buildNavItems = (
  apiItems: ApiMenuItem[],
  t: any,
  facultyRouteMaps: FacultyRouteMaps = EMPTY_FACULTY_ROUTE_MAPS,
): NavMenuItem[] => {
  const dynamicItems = apiItems
    .filter((item) => item && typeof item === "object")
    .sort((a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0))
    .map((item) => mapApiMenuItem(item, facultyRouteMaps))
    .filter(Boolean) as NavMenuItem[];

  const contactItem: NavMenuItem = {
    key: "contact-static",
    label: t("nav.contact"),
    link: "/contactUs",
  };

  return [
    {
      key: "home-static",
      label: t("nav.home"),
      link: "/",
    },
    ...dynamicItems,
    ...(hasLinkDeep(dynamicItems, "/contactUs") ? [] : [contactItem]),
  ];
};

const fallbackNavItems = (t: any): NavMenuItem[] => [
  {
    key: "home-static",
    label: t("nav.home"),
    link: "/",
  },
  {
    key: "programs-static",
    label: t("nav.programs"),
    link: "/colleges-programs",
  },
  {
    key: "news-static",
    label: t("nav.newsEvents"),
    link: "/news",
  },
  {
    key: "contact-static",
    label: t("nav.contact"),
    link: "/contactUs",
  },
];

const isItemActive = (item: NavMenuItem, pathname: string): boolean => {
  if (item.link === "/") {
    return pathname === "/";
  }

  if (item.link) {
    return pathname === item.link || pathname.startsWith(`${item.link}/`);
  }

  if (!item.children?.length) {
    return false;
  }

  return item.children.some((child) => {
    if (child.link === "/") return false;
    return isItemActive(child, pathname);
  });
};

const getMaxScroll = (scroller: HTMLDivElement) =>
  Math.max(0, scroller.scrollWidth - scroller.clientWidth);

const MenuLink = ({
  item,
  className,
}: {
  item: NavMenuItem;
  className: string;
}) => {
  if (!item.link) {
    return (
      <span className={`${className} disabled-link`}>
        <span className="dropdown-item-text">{item.label}</span>
      </span>
    );
  }

  return (
    <Link to={item.link} className={className}>
      <span className="dropdown-item-text">{item.label}</span>
    </Link>
  );
};

const SubDropdownItem = ({ item }: { item: NavMenuItem }) => {
  const [open, setOpen] = useState(false);
  const [subDropdownStyle, setSubDropdownStyle] =
    useState<React.CSSProperties>({});

  const hasChildren = Boolean(item.children?.length);
  const ref = useRef<HTMLDivElement | null>(null);
  const subDropdownRef = useRef<HTMLDivElement | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

const updateSubDropdownPosition = useCallback(() => {
  if (!hasChildren || !ref.current || !isDesktop()) {
    setSubDropdownStyle({});
    return;
  }

  const rect = ref.current.getBoundingClientRect();
  const rootStyles = getComputedStyle(document.documentElement);
  const cssDropWidth = rootStyles.getPropertyValue("--drop-width");
  const dropWidth = Number.parseFloat(cssDropWidth) || 268;

  const gap = 8;
  const safeGap = 12;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const spaceRight = viewportWidth - rect.right - safeGap;
  const spaceLeft = rect.left - safeGap;

  let left: number;

  if (spaceRight >= dropWidth + gap) {
    left = rect.right + gap;
  } else if (spaceLeft >= dropWidth + gap) {
    left = rect.left - dropWidth - gap;
  } else {
    const openRightScore = Math.abs(viewportWidth - (rect.right + gap + dropWidth));
    const openLeftScore = Math.abs(rect.left - dropWidth - gap);

    left =
      openRightScore < openLeftScore
        ? rect.right + gap
        : rect.left - dropWidth - gap;
  }

  left = Math.max(
    safeGap,
    Math.min(left, viewportWidth - dropWidth - safeGap),
  );

  const maxHeight = Math.max(
    220,
    Math.min(520, viewportHeight - safeGap * 2),
  );

  const top = Math.max(
    safeGap,
    Math.min(rect.top, viewportHeight - maxHeight - safeGap),
  );

  setSubDropdownStyle({
    position: "fixed",
    top,
    left,
    right: "auto",
    insetInlineStart: "auto",
    insetInlineEnd: "auto",
    width: dropWidth,
    maxHeight,
    zIndex: 1300,
  });
}, [hasChildren]);

  useEffect(() => {
    if (!open || !hasChildren) return;

    updateSubDropdownPosition();

    window.addEventListener("resize", updateSubDropdownPosition);
    document.addEventListener("scroll", updateSubDropdownPosition, true);

    return () => {
      window.removeEventListener("resize", updateSubDropdownPosition);
      document.removeEventListener("scroll", updateSubDropdownPosition, true);
    };
  }, [open, hasChildren, updateSubDropdownPosition]);

  useEffect(() => {
    if (!open) return;

    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      const clickedInsideParent = ref.current && ref.current.contains(target);

      const clickedInsideSubDropdown =
        subDropdownRef.current && subDropdownRef.current.contains(target);

      if (!clickedInsideParent && !clickedInsideSubDropdown) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);

    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    return () => {
      clearCloseTimer();
    };
  }, []);

  const onEnter = () => {
    if (!hasChildren || !isDesktop()) return;

    clearCloseTimer();
    setOpen(true);
    requestAnimationFrame(updateSubDropdownPosition);
  };

  const onLeave = (event?: React.MouseEvent) => {
    if (!hasChildren || !isDesktop()) return;

    const nextTarget = event?.relatedTarget as HTMLElement | null;

    if (
      nextTarget?.closest(".floating-sub-dropdown") ||
      (nextTarget && ref.current?.contains(nextTarget))
    ) {
      return;
    }

    clearCloseTimer();

    closeTimer.current = setTimeout(() => {
      setOpen(false);
    }, 260);
  };

  const onClick = (event: React.MouseEvent) => {
    if (!hasChildren || isDesktop()) return;

    event.preventDefault();
    event.stopPropagation();

    clearCloseTimer();
    setOpen((prev) => !prev);
    requestAnimationFrame(updateSubDropdownPosition);
  };

  const subDropdownElement = (
    <div
      className="sub-dropdown floating-sub-dropdown"
      ref={subDropdownRef}
      style={subDropdownStyle}
      onMouseEnter={clearCloseTimer}
      onMouseLeave={onLeave}
    >
      {item.children?.map((child) => (
        <SubDropdownItem key={child.key} item={child} />
      ))}
    </div>
  );

  return (
    <div
      className={`dropdown-item ${hasChildren ? "has-sub" : ""} ${
        open ? "sub-open" : ""
      }`}
      ref={ref}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {hasChildren ? (
        <span className="dropdown-item-label" onClick={onClick}>
          <span className="dropdown-item-text">{item.label}</span>
          <ChevronLeft size={12} className="sub-arrow" />
        </span>
      ) : (
        <MenuLink item={item} className="dropdown-item-label solo" />
      )}

      {hasChildren &&
        open &&
        (isDesktop() && typeof document !== "undefined"
          ? createPortal(subDropdownElement, document.body)
          : subDropdownElement)}
    </div>
  );
};

const NavItem = ({
  item,
  isActive,
}: {
  item: NavMenuItem;
  isActive: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const hasChildren = Boolean(item.children?.length);
  const ref = useRef<HTMLLIElement | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const updateDropdownPosition = useCallback(() => {
    if (!ref.current || !isDesktop()) {
      setDropdownStyle({});
      return;
    }

    const rect = ref.current.getBoundingClientRect();
    const rootStyles = getComputedStyle(document.documentElement);
    const cssDropWidth = rootStyles.getPropertyValue("--drop-width");
    const dropWidth = Number.parseFloat(cssDropWidth) || 268;
    const safeGap = 12;
    const pageDir = document.documentElement.dir || "rtl";

    let left = pageDir === "rtl" ? rect.right - dropWidth : rect.left;

    left = Math.max(
      safeGap,
      Math.min(left, window.innerWidth - dropWidth - safeGap),
    );

    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 10,
      left,
    });
  }, []);

  const onEnter = () => {
    if (!hasChildren || !isDesktop()) return;

    clearCloseTimer();
    setOpen(true);
    requestAnimationFrame(updateDropdownPosition);
  };

  const onLeave = (event?: React.MouseEvent) => {
    if (!hasChildren || !isDesktop()) return;

    const nextTarget = event?.relatedTarget as HTMLElement | null;

    if (
      nextTarget?.closest(".floating-dropdown") ||
      nextTarget?.closest(".floating-sub-dropdown")
    ) {
      return;
    }

    clearCloseTimer();

    closeTimer.current = setTimeout(() => {
      setOpen(false);
    }, 220);
  };

  const onClick = (event: React.MouseEvent) => {
    if (!hasChildren || isDesktop()) return;

    event.preventDefault();
    event.stopPropagation();
    setOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!open) return;

    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (
        ref.current &&
        !ref.current.contains(target) &&
        !target.closest(".floating-sub-dropdown")
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);

    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open || !hasChildren) return;

    updateDropdownPosition();

    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", updateDropdownPosition, true);

    return () => {
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [open, hasChildren, updateDropdownPosition]);

  useEffect(() => {
    return () => {
      clearCloseTimer();
    };
  }, []);

  return (
    <li
      className={`nav-item ${isActive ? "active" : ""} ${
        hasChildren ? "has-dropdown" : ""
      } ${open ? "dropdown-open" : ""}`}
      ref={ref}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {hasChildren ? (
        <span className="nav-link" onClick={onClick}>
          <span className="nav-link-text">{item.label}</span>
          <ChevronDown size={11} className="nav-arrow" />
        </span>
      ) : item.link ? (
        <Link to={item.link} className="nav-link">
          <span className="nav-link-text">{item.label}</span>
        </Link>
      ) : (
        <span className="nav-link disabled-link">
          <span className="nav-link-text">{item.label}</span>
        </span>
      )}

      {hasChildren && open && (
        <div
          className="dropdown-menu floating-dropdown"
          style={dropdownStyle}
          onMouseEnter={clearCloseTimer}
          onMouseLeave={onLeave}
        >
          {item.children?.map((child) => (
            <SubDropdownItem key={child.key} item={child} />
          ))}
        </div>
      )}
    </li>
  );
};

const Header = () => {
  const { i18n, t } = useTranslation();
  const location = useLocation();
  const { palettes, selectedPalette, changePalette } = useTheme();

  const navScrollerRef = useRef<HTMLDivElement | null>(null);

  const [menuActive, setMenuActive] = useState(false);
  const [langActive, setLangActive] = useState(false);
  const [paletteActive, setPaletteActive] = useState(false);
  const [currentLang, setCurrentLang] = useState<LanguageItem>(getSavedLang);
  const [languages, setLanguages] = useState<LanguageItem[]>(FIXED_LANGUAGES);
  const [apiMenuItems, setApiMenuItems] = useState<ApiMenuItem[]>([]);
  const [facultyRouteMaps, setFacultyRouteMaps] =
    useState<FacultyRouteMaps>(EMPTY_FACULTY_ROUTE_MAPS);
  const [menuFailed, setMenuFailed] = useState(false);
  const [showNavScrollButtons, setShowNavScrollButtons] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const isRtl = isRtlLang(currentLang.code);

  const navItems = useMemo(() => {
    if (menuFailed || apiMenuItems.length === 0) {
      return fallbackNavItems(t);
    }

    return buildNavItems(apiMenuItems, t, facultyRouteMaps);
  }, [apiMenuItems, facultyRouteMaps, menuFailed, t]);

  const LeftScrollIcon = isRtl ? ChevronRight : ChevronLeft;
  const RightScrollIcon = isRtl ? ChevronLeft : ChevronRight;

  const getCurrentScroll = useCallback((scroller: HTMLDivElement) => {
    return scroller.scrollLeft;
  }, []);

  const setCurrentScroll = useCallback(
    (
      scroller: HTMLDivElement,
      nextScroll: number,
      behavior: ScrollBehavior = "smooth",
    ) => {
      const max = getMaxScroll(scroller);
      const safeScroll = Math.max(0, Math.min(nextScroll, max));

      scroller.scrollTo({
        left: safeScroll,
        behavior,
      });
    },
    [],
  );

  const getStartScroll = useCallback(
    (scroller: HTMLDivElement) => {
      return isRtlLang(currentLang.code) ? getMaxScroll(scroller) : 0;
    },
    [currentLang.code],
  );

  const updateNavScrollState = useCallback(() => {
    const scroller = navScrollerRef.current;

    if (!scroller || !isDesktop()) {
      setShowNavScrollButtons(false);
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    const max = getMaxScroll(scroller);
    const current = getCurrentScroll(scroller);
    const hasOverflow = max > 4;

    setShowNavScrollButtons(hasOverflow);

    if (!hasOverflow) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    setCanScrollLeft(current > 2);
    setCanScrollRight(current < max - 2);
  }, [getCurrentScroll]);

  const scrollNavbar = (direction: "left" | "right") => {
    const scroller = navScrollerRef.current;

    if (!scroller) return;

    const current = getCurrentScroll(scroller);
    const amount = 300;
    const next = direction === "right" ? current + amount : current - amount;

    setCurrentScroll(scroller, next, "smooth");
    window.setTimeout(updateNavScrollState, 350);
  };

  const resetNavbarToStart = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      const scroller = navScrollerRef.current;

      if (!scroller) return;

      setCurrentScroll(scroller, getStartScroll(scroller), behavior);
      window.setTimeout(updateNavScrollState, 350);
    },
    [getStartScroll, setCurrentScroll, updateNavScrollState],
  );

  const leftButtonDisabled = isRtl ? !canScrollRight : !canScrollLeft;
  const rightButtonDisabled = isRtl ? !canScrollLeft : !canScrollRight;

  const handleLeftScroll = () => {
    scrollNavbar(isRtl ? "right" : "left");
  };

  const handleRightScroll = () => {
    scrollNavbar(isRtl ? "left" : "right");
  };

  useEffect(() => {
    newsService
      .getLanguages()
      .then((res: any) => {
        const result = res?.result;

        if (
          Array.isArray(result) &&
          result.length > 0 &&
          result.every((lang: any) => lang.code)
        ) {
          setLanguages(sortLanguages(result));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let mounted = true;

    setMenuFailed(false);

    newsService
      .getUniversityMenu(currentLang?.id || 1)
      .then((data: any) => {
        if (!mounted) return;

        const result = Array.isArray(data)
          ? data
          : Array.isArray(data?.result)
            ? data.result
            : [];

        setApiMenuItems(result);
      })
      .catch(() => {
        if (!mounted) return;

        setApiMenuItems([]);
        setMenuFailed(true);
      });

    return () => {
      mounted = false;
    };
  }, [currentLang?.id]);

  useEffect(() => {
    let mounted = true;

    const loadFacultyRoutes = async () => {
      try {
        let response = await newsService.getColleges(currentLang?.id || 1);
        let colleges = normalizeApiResponse(response);

        if (colleges.length === 0 && currentLang?.id !== 1) {
          response = await newsService.getColleges(1);
          colleges = normalizeApiResponse(response);
        }

        if (colleges.length === 0 && currentLang?.id !== 2) {
          response = await newsService.getColleges(2);
          colleges = normalizeApiResponse(response);
        }

        if (!mounted) return;

        setFacultyRouteMaps(buildFacultyRouteMaps(colleges));
      } catch {
        if (!mounted) return;

        setFacultyRouteMaps(EMPTY_FACULTY_ROUTE_MAPS);
      }
    };

    loadFacultyRoutes();

    return () => {
      mounted = false;
    };
  }, [currentLang?.id]);

  useEffect(() => {
    i18n.changeLanguage(currentLang.code);

    document.documentElement.lang = currentLang.code;
    document.documentElement.dir = isRtlLang(currentLang.code) ? "rtl" : "ltr";
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(updateNavScrollState);
    const timer = window.setTimeout(() => {
      resetNavbarToStart("auto");
      updateNavScrollState();
    }, 250);

    window.addEventListener("resize", updateNavScrollState);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      window.removeEventListener("resize", updateNavScrollState);
    };
  }, [navItems, resetNavbarToStart, updateNavScrollState]);

  useEffect(() => {
    setMenuActive(false);
  }, [location.pathname]);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (langActive && !target.closest(".lang-wrapper")) {
        setLangActive(false);
      }

      if (paletteActive && !target.closest(".palette-wrapper")) {
        setPaletteActive(false);
      }
    };

    document.addEventListener("mousedown", handler);

    return () => document.removeEventListener("mousedown", handler);
  }, [langActive, paletteActive]);

  useEffect(() => {
    document.body.style.overflow = menuActive ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [menuActive]);

  const changeLanguage = async (lang: LanguageItem) => {
    saveLanguage(lang);

    await i18n.changeLanguage(lang.code);

    document.documentElement.lang = lang.code;
    document.documentElement.dir = isRtlLang(lang.code) ? "rtl" : "ltr";

    setCurrentLang(lang);
    setLangActive(false);

    window.setTimeout(() => {
      const scroller = navScrollerRef.current;

      if (!scroller) return;

      setCurrentScroll(
        scroller,
        isRtlLang(lang.code) ? getMaxScroll(scroller) : 0,
        "auto",
      );

      updateNavScrollState();
    }, 120);
  };

  return (
    <header className="nav-container">
      <Link
        to="/"
        className="nav-logo"
        onClick={() => resetNavbarToStart("smooth")}
      >
        <img src={logo} alt="Menofia University Logo" />
      </Link>

      <nav className={`nav-links ${menuActive ? "nav-active" : ""}`}>
        <button
          type="button"
          className="nav-close"
          onClick={() => setMenuActive(false)}
          aria-label="close menu"
        >
          <X size={20} strokeWidth={2.4} />
        </button>

        {showNavScrollButtons && (
          <button
            type="button"
            className="nav-scroll-btn nav-scroll-left"
            onClick={handleLeftScroll}
            disabled={leftButtonDisabled}
            aria-label="scroll navigation left"
          >
            <LeftScrollIcon size={18} />
          </button>
        )}

        <div
          className="nav-scroll-area"
          dir="ltr"
          ref={navScrollerRef}
          onScroll={updateNavScrollState}
        >
          <ul dir={isRtl ? "rtl" : "ltr"}>
            {navItems.map((item) => (
              <NavItem
                key={item.key}
                item={item}
                isActive={isItemActive(item, location.pathname)}
              />
            ))}
          </ul>
        </div>

        {showNavScrollButtons && (
          <button
            type="button"
            className="nav-scroll-btn nav-scroll-right"
            onClick={handleRightScroll}
            disabled={rightButtonDisabled}
            aria-label="scroll navigation right"
          >
            <RightScrollIcon size={18} />
          </button>
        )}
      </nav>

      <div className="nav-icons">
        <div
          className="lang-wrapper"
          onClick={() => {
            setLangActive((prev) => !prev);
            setPaletteActive(false);
          }}
        >
          <Globe size={20} />
          <span className="lang-code">{currentLang.code?.toUpperCase()}</span>
          <ChevronDown
            size={14}
            className={`lang-arrow ${langActive ? "rotated" : ""}`}
          />

          <div className={`lang-dropdown ${langActive ? "open" : ""}`}>
            {languages.map((lang) => (
              <div
                key={lang.code}
                className={`lang-option ${
                  currentLang.code === lang.code ? "current" : ""
                }`}
                onClick={(event) => {
                  event.stopPropagation();
                  changeLanguage(lang);
                }}
              >
                {lang.flag && (
                  <img
                    src={lang.flag}
                    alt={lang.name}
                    width={20}
                    height={15}
                    style={{
                      objectFit: "cover",
                      borderRadius: "2px",
                    }}
                  />
                )}

                <span>{lang.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          className="palette-wrapper"
          onClick={() => {
            setPaletteActive((prev) => !prev);
            setLangActive(false);
          }}
        >
          <PaletteIcon size={23} />

          <ChevronDown
            size={16}
            className={`palette-arrow ${paletteActive ? "rotated" : ""}`}
          />

          <div
            className={`palette-dropdown ${paletteActive ? "open" : ""}`}
            onClick={(event) => event.stopPropagation()}
          >
            {Object.values(palettes).map((palette: any) => (
              <button
                type="button"
                key={palette.id}
                className={`palette-option ${
                  selectedPalette === palette.id ? "selected" : ""
                }`}
                aria-label={`Change theme to ${palette.name}`}
                title={palette.name}
                onClick={() => {
                  changePalette(palette.id);
                  setPaletteActive(false);
                }}
              >
                <span className="palette-colors" aria-hidden="true">
                  {palette.preview.map((color: string) => (
                    <span
                      key={color}
                      className="palette-color"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className="icon-btn menu-btn"
          onClick={() => setMenuActive(true)}
          aria-label="open menu"
        >
          <MenuIcon size={23} strokeWidth={2.4} />
        </button>
      </div>

      {menuActive && (
        <div className="nav-overlay" onClick={() => setMenuActive(false)} />
      )}
    </header>
  );
};

export default Header;


