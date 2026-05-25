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

import logo from "../../src/assets/logo.jpg";
import logo2 from "../../src/assets/MNF_logo.png";
import headerBg from "../../src/assets/01.jpg";

const ITEMS_PER_PAGE = 10;
const DEBOUNCE_DELAY = 500;

const TOP_MENU_TITLES = [
  "عن الكلية",
  "إدارة الكلية",
  "ادارة الكلية",
  "قطاعات الكلية",
  "أقسام الكلية",
  "اقسام الكلية",
  "أقسام الكليه",
  "اقسام الكليه",
  "الطلاب",
  "أعضاء هيئة التدريس",
  "اعضاء هيئة التدريس",
  "اعضاء هيئه التدريس",
  "الجهاز الإداري",
  "الجهاز الاداري",
  "الجهازالإداري",
  "الجهازالاداري",
  "الأبحاث والأنشطة العلمية",
  "الابحاث والانشطه العلميه",
  "البحوث والأنشطة العلمية",
  "البحوث والانشطة العلمية",
  "الطلاب الوافدين",
  "وحدات ومراكز",
];

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

const FOOTER_GROUP_TITLES = [
  "مواقع هامة",
  "خدمات أكاديمية",
  "خدمات اكاديمية",
  "خدمات إلكترونية",
  "خدمات الكترونية",
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

interface FacultyMenuItem {
  menuId: number;
  parentId: number | null;
  sortOrder: number;
  title: string;
  articleId: number | null;
  url: string;
  children: FacultyMenuItem[];
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
};

const DATE_FILTERS = [
  { value: 0, labelAr: "كل الأخبار", labelEn: "All News" },
  { value: 2, labelAr: "اليوم", labelEn: "Today" },
  { value: 3, labelAr: "آخر أسبوع", labelEn: "Last Week" },
  { value: 4, labelAr: "آخر شهر", labelEn: "Last Month" },
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

const normalizeName = (value: string): string =>
  String(value || "")
    .trim()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .toLowerCase();

const normalizeMenuTitle = (title?: string): string =>
  normalizeName(String(title || ""));

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

const extractDepartmentCodeFromUrl = (url?: string) => {
  if (!url) return "";

  const match = url.match(/\/([^/]+)\/Home\/(?:ar|en)/i);
  return match?.[1]?.toUpperCase() || "";
};

const getFac = (title: string): number | null =>
  FAC_MAP[normalizeName(title)] ?? null;

const getSavedLang = (): SavedLang => {
  try {
    return JSON.parse(localStorage.getItem("lang") || "{}");
  } catch {
    return {};
  }
};

const getSavedLangId = () => Number(getSavedLang()?.id) || 1;

const normalizeApiResponse = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.result)) return data.result;
  return [];
};

const cleanMenuTitle = (title?: string) =>
  String(title || "")
    .replace(/\s+/g, " ")
    .trim();

const isExternalMenuUrl = (url?: string) =>
  typeof url === "string" && /^https?:\/\//i.test(url);

const getMenuChildren = (item?: FacultyMenuItem) =>
  Array.isArray(item?.children)
    ? item.children
        .filter((child) => child && typeof child === "object")
        .filter((child) => cleanMenuTitle(child.title).length > 0)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    : [];

const sanitizeFacultyMenuItems = (items: FacultyMenuItem[] = []) => {
  return items
    .filter((item) => item && typeof item === "object")
    .filter((item) => cleanMenuTitle(item.title).length > 0)
    .map((item) => ({
      ...item,
      title: cleanMenuTitle(item.title),
      children: getMenuChildren(item),
    }))
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
};

const getFacultyMenuLink = (item: FacultyMenuItem, fac?: string) => {
  const departmentCode = extractDepartmentCodeFromUrl(item.url);

  if (departmentCode && fac) {
    return `/fac/${fac}/department/${departmentCode}`;
  }

  if (isExternalMenuUrl(item.url)) return item.url;

  if (item.articleId !== null && item.articleId !== undefined) {
    return `/fac/${fac}?articleId=${item.articleId}`;
  }

  return `/fac/${fac}`;
};

