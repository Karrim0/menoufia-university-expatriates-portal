import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ChevronDown, ChevronLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import newsService from "../Services/newsService";
import logo from "../assets/logo.jpg";
import "./UniversitySectorsPage.css";

const SECTOR_CONFIG = {
  univpres: {
    ar: "قطاع رئيس الجامعة",
    en: "University President Sector",
  },
  educ: {
    ar: "قطاع نائب شؤون التعليم والطلاب",
    en: "Education and Students Affairs Sector",
  },
  env: {
    ar: "قطاع نائب شؤون خدمة المجتمع وتنمية البيئة",
    en: "Community Service and Environmental Development Sector",
  },
  postgrad: {
    ar: "قطاع نائب شؤون الدراسات العليا والبحوث",
    en: "Postgraduate Studies and Research Sector",
  },
  secr: {
    ar: "قطاع أمين عام الجامعة",
    en: "University Secretary General Sector",
  },
};

const FIXED_TABS = [
  {
    key: "high-admin",
    ar: "الإدارة العليا",
    en: "Top Administration",
    titles: [
      "الإدارة العليا",
      "الادارة العليا",
      "Top Administration",
      "Higher Administration",
      "Senior Administration",
    ],
  },
  {
    key: "related-admins",
    ar: "الإدارات التابعة",
    en: "Related Administrations",
    titles: [
      "الإدارات التابعة",
      "الادارات التابعة",
      "Related Administrations",
      "Affiliated Administrations",
      "Sub Administrations",
    ],
  },
  {
    key: "president",
    ar: "رئيس الجامعة",
    en: "University President",
    titles: ["رئيس الجامعة", "University President", "President"],
  },
];

const cleanText = (value = "") => {
  const textarea = document.createElement("textarea");
  textarea.innerHTML = String(value || "");

  return textarea.value.replace(/\s+/g, " ").trim();
};

const cleanMenuTitle = (title = "") => cleanText(title);

const normalizeTitle = (title = "") => {
  return cleanMenuTitle(title)
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[ىي]/g, "ي")
    .replace(/\s+/g, "")
    .toLowerCase();
};

const isExternalUrl = (url = "") => {
  return /^https?:\/\//i.test(String(url || ""));
};

const hasArticleId = (item) => {
  return (
    item?.articleId !== null &&
    item?.articleId !== undefined &&
    Number(item.articleId) > 0
  );
};

const cleanMenuTree = (items = []) => {
  if (!Array.isArray(items)) return [];

  return items
    .filter((item) => item && typeof item === "object")
    .filter((item) => cleanMenuTitle(item.title).length > 0)
    .map((item) => ({
      ...item,
      title: cleanMenuTitle(item.title),
      children: cleanMenuTree(Array.isArray(item.children) ? item.children : []),
    }))
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
};

const getChildren = (item) => {
  return Array.isArray(item?.children)
    ? item.children
        .filter((child) => child && typeof child === "object")
        .filter((child) => cleanMenuTitle(child.title).length > 0)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    : [];
};

const getMenuLink = (item, keyword) => {
  if (hasArticleId(item)) {
    return `/university-sectors/${keyword}?articleId=${item.articleId}`;
  }

  if (isExternalUrl(item.url)) {
    return item.url;
  }

  return `/university-sectors/${keyword}`;
};

const buildFixedMenu = (menu, isArabic) => {
  const cleanMenu = cleanMenuTree(menu);

  return FIXED_TABS.map((tab) => {
    const normalizedTitles = tab.titles.map(normalizeTitle);

    const matched = cleanMenu.find((item) =>
      normalizedTitles.includes(normalizeTitle(item.title))
    );

    if (!matched) {
      return {
        menuId: tab.key,
        parentId: null,
        sortOrder: 0,
        title: isArabic ? tab.ar : tab.en,
        articleId: null,
        url: "#",
        children: [],
      };
    }

    return {
      ...matched,
      title: isArabic ? tab.ar : tab.en,
      children: getChildren(matched),
    };
  });
};

