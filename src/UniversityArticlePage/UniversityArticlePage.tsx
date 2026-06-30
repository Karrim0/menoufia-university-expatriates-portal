import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import newsService from "../Services/newsService";
import { getLanguageId } from "../utils/language";
import "./UniversityArticlePage.css";
import logo from "../assets/logo.jpg";
type UniversityArticle = {
  articleId?: number;
  menuItemId?: number;
  title?: string;
  content?: string;
  imageDescription?: string | null;
};

type ArticleLink = {
  href: string;
  text: string;
  extension: string;
  isFile: boolean;
};

const FILE_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
];

const getSavedLangId = () => {
  try {
    const savedLang = JSON.parse(localStorage.getItem("lang") || "{}");
    return Number(savedLang?.id) || 1;
  } catch {
    return 1;
  }
};

const normalizeArticleResponse = (response: any): UniversityArticle | null => {
  const result =
    response?.result ||
    response?.data?.result ||
    response?.article ||
    response?.data ||
    response ||
    null;

  if (!result || typeof result !== "object") return null;

  return result;
};

const removeWordNoise = (html = "") => {
  return String(html || "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<xml[\s\S]*?<\/xml>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\sclass=("|')Mso[^"']*("|')/gi, "")
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

const getUrlExtension = (url = "") => {
  const cleanUrl = String(url).split("?")[0].split("#")[0];
  const match = cleanUrl.match(/\.([a-z0-9]+)$/i);

  return match ? match[1].toLowerCase() : "";
};

const isFileExtension = (extension: string) => {
  return FILE_EXTENSIONS.includes(extension.toLowerCase());
};

const normalizeAssetUrl = (url = "") => {
  const value = String(url || "").trim();

  if (!value || value === "#") return "";
  if (/^https?:\/\//i.test(value)) return value;

  if (value.startsWith("//")) {
    return `https:${value}`;
  }

  if (value.startsWith("/")) {
    return `https://mu.menofia.edu.eg${value}`;
  }

  if (value.startsWith("PrtlFiles/")) {
    return `https://mu.menofia.edu.eg/${value}`;
  }

  return value;
};

const getFileIconClass = (extension: string) => {
  const ext = extension.toLowerCase();

  if (ext === "pdf") return "fa-solid fa-file-pdf";
  if (["doc", "docx"].includes(ext)) return "fa-solid fa-file-word";
  if (["xls", "xlsx"].includes(ext)) return "fa-solid fa-file-excel";
  if (["ppt", "pptx"].includes(ext)) return "fa-solid fa-file-powerpoint";

  return "fa-solid fa-file-lines";
};

const enhanceArticleHtml = (html = "") => {
  const cleanedHtml = removeWordNoise(html);
  const links: ArticleLink[] = [];

  if (typeof window === "undefined" || !window.DOMParser) {
    return {
      html: cleanedHtml,
      text: stripHtmlToText(cleanedHtml),
      fileLinks: [],
    };
  }

  const doc = new DOMParser().parseFromString(cleanedHtml, "text/html");

  doc.querySelectorAll("script, style, meta, link").forEach((element) => {
    element.remove();
  });

  doc.querySelectorAll("[style]").forEach((element) => {
    element.removeAttribute("style");
  });

  doc.querySelectorAll("[class]").forEach((element) => {
    const className = element.getAttribute("class") || "";

    if (/Mso|WordSection/i.test(className)) {
      element.removeAttribute("class");
    }
  });

  doc.querySelectorAll("p").forEach((paragraph) => {
    const text = (paragraph.textContent || "").replace(/\s+/g, " ").trim();
    const hasMedia = paragraph.querySelector("img, video, iframe, table, a");

    if (!text && !hasMedia) {
      paragraph.remove();
    }
  });

  doc.querySelectorAll("img[src]").forEach((image) => {
    const img = image as HTMLImageElement;
    const src = normalizeAssetUrl(img.getAttribute("src") || "");

    if (!src) {
      img.remove();
      return;
    }

    img.setAttribute("src", src);
    img.setAttribute("loading", "lazy");
    img.removeAttribute("width");
    img.removeAttribute("height");
    img.classList.add("university-article-html-image");
  });

  doc.querySelectorAll("a[href]").forEach((anchor) => {
    const link = anchor as HTMLAnchorElement;
    const href = normalizeAssetUrl(link.getAttribute("href") || "");
    const extension = getUrlExtension(href);
    const text = (link.textContent || href).replace(/\s+/g, " ").trim();
    const isFile = isFileExtension(extension);

    if (!href) {
      link.removeAttribute("href");
      return;
    }

    link.setAttribute("href", href);
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");

    link.classList.add(
      isFile ? "university-file-inline-link" : "university-inline-link",
    );

    if (isFile) {
      links.push({
        href,
        text: text || extension.toUpperCase(),
        extension,
        isFile,
      });
    }
  });

  doc.querySelectorAll("table").forEach((table) => {
    const wrapper = doc.createElement("div");

    wrapper.className = "university-article-table-wrap";
    table.parentNode?.insertBefore(wrapper, table);
    wrapper.appendChild(table);
  });

  const uniqueFileLinks = Array.from(
    new Map(links.map((link) => [link.href, link])).values(),
  );

  return {
    html: doc.body.innerHTML,
    text: stripHtmlToText(doc.body.innerHTML),
    fileLinks: uniqueFileLinks,
  };
};

const getArticleLangId = (language: string) => {
  return getLanguageId(language) || getSavedLangId();
};

const UniversityArticlePage = () => {
  const { articleId } = useParams();
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  const [article, setArticle] = useState<UniversityArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const langId = useMemo(() => getArticleLangId(i18n.language), [i18n.language]);

  const isRTL = i18n.dir() === "rtl" || ["ar", "fa"].includes(i18n.language);
  const isArabic = i18n.language.toLowerCase().startsWith("ar");

  const parsedContent = useMemo(
    () => enhanceArticleHtml(article?.content || ""),
    [article?.content],
  );

  const parsedImageDescription = useMemo(
    () => enhanceArticleHtml(article?.imageDescription || ""),
    [article?.imageDescription],
  );

  useEffect(() => {
    let mounted = true;

    const fetchArticle = async () => {
      const numericArticleId = Number(articleId);

      if (!articleId || !Number.isFinite(numericArticleId) || numericArticleId <= 0) {
  navigate("/404", { replace: true });
  return;
}

      setLoading(true);
      setError("");

      try {
        const languageFallbacks = Array.from(new Set([langId, 1, 2]));
        let normalizedArticle: UniversityArticle | null = null;

        for (const selectedLangId of languageFallbacks) {
          try {
            const response = await newsService.getSectorPage({
              articleId: numericArticleId,
              lang: selectedLangId,
            });

            normalizedArticle = normalizeArticleResponse(response);

            if (
              normalizedArticle &&
              (normalizedArticle.title ||
                normalizedArticle.content ||
                normalizedArticle.imageDescription)
            ) {
              break;
            }
          } catch {
            normalizedArticle = null;
          }
        }

        if (!mounted) return;

        if (!normalizedArticle) {
  navigate("/404", { replace: true });
  return;
}

        setArticle(normalizedArticle);
      } catch {
        if (!mounted) return;

        navigate("/404", { replace: true });
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchArticle();

    return () => {
      mounted = false;
    };
  }, [articleId, langId, isArabic, navigate]);

  if (loading) {
    return (
      <main
        className="university-article-page"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <section className="university-article-container">
          <div className="university-article-skeleton">
            <div className="university-skeleton-line title" />
            <div className="university-skeleton-line wide" />
            <div className="university-skeleton-line" />
            <div className="university-skeleton-line short" />
          </div>
        </section>
      </main>
    );
  }

  if (error || !article) {
    return (
      <main
        className="university-article-page"
        dir={isRTL ? "rtl" : "ltr"}
      >
        <section className="university-article-container">
          <div className="university-article-state error">
            <span className="university-article-state-icon">
              <i className="fa-solid fa-circle-exclamation" />
            </span>

            <h2>{isArabic ? "تعذر عرض الصفحة" : "Page unavailable"}</h2>
            <p>{error || (isArabic ? "لا توجد بيانات متاحة لهذه الصفحة." : "No content is available.")}</p>
          </div>
        </section>
      </main>
    );
  }

  const hasVisualIntro = Boolean(parsedImageDescription.text);
  const hasContent = Boolean(parsedContent.text);
  const fileLinks = parsedContent.fileLinks;

  return (
    <main
      className="university-article-page"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <section className="university-article-container">
        <header className="university-article-hero">
          <Link
  to="/"
  className="university-article-logo-link"
  aria-label={isArabic ? "العودة إلى الرئيسية" : "Back to home"}
>
  <img
    src={logo}
    alt={isArabic ? "شعار جامعة المنوفية" : "Menoufia University Logo"}
    className="university-article-logo"
  />
</Link>

          <h1>{article.title || (isArabic ? "صفحة جامعية" : "University Page")}</h1>

          <span className="university-article-title-line" />
        </header>

        {hasVisualIntro && (
          <section className="university-article-media-card">
            <div
              className="university-article-media-content"
              dangerouslySetInnerHTML={{
                __html: parsedImageDescription.html,
              }}
            />
          </section>
        )}

        {fileLinks.length > 0 && (
          <section className="university-article-files">
            <div className="university-article-section-heading">
              <span className="university-article-section-dot" />
              <h2>{isArabic ? "ملفات وروابط الصفحة" : "Page Files & Links"}</h2>
            </div>

            <div className="university-article-files-grid">
              {fileLinks.map((file) => (
                <a
                  key={file.href}
                  href={file.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="university-article-file-card"
                >
                  <span className="university-article-file-icon">
                    <i className={getFileIconClass(file.extension)} />
                  </span>

                  <span className="university-article-file-info">
                    <strong>{file.text}</strong>
                    <small>{file.extension.toUpperCase()}</small>
                  </span>

                  <span className="university-article-file-arrow">
                    <i className="fa-solid fa-arrow-up-right-from-square" />
                  </span>
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="university-article-body-card">
          {hasContent ? (
            <article
              className="university-article-content"
              dangerouslySetInnerHTML={{
                __html: parsedContent.html,
              }}
            />
          ) : (
            <div className="university-article-state">
              {isArabic ? "لا يوجد محتوى نصي متاح." : "No text content available."}
            </div>
          )}
        </section>
      </section>
    </main>
  );
};

export default UniversityArticlePage;