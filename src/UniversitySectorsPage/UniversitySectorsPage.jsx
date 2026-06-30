import React, { useEffect, useMemo, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { ChevronDown, ChevronLeft } from "lucide-react";
import { useTranslation } from "react-i18next";
import newsService from "../Services/newsService";
import SectorsNews from "../SectorsNewsPage/SectorsNews";
import logo from "../assets/logo.jpg";
import "./UniversitySectorsPage.css";

const SECTOR_CONFIG = {
  univpres: {
    ar: "قطاع رئيس الجامعة",
    en: "University President Sector",
  },
  cenev: {
    ar: "مركز القياس والتقويم",
    en: "CENEVA Center",
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
    titles: ["الإدارة العليا", "الادارة العليا", "Top Administration"],
  },
  {
    key: "related-admins",
    ar: "الإدارات التابعة",
    en: "Related Administrations",
    titles: ["الإدارات التابعة", "الادارات التابعة", "Related Administrations"],
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

const normalizeTitle = (title = "") =>
  cleanMenuTitle(title)
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[ىي]/g, "ي")
    .replace(/\s+/g, "")
    .toLowerCase();

const isExternalUrl = (url = "") => /^https?:\/\//i.test(String(url || ""));

const extractArticleIdFromUrl = (url = "") => {
  const value = String(url || "");

  const patterns = [
    /\/View\/(\d+)(?:\/|$|\?)/i,
    /\/view\/(\d+)(?:\/|$|\?)/i,
    /\/UnivPresPage\/(\d+)(?:\/|$|\?)/i,
    /[?&](?:articleId|ArticleId|id|Id)=([0-9]+)/i,
  ];

  for (const pattern of patterns) {
    const match = value.match(pattern);

    if (match?.[1]) {
      const articleId = Number(match[1]);

      if (Number.isFinite(articleId) && articleId > 0) {
        return articleId;
      }
    }
  }

  return null;
};

const getMenuItemArticleId = (item) => {
  const directArticleId = Number(item?.articleId);

  if (Number.isFinite(directArticleId) && directArticleId > 0) {
    return directArticleId;
  }

  return extractArticleIdFromUrl(item?.url);
};

const hasArticleId = (item) => Boolean(getMenuItemArticleId(item));

const cleanMenuTree = (items = []) => {
  if (!Array.isArray(items)) return [];

  return items
    .filter((item) => item && typeof item === "object")
    .filter((item) => cleanMenuTitle(item.title).length > 0)
    .map((item) => ({
      ...item,
      title: cleanMenuTitle(item.title),
      children: cleanMenuTree(
        Array.isArray(item.children) ? item.children : [],
      ),
    }))
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
};

const getChildren = (item) =>
  Array.isArray(item?.children)
    ? item.children
        .filter((child) => child && typeof child === "object")
        .filter((child) => cleanMenuTitle(child.title).length > 0)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    : [];

const getMenuLink = (item, keyword) => {
  const articleId = getMenuItemArticleId(item);

  if (articleId) {
    return `/university-sectors/${encodeURIComponent(keyword)}?articleId=${articleId}`;
  }

  if (getChildren(item).length > 0) {
    return `/university-sectors/${encodeURIComponent(keyword)}`;
  }

  return "/404";
};

const buildFixedMenu = (menu, isArabic) => {
  const cleanMenu = cleanMenuTree(menu);

  return FIXED_TABS.map((tab) => {
    const normalizedTitles = tab.titles.map(normalizeTitle);

    const matched = cleanMenu.find((item) =>
      normalizedTitles.includes(normalizeTitle(item.title)),
    );

    if (!matched) {
      return {
        menuId: tab.key,
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

const SectorMenuItem = ({ item, keyword, pageTitle, level = 0 }) => {
  const [open, setOpen] = useState(false);

  const children = getChildren(item);
  const hasChildren = children.length > 0;
  const link = getMenuLink(item, keyword);
  const external = isExternalUrl(link);

  const toggleDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (hasChildren) {
      setOpen((prev) => !prev);
    }
  };

  const label = <span>{cleanMenuTitle(item.title)}</span>;

  const arrow =
    hasChildren &&
    (level === 0 ? (
      <ChevronDown
        size={20}
        className={`usp-menu-arrow ${open ? "open" : ""}`}
      />
    ) : (
      <ChevronLeft
        size={16}
        className={`usp-menu-arrow ${open ? "open" : ""}`}
      />
    ));

  const renderLabel = () => {
    if (hasArticleId(item)) {
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
        <Link to={link} className="usp-menu-link" state={{ title: pageTitle }}>
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
              pageTitle={pageTitle}
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

  return (
    <section className="usp-article-section" dir={isArabic ? "rtl" : "ltr"}>
      <div className="usp-section-heading">
        <span className="usp-orange-dot" />
        <h2>{article.title}</h2>
      </div>

      <div
        className="usp-article-card"
        dangerouslySetInnerHTML={{ __html: article.content || "" }}
      />
    </section>
  );
};

const UniversitySectorsPage = () => {
  const { keyword = "univpres" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const routeState = location.state || {};
  const normalizedKeyword = String(keyword || "").toLowerCase();
  const [searchParams] = useSearchParams();
  const { i18n } = useTranslation();

  const isArabic = i18n.language === "ar";
  const articleId = searchParams.get("articleId");

  const savedLang = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("lang") || "{}");
    } catch {
      return {};
    }
  }, [i18n.language]);

  const lang = Number(savedLang?.id) || (isArabic ? 1 : 2);

  const sector = SECTOR_CONFIG[normalizedKeyword] || null;

  const fallbackSectorTitle = sector ? (isArabic ? sector.ar : sector.en) : "";

  const [pageTitle, setPageTitle] = useState(() => {
    return routeState.title || fallbackSectorTitle || "";
  });

  useEffect(() => {
    if (routeState.title) {
      setPageTitle(routeState.title);
      sessionStorage.setItem(
        `university-sector-title-${normalizedKeyword}`,
        routeState.title,
      );
      return;
    }

    const savedTitle = sessionStorage.getItem(
      `university-sector-title-${normalizedKeyword}`,
    );

    if (savedTitle) {
      setPageTitle(savedTitle);
      return;
    }

    if (fallbackSectorTitle) {
      setPageTitle(fallbackSectorTitle);
    }
  }, [routeState.title, fallbackSectorTitle, normalizedKeyword]);

  const [menu, setMenu] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [article, setArticle] = useState(null);
  const [articleLoading, setArticleLoading] = useState(false);

  const visibleMenu = useMemo(() => {
    if (normalizedKeyword === "univpres") {
      return buildFixedMenu(menu, isArabic);
    }

    return cleanMenuTree(menu);
  }, [menu, isArabic, normalizedKeyword]);

  useEffect(() => {
    let mounted = true;

    const fetchMenu = async () => {
      setMenuLoading(true);

      try {
        const response = await newsService.getInternalMenuByAbbr({
          abbr: keyword,
          lang,
        });

        if (!mounted) return;

        const normalizedMenu = cleanMenuTree(
          Array.isArray(response?.result) ? response.result : [],
        );

        if (normalizedMenu.length === 0) {
          navigate("/404", { replace: true });
          return;
        }

        setMenu(normalizedMenu);
      } catch (error) {
        console.error("Failed to fetch university sector menu:", error);

        if (mounted) {
          navigate("/404", { replace: true });
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
  }, [keyword, lang, navigate]);

  useEffect(() => {
    let mounted = true;

    const fetchArticle = async () => {
      if (!articleId) {
        setArticle(null);
        return;
      }

      const numericArticleId = Number(articleId);

      if (!Number.isFinite(numericArticleId) || numericArticleId <= 0) {
        navigate("/404", { replace: true });
        return;
      }

      setArticleLoading(true);

      try {
        const response = await newsService.getSectorPage({
          articleId: numericArticleId,
          lang,
        });

        if (!mounted) return;

        const normalizedArticle = response?.result || null;

        if (!normalizedArticle) {
          navigate("/404", { replace: true });
          return;
        }

        setArticle(normalizedArticle);
      } catch (error) {
        console.error("Failed to fetch university sector article:", error);

        if (mounted) {
          navigate("/404", { replace: true });
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
  }, [articleId, lang, navigate]);

  const headerSection = (
    <section className="usp-header">
      <div className="usp-header-inner">
        <div className="usp-brand">
          <img src={logo} alt="Menoufia University" />

          <div className="usp-brand-text">
            <p>{isArabic ? "جامعة المنوفية" : "Menoufia University"}</p>
            {pageTitle && <h1>{pageTitle}</h1>}
          </div>
        </div>
      </div>
    </section>
  );

  const menuSection = (
    <section className="usp-menu-section">
      <div className="usp-menu-wrapper">
        {menuLoading ? (
          <div className="usp-menu-loading">
            {isArabic ? "جاري تحميل القائمة..." : "Loading menu..."}
          </div>
        ) : (
          <div
            className={`usp-menu-bar ${
              normalizedKeyword === "univpres"
                ? "usp-menu-bar-fixed"
                : "usp-menu-bar-dynamic"
            }`}
          >
            {visibleMenu.map((item) => (
              <SectorMenuItem
                key={item.menuId}
                item={item}
                keyword={keyword}
                pageTitle={pageTitle}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );

  if (articleId) {
    return (
      <main className="usp-page" dir={isArabic ? "rtl" : "ltr"}>
        {headerSection}
        {menuSection}

        {articleLoading ? (
          <div className="usp-state-message">
            {isArabic ? "جاري تحميل الصفحة..." : "Loading page..."}
          </div>
        ) : article ? (
          <ArticleRenderer article={article} isArabic={isArabic} />
        ) : (
          <div className="usp-state-message">
            {isArabic ? "لم يتم العثور على الصفحة" : "Page not found"}
          </div>
        )}
      </main>
    );
  }

  if (sector) {
    return <SectorsNews sectorKeyword={keyword} beforeCards={menuSection} />;
  }

  return (
    <main className="usp-page" dir={isArabic ? "rtl" : "ltr"}>
      {headerSection}
      {menuSection}

      <div className="usp-state-message">
        {isArabic
          ? "اختر عنصرًا من القائمة لعرض محتواه."
          : "Choose an item from the menu to view its content."}
      </div>
    </main>
  );
};

export default UniversitySectorsPage;