const findFirstArticleItem = (items = []) => {
  for (const item of items) {
    if (hasArticleId(item)) {
      return item;
    }

    const foundChild = findFirstArticleItem(getChildren(item));

    if (foundChild) {
      return foundChild;
    }
  }

  return null;
};
const flattenMenuItems = (items = []) => {
  const result = [];

  const walk = (list = []) => {
    list.forEach((item) => {
      if (!item || !cleanMenuTitle(item.title)) return;

      result.push({
        ...item,
        children: [],
      });

      const children = getChildren(item);

      if (children.length > 0) {
        walk(children);
      }
    });
  };

  walk(items);

  return result.filter(
    (item, index, array) =>
      array.findIndex((current) => current.menuId === item.menuId) === index
  );
};
const stripHtml = (html = "") => {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = html;

  return wrapper.textContent?.replace(/\s+/g, " ").trim() || "";
};

const extractFirstUrl = (html = "") => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const link = doc.querySelector("a[href]");
  const img = doc.querySelector("img[src]");
  const video = doc.querySelector("video[src], video source[src]");

  return (
    link?.getAttribute("href") ||
    img?.getAttribute("src") ||
    video?.getAttribute("src") ||
    ""
  );
};

const getExtension = (url = "") => {
  const cleanUrl = String(url).split("?")[0].toLowerCase();
  const match = cleanUrl.match(/\.([a-z0-9]+)$/);

  return match?.[1] || "";
};

