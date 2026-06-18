import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  ChevronDown,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  MessageSquare,
  Phone,
  Video,
} from "lucide-react";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import newsService from "../Services/newsService";
import { getLanguageId } from "../utils/language";
import universityLogo from "../assets/logo.jpg";
import "./SpecialUnitPage.css";

type SpecialUnitMenuItem = {
  menuId: number;
  parentId: number | null;
  sortOrder: number;
  title: string;
  articleId: number | null;
  url: string;
  children: SpecialUnitMenuItem[];
  apiIndex: number;
};

type SpecialUnitArticle = {
  articleId: number;
  menuItemId: number | null;
  title: string;
  content: string;
  imageDescription: string | null;
};

type ArticleAsset = {
  url: string;
  extension: string;
  type: "image" | "video" | "pdf" | "file";
};

type RouteState = {
  title?: string;
  abbr?: string;
};

type UnitTitleItem = {
  title: string;
  url: string;
  abbr: string;
};

const SPECIAL_UNITS_LIST_ARTICLE_ID = 66343;

const isPositiveNumber = (value: unknown) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) && numericValue > 0;
};

const normalizeApiResponse = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.data?.result)) return data.data.result;

  return [];
};

const cleanText = (value: string) => {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;

  return textarea.value.replace(/\s+/g, " ").trim();
};

const extractSpecialUnitAbbrFromUrl = (url: string) => {
  if (!url || url === "#") return "";

  const getAbbrFromSegments = (segments: string[]) => {
    const cleanSegments = segments
      .map((segment) => segment.trim())
      .filter(Boolean);

    const homeIndex = cleanSegments.findIndex(
      (segment) => segment.toLowerCase() === "home",
    );

    if (homeIndex > 0) {
      return cleanSegments[homeIndex - 1];
    }

    const viewIndex = cleanSegments.findIndex(
      (segment) => segment.toLowerCase() === "view",
    );

    if (viewIndex > 0) {
      return cleanSegments[viewIndex - 1];
    }

    return cleanSegments[0] || "";
  };

  try {
    const parsedUrl = new URL(url, "https://mu.menofia.edu.eg");
    return getAbbrFromSegments(parsedUrl.pathname.split("/"));
  } catch {
    return getAbbrFromSegments(String(url).split("/"));
  }
};

const extractSpecialUnitsFromHtml = (html: string): UnitTitleItem[] => {
  if (!html) return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const links = Array.from(doc.querySelectorAll("a[href]"));

  return links
    .map((link) => {
      const title = cleanText(link.textContent || "");
      const url = link.getAttribute("href") || "";
      const abbr = extractSpecialUnitAbbrFromUrl(url);

      return {
        title,
        url,
        abbr,
      };
    })
    .filter((unit) => unit.title && unit.abbr);
};

const extractLegacyArticleIdFromUrl = (url?: string) => {
  if (!url) return null;

  const normalizedUrl = String(url);

  const patterns = [
    /\/view\/(\d+)(?:\/|$|\?)/i,
    /\/page\/(\d+)(?:\/|$|\?)/i,
    /\/article\/(\d+)(?:\/|$|\?)/i,
    /\/details\/(\d+)(?:\/|$|\?)/i,
    /\/UnivPresPage\/(\d+)(?:\/|$|\?)/i,
    /[?&](?:articleId|ArticleId|id|Id)=([0-9]+)/i,
  ];

  for (const pattern of patterns) {
    const match = normalizedUrl.match(pattern);

    if (match?.[1]) {
      return Number(match[1]);
    }
  }

  return null;
};

const getMenuItemArticleId = (item: SpecialUnitMenuItem) => {
  if (isPositiveNumber(item.articleId)) {
    return Number(item.articleId);
  }

  return extractLegacyArticleIdFromUrl(item.url);
};

const sortMenuItems = (items: SpecialUnitMenuItem[]) => {
  return [...items].sort((firstItem, secondItem) => {
    return (
      firstItem.sortOrder - secondItem.sortOrder ||
      firstItem.apiIndex - secondItem.apiIndex ||
      firstItem.menuId - secondItem.menuId
    );
  });
};