const filterMenuByTitles = (items: FacultyMenuItem[], titles: string[]) => {
  const allowedTitles = titles.map(normalizeMenuTitle);

  return items
    .filter((item) => allowedTitles.includes(normalizeMenuTitle(item.title)))
    .sort(
      (a, b) =>
        allowedTitles.indexOf(normalizeMenuTitle(a.title)) -
        allowedTitles.indexOf(normalizeMenuTitle(b.title)),
    );
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
): FooterMenuGroup[] => {
  const cleanItems = sanitizeFacultyMenuItems(items);

  const topTitles = TOP_MENU_TITLES.map(normalizeMenuTitle);
  const footerTitles = FOOTER_GROUP_TITLES.map(normalizeMenuTitle);

  const apiGroups = cleanItems
    .filter((item) => footerTitles.includes(normalizeMenuTitle(item.title)))
    .slice(0, 3)
    .map((item) => ({
      menuId: item.menuId,
      title: cleanMenuTitle(item.title),
      children: getMenuChildren(item),
    }))
    .filter((group) => group.children.length > 0);

  if (apiGroups.length > 0) return apiGroups;

  const remainingItems = cleanItems.filter(
    (item) => !topTitles.includes(normalizeMenuTitle(item.title)),
  );

  const fallbackTitles = isArabic
    ? ["مواقع هامة", "خدمات أكاديمية", "خدمات إلكترونية"]
    : ["Important Links", "Academic Services", "Electronic Services"];

  return chunkItems(remainingItems, 3)
    .map((children, index) => ({
      menuId: `footer-group-${index}`,
      title: fallbackTitles[index],
      children: children.filter(
        (item) => cleanMenuTitle(item.title).length > 0,
      ),
    }))
    .filter((group) => group.children.length > 0);
};

