import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Download,
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

import "../SpecialUnitPage/SpecialUnitPage.css";
import "./GeneralAdministrationsPage.css";

type GeneralAdministrationMenuItem = {
  menuId: number;
  parentId: number | null;
  sortOrder: number;
  title: string;
  articleId: number | null;
  url: string;
  children: GeneralAdministrationMenuItem[];
  apiIndex: number;
};

type GeneralAdministrationArticle = {
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
  keyword?: string;
};

type DropdownPosition = {
  top: number;
  right: number;
  left: number;
  minWidth: number;
};

const getFallbackLanguageIds = (languageId: number) => {
  return Array.from(new Set([languageId, 2, 1])).filter((id) => {
    return Number.isFinite(id) && id > 0;
  });
};

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

const getMenuItemArticleId = (item: GeneralAdministrationMenuItem) => {
  if (isPositiveNumber(item.articleId)) {
    return Number(item.articleId);
  }

  return extractLegacyArticleIdFromUrl(item.url);
};

const sortMenuItems = (items: GeneralAdministrationMenuItem[]) => {
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
): GeneralAdministrationMenuItem | null => {
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
      (
        child: GeneralAdministrationMenuItem | null,
      ): child is GeneralAdministrationMenuItem => child !== null,
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

const flattenMenuItems = (items: GeneralAdministrationMenuItem[]) => {
  const flatItems: GeneralAdministrationMenuItem[] = [];

  const walk = (menuItems: GeneralAdministrationMenuItem[]) => {
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

const buildMenuTree = (items: GeneralAdministrationMenuItem[]) => {
  const itemMap = new Map<number, GeneralAdministrationMenuItem>();

  sortMenuItems(items).forEach((item) => {
    itemMap.set(item.menuId, {
      ...item,
      children: [],
    });
  });

  const rootItems: GeneralAdministrationMenuItem[] = [];

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

  const sortTree = (menuItems: GeneralAdministrationMenuItem[]) => {
    const sortedItems = sortMenuItems(menuItems);

    sortedItems.forEach((item) => {
      item.children = sortTree(item.children);
    });

    return sortedItems;
  };

  return sortTree(rootItems);
};

const normalizeMenuItems = (data: any[]): GeneralAdministrationMenuItem[] => {
  const normalizedItems = data
    .map((item, index) => normalizeMenuItem(item, index))
    .filter(
      (
        item: GeneralAdministrationMenuItem | null,
      ): item is GeneralAdministrationMenuItem => item !== null,
    );

  return buildMenuTree(flattenMenuItems(normalizedItems));
};

const openParentsForArticle = (
  items: GeneralAdministrationMenuItem[],
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
    // Plain text fallback below.
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
  article: GeneralAdministrationArticle,
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

const GeneralAdministrationArticleRenderer: React.FC<{
  article: GeneralAdministrationArticle;
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
    <article className="special-unit-article-card general-administration-article-card">
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
            const extension = (file.extension || "FILE").toUpperCase();
            const isPdf = extension === "PDF";

            return (
              <div
                key={`${file.url}-${index}`}
                className={`special-unit-file-box ${isPdf ? "is-pdf" : ""}`}
              >
                <div className="special-unit-file-preview" aria-hidden="true">
                  <span className="special-unit-file-extension">
                    {extension}
                  </span>
                </div>

                <div className="special-unit-file-info">
                  <h3>{article.title}</h3>

                  <p>
                    {isArabic ? "نوع الملف:" : "File type:"}{" "}
                    <strong>{extension}</strong>
                  </p>

                  <div className="special-unit-file-actions">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="special-unit-article-main-action special-unit-article-main-action--primary"
                    >
                      <span>{isArabic ? "عرض الملف" : "View file"}</span>
                      <ExternalLink size={17} strokeWidth={2.4} />
                    </a>

                    <a
                      href={file.url}
                      download
                      className="special-unit-article-main-action special-unit-article-main-action--outline"
                    >
                      <span>{isArabic ? "تحميل الملف" : "Download file"}</span>
                      <Download size={17} strokeWidth={2.4} />
                    </a>
                  </div>
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

const GeneralAdministrationMenuItemView: React.FC<{
  item: GeneralAdministrationMenuItem;
  level: number;
  parentPath: number[];
  selectedArticleId: number | null;
  openMenuPath: number[];
  isRtl: boolean;
  onOpenPath: (path: number[]) => void;
  onCloseAll: () => void;
  onOpenArticle: (item: GeneralAdministrationMenuItem) => void;
}> = ({
  item,
  level,
  parentPath,
  selectedArticleId,
  openMenuPath,
  isRtl,
  onOpenPath,
  onCloseAll,
  onOpenArticle,
}) => {
  const itemRef = useRef<HTMLDivElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  const hasChildren = item.children.length > 0;
  const articleId = getMenuItemArticleId(item);
  const currentPath = [...parentPath, item.menuId];

  const isOpen = currentPath.every((id, index) => openMenuPath[index] === id);
  const isActive = articleId !== null && articleId === selectedArticleId;

  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>({
    top: 0,
    right: 0,
    left: 0,
    minWidth: 250,
  });

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const updateDropdownPosition = () => {
    const element = itemRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const viewportPadding = 10;
    const minWidth = Math.max(rect.width, 250);

    if (level === 0) {
      setDropdownPosition({
        top: rect.bottom + 6,
        right: Math.max(window.innerWidth - rect.right, viewportPadding),
        left: Math.max(rect.left, viewportPadding),
        minWidth,
      });

      return;
    }

    if (isRtl) {
      setDropdownPosition({
        top: rect.top,
        right: Math.max(window.innerWidth - rect.left + 6, viewportPadding),
        left: viewportPadding,
        minWidth,
      });

      return;
    }

    const preferredLeft = rect.right + 6;
    const fallbackLeft = rect.left - minWidth - 6;

    setDropdownPosition({
      top: rect.top,
      right: viewportPadding,
      left:
        preferredLeft + minWidth <= window.innerWidth - viewportPadding
          ? preferredLeft
          : Math.max(fallbackLeft, viewportPadding),
      minWidth,
    });
  };

  const handleMouseEnter = () => {
    clearCloseTimer();

    if (hasChildren) {
      updateDropdownPosition();
      onOpenPath(currentPath);
    }
  };

  const handleMouseLeave = () => {
    clearCloseTimer();

    closeTimerRef.current = window.setTimeout(() => {
      onCloseAll();
    }, 160);
  };

  const handleClick = () => {
    if (hasChildren) {
      updateDropdownPosition();
      onOpenPath(isOpen ? parentPath : currentPath);
      return;
    }

    if (articleId) {
      onOpenArticle(item);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleWindowChange = () => {
      updateDropdownPosition();
    };

    window.addEventListener("scroll", handleWindowChange, true);
    window.addEventListener("resize", handleWindowChange);

    return () => {
      window.removeEventListener("scroll", handleWindowChange, true);
      window.removeEventListener("resize", handleWindowChange);
    };
  }, [isOpen, isRtl]);

  return (
    <div
      ref={itemRef}
      className={`special-unit-menu-item level-${level} ${
        isOpen ? "open" : ""
      } ${isActive ? "active" : ""} ${
        !articleId && !hasChildren ? "is-static" : ""
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        type="button"
        className="special-unit-menu-link"
        onClick={handleClick}
      >
        <span>{item.title}</span>

        {hasChildren && (
          <ChevronDown
            size={15}
            strokeWidth={2.4}
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
              minWidth: dropdownPosition.minWidth,
              ...(isRtl
                ? { right: dropdownPosition.right }
                : { left: dropdownPosition.left }),
            }}
            onMouseEnter={clearCloseTimer}
            onMouseLeave={handleMouseLeave}
          >
            {item.children.map((child) => (
              <GeneralAdministrationMenuItemView
                key={`${child.menuId}-${child.title}`}
                item={child}
                level={level + 1}
                parentPath={currentPath}
                selectedArticleId={selectedArticleId}
                openMenuPath={openMenuPath}
                isRtl={isRtl}
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

const GeneralAdministrationsPage: React.FC = () => {
  const { keyword, articleId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n } = useTranslation();

  const routeState = location.state as RouteState | null;

  const decodedKeyword = useMemo(() => {
    return decodeURIComponent(keyword || "").trim();
  }, [keyword]);

  const selectedLangId = useMemo(() => {
    return getLanguageId(i18n.language);
  }, [i18n.language]);

  const isRtl = i18n.dir() === "rtl";
  const isArabic = i18n.language.toLowerCase().startsWith("ar");

  const selectedArticleId = useMemo(() => {
    const routeArticleId = Number(articleId);
    if (isPositiveNumber(routeArticleId)) return routeArticleId;

    const queryArticleId = Number(searchParams.get("articleId"));
    return isPositiveNumber(queryArticleId) ? queryArticleId : null;
  }, [articleId, searchParams]);

  const [pageTitle, setPageTitle] = useState("");
  const [menuItems, setMenuItems] = useState<GeneralAdministrationMenuItem[]>(
    [],
  );
  const [article, setArticle] =
    useState<GeneralAdministrationArticle | null>(null);

  const [openMenuPath, setOpenMenuPath] = useState<number[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);
  const [articleLoading, setArticleLoading] = useState(false);

  const [menuError, setMenuError] = useState("");
  const [articleError, setArticleError] = useState("");

  useEffect(() => {
    if (!decodedKeyword) {
      setPageTitle("");
      return;
    }

    const normalizedKeyword = decodedKeyword.toLowerCase();
    const storageKeys = [
      `generalAdministrationTitle:${selectedLangId}:${normalizedKeyword}`,
      `generalAdministrationTitle:2:${normalizedKeyword}`,
      `generalAdministrationTitle:1:${normalizedKeyword}`,
    ];

    const cachedTitle = storageKeys
      .map((key) => sessionStorage.getItem(key))
      .find(Boolean);

    if (cachedTitle) {
      setPageTitle(cachedTitle);
      return;
    }

    if (routeState?.title) {
      setPageTitle(routeState.title);
      return;
    }

    setPageTitle(decodedKeyword);
  }, [decodedKeyword, routeState?.title, selectedLangId]);

  useEffect(() => {
    let isMounted = true;

    const fetchMenu = async () => {
      if (!decodedKeyword) {
        setMenuItems([]);
        setMenuError(
          isArabic ? "رابط الإدارة غير صحيح." : "Invalid administration link.",
        );
        setMenuLoading(false);
        return;
      }

      setMenuLoading(true);
      setMenuError("");
      setMenuItems([]);

      let resolvedMenuItems: GeneralAdministrationMenuItem[] = [];

      for (const langId of getFallbackLanguageIds(selectedLangId)) {
        try {
          const response = await newsService.getSectorMenu({
            keyword: decodedKeyword,
            lang: langId,
          });

          const rawItems = normalizeApiResponse(response);
          const normalizedItems = normalizeMenuItems(rawItems);

          if (normalizedItems.length > 0) {
            resolvedMenuItems = normalizedItems;
            break;
          }
        } catch (error) {
          console.error(
            `Error fetching general administration menu lang=${langId}:`,
            error,
          );
        }
      }

      if (!isMounted) return;

      setMenuItems(resolvedMenuItems);

      if (resolvedMenuItems.length === 0) {
        setMenuError(
          isArabic
            ? "لا توجد قوائم متاحة لهذه الإدارة."
            : "No menu items are available for this administration.",
        );
      }

      setMenuLoading(false);
    };

    fetchMenu();

    return () => {
      isMounted = false;
    };
  }, [decodedKeyword, selectedLangId, isArabic]);

  useEffect(() => {
    if (!selectedArticleId) {
      setArticle(null);
      setArticleError("");
      setArticleLoading(false);
      return;
    }

    let isMounted = true;

    const fetchArticleByLang = async (langId: number) => {
      const response = await newsService.getSectorPage({
        articleId: selectedArticleId,
        lang: langId,
      });

      return response?.result || response?.data?.result || null;
    };

    const fetchArticle = async () => {
      setArticleLoading(true);
      setArticle(null);
      setArticleError("");

      try {
        let selectedArticle: GeneralAdministrationArticle | null = null;

        for (const langId of getFallbackLanguageIds(selectedLangId)) {
          try {
            selectedArticle = await fetchArticleByLang(langId);

            if (selectedArticle) {
              break;
            }
          } catch (error) {
            console.error(
              `Error fetching general administration article lang=${langId}:`,
              error,
            );
          }
        }

        if (!isMounted) return;

        setArticle(selectedArticle);

        if (!selectedArticle) {
          setArticleError(
            isArabic
              ? "لا يوجد محتوى لهذه الصفحة."
              : "No content was found for this page.",
          );
        }
      } catch (error) {
        console.error("Error fetching general administration article:", error);

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

  useEffect(() => {
    if (!selectedArticleId || menuItems.length === 0) return;

    const parents = openParentsForArticle(menuItems, selectedArticleId);

    if (parents.length > 0) {
      setOpenMenuPath(parents);
    }
  }, [menuItems, selectedArticleId]);

  const handleOpenMenuPath = (path: number[]) => {
    setOpenMenuPath(path);
  };

  const handleCloseAllMenus = () => {
    setOpenMenuPath([]);
  };

  const handleOpenArticle = (item: GeneralAdministrationMenuItem) => {
    const resolvedArticleId = getMenuItemArticleId(item);

    if (!resolvedArticleId) return;

    setOpenMenuPath([]);

    setSearchParams({
      articleId: String(resolvedArticleId),
    });
  };

  const hasSelectedContent =
    Boolean(selectedArticleId) || articleLoading || Boolean(articleError);

  const BackIcon = isRtl ? ArrowRight : ArrowLeft;

  return (
    <main
      className={`special-unit-page-wrapper general-administration-page-wrapper ${
        isRtl ? "is-rtl" : "is-ltr"
      }`}
      dir={isRtl ? "rtl" : "ltr"}
      lang={i18n.language}
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

            <BackIcon size={24} strokeWidth={2.5} aria-hidden="true" />
          </button>

          <div className="special-unit-top-brand">
            <div className="special-unit-top-brand-text">
              <h1 className="special-unit-name">
                {pageTitle ||
                  (isArabic ? "الإدارات العامة" : "General Administrations")}
              </h1>

              <p className="special-unit-university-name">
                {isArabic ? "جامعة المنوفية" : "Menoufia University"}
              </p>
            </div>

            <button
              type="button"
              className="special-unit-top-logo-wrap general-administration-top-logo-wrap"
              onClick={() => navigate("/")}
              aria-label={isArabic ? "الرجوع للرئيسية" : "Back to home"}
            >
              <img
                src={universityLogo}
                alt={
                  isArabic
                    ? "شعار جامعة المنوفية"
                    : "Menoufia University Logo"
                }
                className="general-administration-top-logo-img"
                loading="eager"
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
                <GeneralAdministrationMenuItemView
                  key={`${item.menuId}-${item.title}`}
                  item={item}
                  level={0}
                  parentPath={[]}
                  selectedArticleId={selectedArticleId}
                  openMenuPath={openMenuPath}
                  isRtl={isRtl}
                  onOpenPath={handleOpenMenuPath}
                  onCloseAll={handleCloseAllMenus}
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
              <GeneralAdministrationArticleRenderer
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

export default GeneralAdministrationsPage;