const normalizeMenuItem = (
  item: any,
  apiIndex: number,
  parentIdFallback: number | null = null,
): SpecialUnitMenuItem | null => {
  if (!item || typeof item !== "object") return null;

  const title = String(item?.title || item?.Title || "").trim();
  if (!title) return null;

  const rawMenuId = item?.menuId ?? item?.MenuId ?? item?.id ?? item?.Id;

  const menuId = isPositiveNumber(rawMenuId)
    ? Number(rawMenuId)
    : Number(`${parentIdFallback || 9}${apiIndex + 1}`);

  const rawParentId = item?.parentId ?? item?.ParentId;

  const parentId =
    rawParentId === null || rawParentId === undefined
      ? parentIdFallback
      : isPositiveNumber(rawParentId)
        ? Number(rawParentId)
        : null;

  const rawArticleId =
    item?.articleId ?? item?.ArticleId ?? item?.articleID ?? item?.ARTICLEID;

  const rawChildren = Array.isArray(item?.children)
    ? item.children
    : Array.isArray(item?.Children)
      ? item.Children
      : [];

  const children = rawChildren
    .map((child: any, childIndex: number) =>
      normalizeMenuItem(child, childIndex, menuId),
    )
    .filter(
      (child: SpecialUnitMenuItem | null): child is SpecialUnitMenuItem =>
        child !== null,
    );

  return {
    menuId,
    parentId,
    sortOrder: Number(item?.sortOrder || item?.SortOrder || item?.order || 0),
    title,
    articleId: isPositiveNumber(rawArticleId) ? Number(rawArticleId) : null,
    url: String(item?.url || item?.Url || ""),
    children,
    apiIndex,
  };
};

const flattenMenuItems = (items: SpecialUnitMenuItem[]) => {
  const flatItems: SpecialUnitMenuItem[] = [];

  const walk = (menuItems: SpecialUnitMenuItem[]) => {
    menuItems.forEach((item) => {
      flatItems.push({
        ...item,
        children: [],
      });

      if (item.children.length > 0) {
        walk(item.children);
      }
    });
  };

  walk(items);

  return flatItems;
};

const buildMenuTree = (items: SpecialUnitMenuItem[]) => {
  const itemMap = new Map<number, SpecialUnitMenuItem>();

  sortMenuItems(items).forEach((item) => {
    itemMap.set(item.menuId, {
      ...item,
      children: [],
    });
  });

  const rootItems: SpecialUnitMenuItem[] = [];

  itemMap.forEach((item) => {
    const parent =
      item.parentId && item.parentId !== item.menuId
        ? itemMap.get(item.parentId)
        : null;

    if (parent) {
      parent.children.push(item);
    } else {
      rootItems.push(item);
    }
  });

  const sortTree = (menuItems: SpecialUnitMenuItem[]) => {
    const sortedItems = sortMenuItems(menuItems);

    sortedItems.forEach((item) => {
      item.children = sortTree(item.children);
    });

    return sortedItems;
  };

  return sortTree(rootItems);
};

const normalizeMenuItems = (data: any[]): SpecialUnitMenuItem[] => {
  const normalizedItems = data
    .map((item, index) => normalizeMenuItem(item, index))
    .filter(
      (item: SpecialUnitMenuItem | null): item is SpecialUnitMenuItem =>
        item !== null,
    );

  return buildMenuTree(flattenMenuItems(normalizedItems));
};

const openParentsForArticle = (
  items: SpecialUnitMenuItem[],
  articleId: number,
  parents: number[] = [],
): number[] => {
  for (const item of items) {
    if (getMenuItemArticleId(item) === articleId) {
      return parents;
    }

    const foundParents = openParentsForArticle(item.children, articleId, [
      ...parents,
      item.menuId,
    ]);

    if (foundParents.length > 0) {
      return foundParents;
    }
  }

  return [];
};

const getFileExtension = (url: string) => {
  const cleanUrl = String(url).split("?")[0].split("#")[0];
  const extension = cleanUrl.split(".").pop();

  return extension ? extension.toLowerCase() : "";
};