const FacultyMenuItemView: React.FC<{
  item: FacultyMenuItem;
  fac?: string;
  facultyTitle?: string;
  themeColor?: string;
  level?: number;
}> = ({ item, fac, facultyTitle, themeColor, level = 0 }) => {
  const [open, setOpen] = useState(false);
  const children = getMenuChildren(item);
  const hasChildren = children.length > 0;
  const link = getFacultyMenuLink(item, fac);
  const isExternal = isExternalMenuUrl(link);

  const handleToggle = (e: React.MouseEvent) => {
    if (!hasChildren) return;

    e.preventDefault();
    e.stopPropagation();
    setOpen((prev) => !prev);
  };

  const content = (
    <>
      <span>{cleanMenuTitle(item.title)}</span>
      {hasChildren &&
        (level === 0 ? (
          <ChevronDown
            size={12}
            className={`faculty-menu-arrow ${open ? "open" : ""}`}
          />
        ) : (
          <ChevronLeft
            size={12}
            className={`faculty-menu-arrow ${open ? "open" : ""}`}
          />
        ))}
    </>
  );

  return (
    <div
      className={`faculty-menu-item level-${level} ${
        hasChildren ? "has-children" : ""
      } ${open ? "open" : ""}`}
      onMouseEnter={() => hasChildren && setOpen(true)}
      onMouseLeave={() => hasChildren && setOpen(false)}
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
            themeColor,
          }}
          className="faculty-menu-link"
        >
          {content}
        </Link>
      )}

      {hasChildren && open && (
        <div className="faculty-sub-menu">
          {children.map((child) => (
            <FacultyMenuItemView
              key={child.menuId}
              item={child}
              fac={fac}
              facultyTitle={facultyTitle}
              themeColor={themeColor}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FacultyFooterLink: React.FC<{
  item: FacultyMenuItem;
  fac?: string;
}> = ({ item, fac }) => {
  const link = getFacultyMenuLink(item, fac);
  const isExternal = isExternalMenuUrl(link);

  const content = (
    <>
      <span>{cleanMenuTitle(item.title)}</span>
      <i className="fa-solid fa-arrow-up" aria-hidden="true" />
    </>
  );

  if (isExternal) {
    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className="faculty-footer-link"
      >
        {content}
      </a>
    );
  }

  return (
    <Link to={link} className="faculty-footer-link">
      {content}
    </Link>
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
  const parsed = useMemo(
    () => parseArticleContent(article.content || ""),
    [article.content],
  );

  const articleType = getArticleType(article, parsed);

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
            {isArabic
              ? "المتصفح لا يدعم تشغيل الفيديو."
              : "Your browser does not support video playback."}
          </video>
        </div>

        <a
          href={video.href}
          target="_blank"
          rel="noopener noreferrer"
          className="faculty-article-main-action"
        >
          {isArabic ? "فتح الفيديو" : "Open video"}
        </a>
      </article>
    );
  }

  if (articleType === "file") {
    const file = parsed.fileLinks[0];

    return (
      <article className="faculty-article-card faculty-article-file-card">
        <div className="faculty-article-card-head">
          <span className="faculty-article-card-icon">
            <i className="fa-solid fa-file-lines" />
          </span>
          <h2>{article.title}</h2>
        </div>

        <div className="faculty-file-box">
          <span className="faculty-file-extension">
            {getFileLabel(file.extension)}
          </span>

          <div className="faculty-file-info">
            <h3>{file.text || article.title}</h3>
            <p>
              {isArabic ? "ملف مرفق من بيانات الكلية" : "Attached faculty file"}
            </p>
          </div>
        </div>

        <div className="faculty-article-actions">
          <a
            href={file.href}
            target="_blank"
            rel="noopener noreferrer"
            className="faculty-article-main-action"
          >
            {isArabic ? "عرض الملف" : "View file"}
          </a>

          <a
            href={file.href}
            download
            className="faculty-article-secondary-action"
          >
            {isArabic ? "تحميل" : "Download"}
          </a>
        </div>
      </article>
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
            `<p>${isArabic ? "لا يوجد محتوى متاح" : "No content available"}</p>`,
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
}> = ({ article, loading, error, isArabic, isRTL, fac }) => {
  return (
    <section className="faculty-article-section" dir={isRTL ? "rtl" : "ltr"}>
      <div className="faculty-article-wrapper">
        <Link to={`/fac/${fac}`} className="faculty-article-back-link">
          <i className="fa-solid fa-arrow-right" aria-hidden="true" />
          <span>
            {isArabic ? "العودة إلى أخبار الكلية" : "Back to faculty news"}
          </span>
        </Link>

        <div className="faculty-section-heading" dir={isRTL ? "rtl" : "ltr"}>
          <span className="faculty-section-dot" />
          <h1 className="faculty-section-title">
            {article?.title || (isArabic ? "محتوى الكلية" : "Faculty Content")}
          </h1>
        </div>

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
              {isArabic ? "تعذر تحميل المحتوى" : "Could not load content"}
            </h2>
            <p>{error}</p>
          </div>
        ) : article ? (
          <FacultyArticleRenderer article={article} isArabic={isArabic} />
        ) : (
          <div className="faculty-article-card faculty-article-error-card">
            <h2>{isArabic ? "لا يوجد محتوى متاح" : "No content available"}</h2>
          </div>
        )}
      </div>
    </section>
  );
};

const FacultyFooterColumn: React.FC<{
  group: FooterMenuGroup;
  fac?: string;
  isArabic: boolean;
}> = ({ group, fac, isArabic }) => {
  const [showAll, setShowAll] = useState(false);

  const cleanChildren = group.children.filter(
    (item) => cleanMenuTitle(item.title).length > 0,
  );

  const previewItems = cleanChildren.slice(0, 3);
  const extraItems = cleanChildren.slice(3);
  const visibleExtraItems = showAll ? extraItems : [];

  return (
    <div className={`faculty-footer-column ${showAll ? "expanded" : ""}`}>
      <h3>{cleanMenuTitle(group.title)}</h3>

      <div className="faculty-footer-links-scroll">
        <div className="faculty-footer-links-list">
          {previewItems.map((item) => (
            <FacultyFooterLink key={item.menuId} item={item} fac={fac} />
          ))}

          {visibleExtraItems.map((item) => (
            <FacultyFooterLink key={item.menuId} item={item} fac={fac} />
          ))}
        </div>
      </div>

      {extraItems.length > 0 && (
        <button
          type="button"
          className="faculty-footer-more-btn"
          onClick={() => setShowAll((prev) => !prev)}
        >
          <span>
            {showAll
              ? isArabic
                ? "عرض أقل"
                : "Show less"
              : isArabic
                ? "عرض المزيد"
                : "Show more"}
          </span>
        </button>
      )}
    </div>
  );
};

const FacultyNews: React.FC = () => {
  const { fac } = useParams<{ fac: string }>();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { i18n } = useTranslation();

  const savedLang = getSavedLang();
  const isArabic = savedLang?.code === "ar" || i18n.language === "ar";
  const isRTL = isArabic;

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

  const [langId, setLangId] = useState<number>(
    Number(location.state?.langId) || getSavedLangId(),
  );
  const [collegeNameFallback, setCollegeNameFallback] = useState<string>("");
  const [collegeName, setCollegeName] = useState<string>("");

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

  const [selectedThemeColor, setSelectedThemeColor] = useState("#102C57");

  const [articlePage, setArticlePage] = useState<FacultyArticlePageData | null>(
    null,
  );
  const [articleLoading, setArticleLoading] = useState(false);
  const [articleError, setArticleError] = useState("");

  const [notFound, setNotFound] = useState(false);
  const [articleNotFound, setArticleNotFound] = useState(false);

  const topFacultyMenu = useMemo(() => {
    const matchedMenu = filterMenuByTitles(facultyMenu, TOP_MENU_TITLES);

    if (matchedMenu.length > 0) {
      return matchedMenu;
    }

    return facultyMenu
      .filter((item) => cleanMenuTitle(item.title).length > 0)
      .slice(0, 10);
  }, [facultyMenu]);

  const footerMenuGroups = useMemo(
    () => buildFooterMenuGroups(facultyMenu, isArabic),
    [facultyMenu, isArabic],
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
      const currentLangId = getSavedLangId();
      const facultyCode = Number(fac);

      setLangId(currentLangId);
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
        setNotFound(true);
        setLoading(false);
        setHighlightsLoading(false);
        setFacultyMenuLoading(false);
        return;
      }

      try {
        const response = await newsService.getColleges(currentLangId);
        const colleges = normalizeApiResponse(response);

        const matchedCollege = colleges.find(
          (college: any) => getFac(college.title) === facultyCode,
        );

        if (!isMounted) return;

        if (!matchedCollege) {
          setCollegeName("");
          setCollegeNameFallback("");
          setNotFound(true);
          setLoading(false);
          setHighlightsLoading(false);
          setFacultyMenuLoading(false);
          return;
        }

        setNotFound(false);
        setCollegeName(matchedCollege.title || "");

        if (currentLangId !== 2) {
          const enResponse = await newsService.getColleges(2);
          const enColleges = normalizeApiResponse(enResponse);
          const enMatch = enColleges.find(
            (college: any) => getFac(college.title) === facultyCode,
          );

          if (!isMounted) return;

          if (enMatch?.title) {
            setCollegeNameFallback(enMatch.title);
          } else {
            setCollegeNameFallback(matchedCollege.title || "");
          }
        } else {
          setCollegeNameFallback(matchedCollege.title || "");
        }
      } catch (error) {
        console.error("Failed to fetch college name:", error);

        if (isMounted) {
          setCollegeName("");
          setCollegeNameFallback("");
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
  }, [fac, i18n.language]);

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
          Array.isArray(response?.result) ? response.result : [],
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
    (term: string) => (term.trim() ? 1 : Number(langId)),
    [langId],
  );

  const getActiveSearchLangId = () => (search.trim() ? 1 : Number(langId));

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

    return new Date(dateStr).toLocaleDateString(isArabic ? "ar-EG" : "en-US", {
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

  const activeTheme =
    THEME_PRESETS.find((theme) => theme.primary === selectedThemeColor) ||
    THEME_PRESETS[2];

  const pageThemeStyle = {
    "--faculty-primary": activeTheme.primary,
    "--faculty-primary-rgb": activeTheme.primaryRgb,
    "--faculty-dark": activeTheme.dark,
    "--faculty-dark-rgb": activeTheme.darkRgb,
    "--faculty-secondary": activeTheme.secondary,
    "--faculty-soft-bg": activeTheme.soft,
    "--faculty-card-bg": activeTheme.card,
    "--faculty-muted-bg": activeTheme.muted,
    "--faculty-button": activeTheme.button,
    "--faculty-button-hover": activeTheme.buttonHover,
    "--faculty-search-bg": activeTheme.secondary,
    "--faculty-header-overlay": activeTheme.headerOverlay,

    "--faculty-footer": activeTheme.footer,
    "--faculty-footer-top": activeTheme.footer,
    "--faculty-footer-rgb": activeTheme.footerRgb,
    "--faculty-footer-bottom": activeTheme.footerBottom,

    "--faculty-icon-bg": activeTheme.iconBackground,
    "--faculty-icon-color": activeTheme.iconColor,
    "--faculty-icon-bg-hover": activeTheme.iconBackgroundHover,
    "--faculty-icon-hover": activeTheme.iconHover,
    "--faculty-primary-text": activeTheme.primaryText,
    "--faculty-secondary-text": activeTheme.secondaryText,
    "--faculty-pagination-bg": activeTheme.paginationBg,
    "--faculty-pagination-text": activeTheme.paginationText,
    "--faculty-pagination-border": activeTheme.paginationBorder,
    "--faculty-pagination-active-bg": activeTheme.paginationActiveBg,
    "--faculty-pagination-active-text": activeTheme.paginationActiveText,
    "--faculty-pagination-arrow-bg": activeTheme.paginationArrowBg,
    "--faculty-pagination-arrow-color": activeTheme.paginationArrowColor,
    "--faculty-pagination-disabled-bg": activeTheme.paginationDisabledBg,
    "--faculty-pagination-disabled-color": activeTheme.paginationDisabledColor,
    "--faculty-pagination-info-strong": activeTheme.paginationInfoStrong,
  } as React.CSSProperties;

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
    <div
      className="news-page-wrapper faculty-page-wrapper"
      style={pageThemeStyle}
    >
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
            aria-label="back"
          >
            <i className="fa-solid fa-chevron-right"></i>
            <span>
              {isArabic ? "الرجوع الى موقع الجامعة" : "Back to University"}
            </span>
          </button>

          <div className="faculty-top-brand">
            <div className="faculty-top-brand-text">
              <h2 className="faculty-top-college-name">{displayName}</h2>
              <p className="faculty-top-university-name">
                {isArabic ? "جامعة المنوفية" : "Menoufia University"}
              </p>
            </div>

            <div className="faculty-top-logo-wrap">
              <img
                src={logo}
                alt="university logo"
                className="faculty-top-logo"
              />
            </div>
          </div>
        </div>
      </header>

      <section className="faculty-menu-section" dir={isRTL ? "rtl" : "ltr"}>
        <div className="faculty-menu-wrapper">
          {facultyMenuLoading ? (
            <div className="faculty-menu-loading">
              {isArabic ? "جاري تحميل القائمة..." : "Loading menu..."}
            </div>
          ) : topFacultyMenu.length > 0 ? (
            <div className="faculty-menu-bar">
              <div className="faculty-color-switcher" aria-label="page colors">
                <button
                  type="button"
                  className="faculty-color-palette-btn"
                  aria-label="change page color"
                >
                  <i className="fa-solid fa-palette" aria-hidden="true" />
                </button>

                <div className="faculty-color-options">
                  {THEME_PRESETS.map((theme) => (
                    <button
                      key={theme.primary}
                      type="button"
                      className={`faculty-color-dot ${
                        selectedThemeColor === theme.primary ? "active" : ""
                      }`}
                      style={{ backgroundColor: theme.primary }}
                      onClick={() => setSelectedThemeColor(theme.primary)}
                      aria-label={`change color to ${theme.primary}`}
                    />
                  ))}
                </div>
              </div>

              {topFacultyMenu.map((item) => (
                <FacultyMenuItemView
                  key={item.menuId}
                  item={item}
                  fac={fac}
                  facultyTitle={displayName}
                  themeColor={selectedThemeColor}
                />
              ))}
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
                      to={`/fac/${fac}/details/${activeHighlight.id}`}
                      state={{
                        news: activeHighlight,
                        newsType: "faculty",
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
                          aria-label="previous highlight"
                        >
                          <ChevronLeft size={26} strokeWidth={2.6} />
                        </button>

                        <button
                          type="button"
                          className="faculty-highlight-nav faculty-highlight-next"
                          onClick={handleNextHighlight}
                          aria-label="next highlight"
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
                            aria-label={`go to highlight ${index + 1}`}
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
                    aria-label="search"
                  >
                    <i className="fa-solid fa-magnifying-glass"></i>
                  </button>

                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleManualSearch()}
                    placeholder={
                      isArabic
                        ? "ابحث في أخبار الكلية..."
                        : "Search faculty news..."
                    }
                  />

                  {searchInput && (
                    <button
                      type="button"
                      className="news-clear-btn"
                      onClick={handleClearSearch}
                      aria-label="clear search"
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
                    aria-label="toggle filters"
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

              {activeFiltersCount > 0 && (
                <div className="news-active-filters">
                  {dateFilter !== 0 && (
                    <span className="active-tag">
                      {isArabic
                        ? DATE_FILTERS.find(
                            (filter) => filter.value === dateFilter,
                          )?.labelAr
                        : DATE_FILTERS.find(
                            (filter) => filter.value === dateFilter,
                          )?.labelEn}

                      <button onClick={() => setDateFilter(0)}>
                        <X size={11} />
                      </button>
                    </span>
                  )}

                  {fromDate && (
                    <span className="active-tag">
                      {isArabic ? "من: " : "From: "}
                      {fromDate}
                      <button onClick={() => setFromDate("")}>
                        <X size={11} />
                      </button>
                    </span>
                  )}

                  {toDate && (
                    <span className="active-tag">
                      {isArabic ? "إلى: " : "To: "}
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
                  <span>{isArabic ? "نتائج البحث عن" : "Results for"}</span>
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
                  {isArabic ? "أخبار وفعاليات" : "News & Events"}
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
                  <h2>{isArabic ? "لا توجد نتائج" : "No results found"}</h2>
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
                      aria-label="Previous page"
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
                      aria-label="Next page"
                    >
                      <i className="fa-solid fa-chevron-right" />
                    </button>
                  </div>

                  <div className="news-page-info">
                    {isArabic ? (
                      <>
                        الصفحة <strong>{pageIndex}</strong> من{" "}
                        <strong>{totalPages}</strong>
                      </>
                    ) : (
                      <>
                        Page <strong>{pageIndex}</strong> of{" "}
                        <strong>{totalPages}</strong>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {footerMenuGroups.length > 0 && (
        <footer className="faculty-links-footer" dir={isRTL ? "rtl" : "ltr"}>
          <div className="faculty-links-footer-top">
            {footerMenuGroups.slice(0, 3).map((group) => (
              <FacultyFooterColumn
                key={group.menuId}
                group={group}
                fac={fac}
                isArabic={isArabic}
              />
            ))}
          </div>

          <div className="faculty-links-footer-bottom">
            <div className="faculty-footer-contact">
              <div className="faculty-footer-bottom-title">
                <span>{isArabic ? "تواصل معنا :" : "Contact us:"}</span>

                <span className="faculty-footer-bottom-icon">
                  <i className="fa-solid fa-phone"></i>
                </span>
              </div>

              <div className="faculty-footer-phones">
                <span>048-2235690</span>
                <span className="phone-separator">/</span>
                <span>048-2222753</span>
              </div>

              <div className="faculty-footer-social">
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

            <div className="faculty-footer-logo-area">
              <img src={logo2} alt="Menoufia University" />
            </div>

            <div className="faculty-footer-address">
              <div className="faculty-footer-bottom-title">
                <span>{isArabic ? "عنوان الكلية :" : "Faculty address:"}</span>

                <span className="faculty-footer-bottom-icon">
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

export default FacultyNews;