const getGoogleViewerUrl = (url) => {
  return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(
    url
  )}`;
};

const SectorMenuItem = ({ item, keyword, level = 0 }) => {
  const [open, setOpen] = useState(false);

  const children = getChildren(item);
  const hasChildren = children.length > 0;
  const itemHasArticle = hasArticleId(item);
  const link = getMenuLink(item, keyword);
  const external = isExternalUrl(link);

  const toggleDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!hasChildren) return;

    setOpen((prev) => !prev);
  };

  const label = <span>{cleanMenuTitle(item.title)}</span>;

  const arrow =
    hasChildren &&
    (level === 0 ? (
      <ChevronDown
        size={22}
        className={`usp-menu-arrow ${open ? "open" : ""}`}
      />
    ) : (
      <ChevronLeft
        size={16}
        className={`usp-menu-arrow ${open ? "open" : ""}`}
      />
    ));

  const renderLabel = () => {
    if (itemHasArticle) {
      return external ? (
        <a
          href={link}
          className="usp-menu-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          {label}
        </a>
      ) : (
        <Link to={link} className="usp-menu-link">
          {label}
        </Link>
      );
    }

    if (external) {
      return (
        <a
          href={link}
          className="usp-menu-link"
          target="_blank"
          rel="noopener noreferrer"
        >
          {label}
        </a>
      );
    }

    return (
      <button
        type="button"
        className="usp-menu-link"
        onClick={hasChildren ? toggleDropdown : undefined}
      >
        {label}
      </button>
    );
  };

  return (
    <div
      className={`usp-menu-item level-${level} ${
        hasChildren ? "has-children" : ""
      } ${open ? "open" : ""}`}
      onMouseEnter={() => hasChildren && setOpen(true)}
      onMouseLeave={() => hasChildren && setOpen(false)}
    >
      <div className="usp-menu-link-wrap">
        {renderLabel()}

        {hasChildren && (
          <button
            type="button"
            className="usp-menu-arrow-btn"
            onClick={toggleDropdown}
            aria-label="toggle menu"
          >
            {arrow}
          </button>
        )}
      </div>

      {hasChildren && open && (
        <div className="usp-sub-menu">
          {children.map((child) => (
            <SectorMenuItem
              key={child.menuId}
              item={child}
              keyword={keyword}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ArticleRenderer = ({ article, isArabic }) => {
  if (!article) return null;

  const content = article.content || "";
  const plainText = stripHtml(content);
  const firstUrl = extractFirstUrl(content);
  const extension = getExtension(firstUrl);

  const hasImage = /<img/i.test(content);
  const isImageOnly = hasImage && plainText.length < 100;
  const isFile = ["pdf", "doc", "docx", "xls", "xlsx"].includes(extension);
  const isVideo = ["mp4", "webm", "ogg"].includes(extension);

  if (isFile && firstUrl) {
    const viewerUrl =
      extension === "pdf" ? firstUrl : getGoogleViewerUrl(firstUrl);

    return (
      <section className="usp-article-section" dir={isArabic ? "rtl" : "ltr"}>
        <div className="usp-section-heading">
          <span className="usp-orange-dot" />
          <h2>{article.title}</h2>
        </div>

        <div className="usp-file-card">
          <div className="usp-file-preview">
            <div className="usp-file-circle">
              <i className="fa-regular fa-file-pdf" />
            </div>
          </div>

          <div className="usp-file-info">
            <div className="usp-card-title">
              <div className="usp-card-icon">
                <i className="fa-regular fa-file-lines" />
              </div>

              <h3>{article.title}</h3>
            </div>

            <p className="usp-file-type">
              {isArabic ? "نوع الملف : " : "File type: "}
              <strong>{extension.toUpperCase()}</strong>
              <i className="fa-regular fa-file-pdf" />
            </p>

            <div className="usp-file-actions">
              <a
                href={viewerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="usp-view-file"
              >
                <i className="fa-regular fa-eye" />
                {isArabic ? "عرض الملف" : "View file"}
              </a>

              <a href={firstUrl} download className="usp-download-file">
                <i className="fa-solid fa-download" />
                {isArabic ? "تحميل الملف" : "Download"}
              </a>
            </div>
          </div>
        </div>

        <div className="usp-file-note">
          <i className="fa-solid fa-circle-info" />
          <span>
            {isArabic
              ? "لعرض محتوى الملف يرجى الضغط على زر عرض الملف."
              : "To view the file content, please click View file."}
          </span>
        </div>
      </section>
    );
  }

  if (isVideo && firstUrl) {
    return (
      <section className="usp-article-section" dir={isArabic ? "rtl" : "ltr"}>
        <div className="usp-section-heading">
          <span className="usp-orange-dot" />
          <h2>{article.title}</h2>
        </div>

        <div className="usp-article-card">
          <div className="usp-card-title">
            <div className="usp-card-icon">
              <i className="fa-regular fa-file-video" />
            </div>

            <h3>{article.title}</h3>
          </div>

          <video className="usp-video" src={firstUrl} controls />
        </div>
      </section>
    );
  }

  if (isImageOnly) {
    return (
      <section className="usp-article-section" dir={isArabic ? "rtl" : "ltr"}>
        <div className="usp-section-heading">
          <span className="usp-orange-dot" />
          <h2>{article.title}</h2>
        </div>

        <div
          className="usp-article-card usp-image-only"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </section>
    );
  }

  return (
    <section className="usp-article-section" dir={isArabic ? "rtl" : "ltr"}>
      <div className="usp-section-heading">
        <span className="usp-orange-dot" />
        <h2>{article.title}</h2>
      </div>

      <div className="usp-article-card">
        <div className="usp-card-title">
          <div className="usp-card-icon">
            <i className="fa-regular fa-file-lines" />
          </div>

          <h3>{article.title}</h3>
        </div>

        <div
          className="usp-html-content"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </section>
  );
};

const UniversitySectorsPage = () => {
  const { keyword = "univpres" } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  const isArabic = i18n.language === "ar";

  const savedLang = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("lang") || "{}");
    } catch {
      return {};
    }
  }, [i18n.language]);

  const lang = Number(savedLang?.id) || (isArabic ? 1 : 2);
  const articleId = searchParams.get("articleId");

  const sector = SECTOR_CONFIG[keyword] || SECTOR_CONFIG.univpres;
  const sectorTitle = isArabic ? sector.ar : sector.en;

  const [menu, setMenu] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [article, setArticle] = useState(null);
  const [articleLoading, setArticleLoading] = useState(false);

  const visibleMenu = useMemo(() => {
    if (keyword === "univpres") {
      return buildFixedMenu(menu, isArabic);
    }

    return cleanMenuTree(menu);
  }, [menu, isArabic, keyword]);
const flatVisibleMenu = useMemo(() => {
  return flattenMenuItems(visibleMenu);
}, [visibleMenu]);
  useEffect(() => {
    let mounted = true;

    const fetchMenu = async () => {
      setMenuLoading(true);

      try {
        const response = await newsService.getSectorMenu({
          keyword,
          lang,
        });

        if (!mounted) return;

        setMenu(cleanMenuTree(Array.isArray(response?.result) ? response.result : []));
      } catch (error) {
        console.error("Failed to fetch university sector menu:", error);

        if (mounted) {
          setMenu([]);
        }
      } finally {
        if (mounted) {
          setMenuLoading(false);
        }
      }
    };

    fetchMenu();

    return () => {
      mounted = false;
    };
  }, [keyword, lang]);

  useEffect(() => {
    if (menuLoading || articleId || visibleMenu.length === 0) return;

    const firstArticleItem = findFirstArticleItem(visibleMenu);

    if (!firstArticleItem) return;

    navigate(
      `/university-sectors/${keyword}?articleId=${firstArticleItem.articleId}`,
      { replace: true }
    );
  }, [menuLoading, articleId, visibleMenu, keyword, navigate]);

  useEffect(() => {
    let mounted = true;

    const fetchArticle = async () => {
      if (!articleId) {
        setArticle(null);
        return;
      }

      const numericArticleId = Number(articleId);

      if (!numericArticleId) {
        setArticle(null);
        return;
      }

      setArticleLoading(true);

      try {
        const response = await newsService.getSectorPage({
          articleId: numericArticleId,
          lang,
        });

        if (!mounted) return;

        setArticle(response?.result || null);
      } catch (error) {
        console.error("Failed to fetch university sector article:", error);

        if (mounted) {
          setArticle(null);
        }
      } finally {
        if (mounted) {
          setArticleLoading(false);
        }
      }
    };

    fetchArticle();

    return () => {
      mounted = false;
    };
  }, [articleId, lang]);

  return (
    <main className="usp-page" dir={isArabic ? "rtl" : "ltr"}>
      <section className="usp-header">
        <div className="usp-header-inner">
          <div className="usp-brand">
            <img src={logo} alt="Menoufia University" />

            <div className="usp-brand-text">
              <p>{isArabic ? "جامعة المنوفية" : "Menoufia University"}</p>
              <h1>{sectorTitle}</h1>
            </div>
          </div>
        </div>
      </section>

      <section className="usp-menu-section">
        <div className="usp-menu-wrapper">
          {menuLoading ? (
            <div className="usp-menu-loading">
              {isArabic ? "جاري تحميل القائمة..." : "Loading menu..."}
            </div>
          ) : (
            <div
              className={`usp-menu-bar ${
                keyword === "univpres"
                  ? "usp-menu-bar-fixed"
                  : "usp-menu-bar-dynamic"
              }`}
            >
              {visibleMenu.map((item) => (
                <SectorMenuItem
                  key={item.menuId}
                  item={item}
                  keyword={keyword}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {articleId ? (
        articleLoading ? (
          <div className="usp-state-message">
            {isArabic ? "جاري تحميل الصفحة..." : "Loading page..."}
          </div>
        ) : article ? (
          <ArticleRenderer article={article} isArabic={isArabic} />
        ) : (
          <div className="usp-state-message">
            {isArabic ? "لم يتم العثور على الصفحة" : "Page not found"}
          </div>
        )
      ) : (
        <div className="usp-state-message">
          {isArabic ? "جاري تحميل أول صفحة..." : "Loading first page..."}
        </div>
      )}
    </main>
  );
};

export default UniversitySectorsPage;