const resolveAssetUrl = (value: string) => {
  if (!value) return "";

  const cleanValue = value.trim();

  if (/^https?:\/\//i.test(cleanValue)) {
    return cleanValue;
  }

  if (cleanValue.startsWith("/PrtlFiles/")) {
    return `https://mu.menofia.edu.eg${cleanValue}`;
  }

  if (cleanValue.startsWith("PrtlFiles/")) {
    return `https://mu.menofia.edu.eg/${cleanValue}`;
  }

  if (cleanValue.startsWith("/uploads/")) {
    return `https://stage.menofia.edu.eg:5050${cleanValue}`;
  }

  if (cleanValue.startsWith("uploads/")) {
    return `https://stage.menofia.edu.eg:5050/${cleanValue}`;
  }

  return cleanValue;
};

const getAssetType = (url: string): ArticleAsset["type"] => {
  const extension = getFileExtension(url);

  if (["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(extension)) {
    return "image";
  }

  if (["mp4", "webm", "ogg", "mov"].includes(extension)) {
    return "video";
  }

  if (extension === "pdf") {
    return "pdf";
  }

  return "file";
};

const extractAssetsFromImageDescription = (
  imageDescription?: string | null,
): ArticleAsset[] => {
  if (!imageDescription) return [];

  const collectedValues: string[] = [];

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(imageDescription, "text/html");

    doc
      .querySelectorAll("a[href], img[src], video[src], source[src]")
      .forEach((element) => {
        const value =
          element.getAttribute("href") || element.getAttribute("src") || "";

        if (value) {
          collectedValues.push(value);
        }
      });
  } catch {
    // Fallback below handles plain text paths.
  }

  imageDescription
    .split(/[\n,;|]+/g)
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => collectedValues.push(item));

  const uniqueUrls = Array.from(
    new Set(
      collectedValues
        .map((item) => item.replace(/^["']|["']$/g, "").trim())
        .filter(Boolean),
    ),
  );

  return uniqueUrls.map((url) => {
    const resolvedUrl = resolveAssetUrl(url);

    return {
      url: resolvedUrl,
      extension: getFileExtension(resolvedUrl),
      type: getAssetType(resolvedUrl),
    };
  });
};

const sanitizeHtml = (html: string) => {
  if (!html) return "";

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    doc.querySelectorAll("script, style").forEach((element) => {
      element.remove();
    });

    doc.querySelectorAll("*").forEach((element) => {
      element.removeAttribute("style");
      element.removeAttribute("class");
      element.removeAttribute("id");
    });

    return doc.body.innerHTML;
  } catch {
    return html;
  }
};

const isMessageArticle = (title: string) => {
  return /رسالة|كلمة|نبذة|تعريف|مدير|رئيس|عميد|message|director|president|dean|about/i.test(
    title,
  );
};

const getArticleIcon = (
  article: SpecialUnitArticle,
  assets: ArticleAsset[],
) => {
  const title = article.title || "";

  if (/اتصال|تواصل|contact|phone/i.test(title)) {
    return <Phone size={30} strokeWidth={2.4} />;
  }

  if (assets.some((asset) => asset.type === "video")) {
    return <Video size={30} strokeWidth={2.4} />;
  }

  if (assets.some((asset) => asset.type === "pdf")) {
    return <FileText size={30} strokeWidth={2.4} />;
  }

  if (assets.some((asset) => asset.type === "image")) {
    return <ImageIcon size={30} strokeWidth={2.4} />;
  }

  if (isMessageArticle(title)) {
    return <MessageSquare size={30} strokeWidth={2.4} />;
  }

  return <FileText size={30} strokeWidth={2.4} />;
};

const SpecialUnitArticleRenderer: React.FC<{
  article: SpecialUnitArticle;
  isArabic: boolean;
}> = ({ article, isArabic }) => {
  const assets = useMemo(() => {
    return extractAssetsFromImageDescription(article.imageDescription);
  }, [article.imageDescription]);

  const cleanContent = useMemo(() => {
    return sanitizeHtml(article.content || "");
  }, [article.content]);

  const images = assets.filter((asset) => asset.type === "image");
  const videos = assets.filter((asset) => asset.type === "video");
  const files = assets.filter(
    (asset) => asset.type === "pdf" || asset.type === "file",
  );

  const shouldUseProfileLayout =
    images.length === 1 && cleanContent && isMessageArticle(article.title);

  if (shouldUseProfileLayout) {
    return (
      <article className="special-unit-article-card">
        <div className="special-unit-article-profile-card">
          <div className="special-unit-article-profile-image-wrap">
            <img
              src={images[0].url}
              alt={article.title}
              className="special-unit-article-profile-image"
              loading="lazy"
            />
          </div>

          <div className="special-unit-article-profile-content">
            <h2>{article.title}</h2>

            <div
              className="special-unit-article-html special-unit-article-profile-html"
              dangerouslySetInnerHTML={{ __html: cleanContent }}
            />
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="special-unit-article-card">
      <div className="special-unit-article-card-head">
        <span className="special-unit-article-card-icon">
          {getArticleIcon(article, assets)}
        </span>

        <h2>{article.title}</h2>
      </div>

      {images.length > 0 && (
        <div className="special-unit-article-images-grid">
          {images.map((image, index) => (
            <img
              key={`${image.url}-${index}`}
              src={image.url}
              alt={article.title}
              className="special-unit-article-image"
              loading="lazy"
            />
          ))}
        </div>
      )}

      {videos.length > 0 && (
        <div className="special-unit-article-video-list">
          {videos.map((video, index) => (
            <div
              key={`${video.url}-${index}`}
              className="special-unit-article-video-card"
            >
              <video
                src={video.url}
                className="special-unit-article-video"
                controls
              />
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className="special-unit-article-file-card">
          {files.map((file, index) => {
            const extension = file.extension || "FILE";

            return (
              <div
                key={`${file.url}-${index}`}
                className="special-unit-file-box"
              >
                <span className="special-unit-file-extension">
                  {extension.toUpperCase()}
                </span>

                <div className="special-unit-file-info">
                  <h3>{article.title}</h3>

                  <p>
                    {isArabic
                      ? "يمكنك فتح الملف أو تحميله من الرابط التالي."
                      : "You can open or download the file from the link below."}
                  </p>

                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="special-unit-article-main-action"
                  >
                    <span>{isArabic ? "فتح الملف" : "Open file"}</span>
                    <ExternalLink size={18} strokeWidth={2.4} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {cleanContent && (
        <div
          className="special-unit-article-html"
          dangerouslySetInnerHTML={{ __html: cleanContent }}
        />
      )}
    </article>
  );
};
const SpecialUnitMenuItemView: React.FC<{
  item: SpecialUnitMenuItem;
  level: number;
  parentPath: number[];
  selectedArticleId: number | null;
  openMenuPath: number[];
  onOpenPath: (path: number[]) => void;
  onCloseAll: () => void;
  onOpenArticle: (item: SpecialUnitMenuItem) => void;
}> = ({
  item,
  level,
  parentPath,
  selectedArticleId,
  openMenuPath,
  onOpenPath,
  onCloseAll,
  onOpenArticle,
}) => {
  const itemRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const [dropdownPosition, setDropdownPosition] = useState({
    top: 0,
    right: 0,
    minWidth: 250,
  });

  const hasChildren = item.children.length > 0;
  const articleId = getMenuItemArticleId(item);
  const currentPath = [...parentPath, item.menuId];

  const isOpen = openMenuPath.includes(item.menuId);
  const isActive = Boolean(articleId && articleId === selectedArticleId);
  const canOpenArticle = Boolean(articleId);

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleCloseAll = () => {
    clearCloseTimer();

    closeTimerRef.current = window.setTimeout(() => {
      onCloseAll();
    }, 180);
  };

  const isMovingInsideMenu = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return false;

    return Boolean(
      target.closest(".special-unit-menu-bar") ||
      target.closest(".special-unit-floating-sub-menu"),
    );
  };

  const updateDropdownPosition = () => {
    const rect = itemRef.current?.getBoundingClientRect();

    if (!rect) return;

    const gap = 4;

    if (level === 0) {
      setDropdownPosition({
        top: rect.bottom + 8,
        right: Math.max(12, window.innerWidth - rect.right),
        minWidth: Math.max(rect.width, 250),
      });

      return;
    }

    const estimatedWidth = 250;
    const nextRight = window.innerWidth - rect.left + gap;
    const nextLeft = rect.left - estimatedWidth - gap;

    if (nextLeft < 12) {
      setDropdownPosition({
        top: rect.top,
        right: Math.max(12, window.innerWidth - rect.right),
        minWidth: Math.max(rect.width, 250),
      });

      return;
    }

    setDropdownPosition({
      top: rect.top,
      right: Math.max(12, nextRight),
      minWidth: Math.max(rect.width, 250),
    });
  };

  const openDropdown = () => {
    if (!hasChildren) return;

    clearCloseTimer();
    updateDropdownPosition();
    onOpenPath(currentPath);
  };

  const handleClick = () => {
    if (hasChildren) {
      clearCloseTimer();
      updateDropdownPosition();

      if (isOpen) {
        onOpenPath(parentPath);
      } else {
        onOpenPath(currentPath);
      }

      return;
    }

    if (articleId) {
      onOpenArticle(item);
    }
  };

  const handleMouseLeave = (event: React.MouseEvent) => {
    if (isMovingInsideMenu(event.relatedTarget)) return;
    scheduleCloseAll();
  };

  useEffect(() => {
    if (!isOpen || !hasChildren) return;

    const handleReposition = () => {
      updateDropdownPosition();
    };

    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);

    return () => {
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [isOpen, hasChildren, level]);

  useEffect(() => {
    return () => {
      clearCloseTimer();
    };
  }, []);

  return (
    <div
      ref={itemRef}
      className={`special-unit-menu-item level-${level} ${
        isOpen ? "open" : ""
      } ${isActive ? "active" : ""} ${
        !hasChildren && !canOpenArticle ? "is-static" : ""
      }`}
      onMouseEnter={openDropdown}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        className="special-unit-menu-link"
        onClick={handleClick}
        aria-expanded={hasChildren ? isOpen : undefined}
      >
        <span>{item.title}</span>

        {hasChildren && (
          <ChevronDown
            size={15}
            strokeWidth={2.5}
            className={`special-unit-menu-arrow ${isOpen ? "open" : ""}`}
          />
        )}
      </button>

      {hasChildren &&
        isOpen &&
        createPortal(
          <div
            className={`special-unit-sub-menu special-unit-floating-sub-menu level-${level}`}
            style={{
              top: dropdownPosition.top,
              right: dropdownPosition.right,
              minWidth: dropdownPosition.minWidth,
            }}
            onMouseEnter={clearCloseTimer}
            onMouseLeave={handleMouseLeave}
          >
            {item.children.map((child) => (
              <SpecialUnitMenuItemView
                key={`${child.menuId}-${child.title}`}
                item={child}
                level={level + 1}
                parentPath={currentPath}
                selectedArticleId={selectedArticleId}
                openMenuPath={openMenuPath}
                onOpenPath={onOpenPath}
                onCloseAll={onCloseAll}
                onOpenArticle={onOpenArticle}
              />
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
};
const SpecialUnitPage: React.FC = () => {
  const { abbr } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n } = useTranslation();

  const routeState = location.state as RouteState | null;

  const decodedAbbr = useMemo(() => {
    return decodeURIComponent(abbr || "").trim();
  }, [abbr]);

  const selectedLangId = useMemo(() => {
    return getLanguageId(i18n.language);
  }, [i18n.language]);

  const isRTL = i18n.dir() === "rtl";
  const isArabic = i18n.language.toLowerCase().startsWith("ar");

  const selectedArticleId = useMemo(() => {
    const articleId = Number(searchParams.get("articleId"));
    return isPositiveNumber(articleId) ? articleId : null;
  }, [searchParams]);

  const [unitTitle, setUnitTitle] = useState("");
  const [menuItems, setMenuItems] = useState<SpecialUnitMenuItem[]>([]);
  const [article, setArticle] = useState<SpecialUnitArticle | null>(null);
  const [openMenuPath, setOpenMenuPath] = useState<number[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [articleLoading, setArticleLoading] = useState(false);

  const [menuError, setMenuError] = useState("");
  const [articleError, setArticleError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadUnitTitle = async () => {
      if (!decodedAbbr) {
        setUnitTitle("");
        return;
      }

      const storageKey = `specialUnitTitle:${decodedAbbr.toLowerCase()}`;

      if (routeState?.title) {
        setUnitTitle(routeState.title);
        sessionStorage.setItem(storageKey, routeState.title);
        return;
      }

      const cachedTitle = sessionStorage.getItem(storageKey);

      if (cachedTitle) {
        setUnitTitle(cachedTitle);
        return;
      }

      setUnitTitle("");

      const findUnitTitle = async (langId: number) => {
        const response = await newsService.getSectorPage({
          articleId: SPECIAL_UNITS_LIST_ARTICLE_ID,
          lang: langId,
        });

        const units = extractSpecialUnitsFromHtml(
          response?.result?.content || "",
        );

        return units.find(
          (unit) => unit.abbr.toLowerCase() === decodedAbbr.toLowerCase(),
        );
      };

      try {
        let matchedUnit = await findUnitTitle(selectedLangId);

        if (!matchedUnit && selectedLangId !== 1) {
          matchedUnit = await findUnitTitle(1);
        }

        if (!isMounted) return;

        if (matchedUnit?.title) {
          setUnitTitle(matchedUnit.title);
          sessionStorage.setItem(storageKey, matchedUnit.title);
        }
      } catch (error) {
        console.error("Error loading special unit title:", error);
      }
    };

    loadUnitTitle();

    return () => {
      isMounted = false;
    };
  }, [decodedAbbr, routeState?.title, selectedLangId]);

  useEffect(() => {
    let isMounted = true;

    const fetchMenu = async () => {
      if (!decodedAbbr) {
        setMenuItems([]);
        setOpenMenuPath([]);
        setMenuLoading(false);
        setMenuError(isArabic ? "رابط الوحدة غير صحيح" : "Invalid unit URL");
        return;
      }

      setMenuLoading(true);
      setMenuError("");
      setMenuItems([]);
      setOpenMenuPath([]);
      setArticle(null);
      setArticleError("");

      try {
        const response = await newsService.getSpecialUnitsMenu({
          abbr: decodedAbbr,
        });

        if (!isMounted) return;

        const normalizedMenu = normalizeMenuItems(
          normalizeApiResponse(response),
        );

        setMenuItems(normalizedMenu);
      } catch (error) {
        console.error("Error fetching special unit menu:", error);

        if (isMounted) {
          setMenuItems([]);
          setMenuError(
            isArabic
              ? "حدث خطأ أثناء تحميل قوائم الوحدة."
              : "Something went wrong while loading the unit menu.",
          );
        }
      } finally {
        if (isMounted) {
          setMenuLoading(false);
        }
      }
    };

    fetchMenu();

    return () => {
      isMounted = false;
    };
  }, [decodedAbbr, isArabic]);

  useEffect(() => {
    if (!selectedArticleId || menuItems.length === 0) return;

    const parentMenuIds = openParentsForArticle(menuItems, selectedArticleId);
    setOpenMenuPath(parentMenuIds);
  }, [menuItems, selectedArticleId]);

  useEffect(() => {
    let isMounted = true;

    const fetchArticle = async () => {
      if (!selectedArticleId) {
        setArticle(null);
        setArticleError("");
        setArticleLoading(false);
        return;
      }

      setArticleLoading(true);
      setArticleError("");

      try {
        const response = await newsService.getSectorPage({
          articleId: selectedArticleId,
          lang: selectedLangId,
        });

        if (!isMounted) return;

        setArticle(response?.result || null);

        if (!response?.result) {
          setArticleError(
            isArabic
              ? "لا يوجد محتوى لهذه الصفحة."
              : "No content was found for this page.",
          );
        }
      } catch (error) {
        console.error("Error fetching special unit article:", error);

        if (isMounted) {
          setArticle(null);
          setArticleError(
            isArabic
              ? "حدث خطأ أثناء تحميل محتوى الصفحة."
              : "Something went wrong while loading the page content.",
          );
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
  }, [selectedArticleId, selectedLangId, isArabic]);

  const pageTitle = useMemo(() => {
    return unitTitle || routeState?.title || decodedAbbr;
  }, [unitTitle, routeState?.title, decodedAbbr]);
  const openMenuPathHandler = (path: number[]) => {
    setOpenMenuPath(path);
  };

  const closeAllMenus = () => {
    setOpenMenuPath([]);
  };
  const handleOpenArticle = (item: SpecialUnitMenuItem) => {
    const articleId = getMenuItemArticleId(item);

    if (!articleId) return;

    setOpenMenuPath([]);

    setSearchParams({
      articleId: String(articleId),
    });
  };

  const hasSelectedContent =
    Boolean(selectedArticleId) || articleLoading || Boolean(articleError);

  return (
    <main
      className={`special-unit-page-wrapper ${isRTL ? "is-rtl" : "is-ltr"}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <header className="special-unit-top-header">
        <div className="special-unit-top-header-overlay" />

        <div className="special-unit-top-header-inner">
          <button
            type="button"
            className="special-unit-back-btn"
            onClick={() => navigate("/")}
          >
            <span>
              {isArabic
                ? "الرجوع إلى موقع الجامعة"
                : "Back to university website"}
            </span>

            <ArrowRight size={24} strokeWidth={2.5} aria-hidden="true" />
          </button>

          <div className="special-unit-top-brand">
            <div className="special-unit-top-brand-text">
              <h1 className="special-unit-name">{pageTitle}</h1>

              <p className="special-unit-university-name">
                {isArabic ? "جامعة المنوفية" : "Menoufia University"}
              </p>
            </div>

            <button
              type="button"
              className="special-unit-top-logo-wrap"
              onClick={() => navigate("/")}
              aria-label={isArabic ? "الرجوع للرئيسية" : "Back to home"}
            >
              <img
                src={universityLogo}
                alt={isArabic ? "شعار جامعة المنوفية" : "Menoufia University"}
                className="special-unit-top-logo"
              />
            </button>
          </div>
        </div>
      </header>

      <section className="special-unit-menu-section">
        <div className="special-unit-menu-wrapper">
          {menuLoading ? (
            <div className="special-unit-menu-loading">
              {isArabic ? "جاري تحميل القوائم..." : "Loading menu..."}
            </div>
          ) : menuError ? (
            <div className="special-unit-menu-loading error">{menuError}</div>
          ) : menuItems.length === 0 ? (
            <div className="special-unit-menu-loading">
              {isArabic ? "لا توجد قوائم متاحة" : "No menu items available"}
            </div>
          ) : (
            <nav
              className={`special-unit-menu-bar ${
                menuItems.length > 12 ? "is-scrollable" : "is-balanced"
              }`}
              aria-label={pageTitle}
            >
              {menuItems.map((item) => (
                <SpecialUnitMenuItemView
                  key={`${item.menuId}-${item.title}`}
                  item={item}
                  level={0}
                  parentPath={[]}
                  selectedArticleId={selectedArticleId}
                  openMenuPath={openMenuPath}
                  onOpenPath={openMenuPathHandler}
                  onCloseAll={closeAllMenus}
                  onOpenArticle={handleOpenArticle}
                />
              ))}
            </nav>
          )}
        </div>
      </section>

      {hasSelectedContent && (
        <section className="special-unit-article-section">
          <div className="special-unit-article-wrapper">
            {articleLoading ? (
              <article className="special-unit-article-card special-unit-article-loading-card">
                <div className="special-unit-skeleton skeleton-title" />
                <div className="special-unit-skeleton skeleton-line" />
                <div className="special-unit-skeleton skeleton-line" />
                <div className="special-unit-skeleton skeleton-line short" />
              </article>
            ) : article ? (
              <SpecialUnitArticleRenderer
                article={article}
                isArabic={isArabic}
              />
            ) : articleError ? (
              <article className="special-unit-article-card special-unit-article-error-card">
                <h2>{articleError}</h2>

                <p>
                  {isArabic
                    ? "من فضلك جرّب اختيار عنصر آخر من القائمة."
                    : "Please try choosing another menu item."}
                </p>
              </article>
            ) : null}
          </div>
        </section>
      )}
    </main>
  );
};

export default SpecialUnitPage;
