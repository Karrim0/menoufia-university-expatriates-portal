import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Header.css";
import logo from "../../assets/logo.jpg";
import { useTranslation } from "react-i18next";
import { Search as SearchIcon, Globe, ChevronDown, ChevronLeft } from "lucide-react";
import newsService from "../../Services/newsService";



const LANGUAGE_ORDER = ["ar", "en", "fr", "de", "ja", "tr", "fa", "ru", "ch", "it"];

const sortLanguages = (langs: any[]) => {
  return [...langs].sort((a, b) => {
    const indexA = LANGUAGE_ORDER.indexOf(a.code);
    const indexB = LANGUAGE_ORDER.indexOf(b.code);

    return (
      (indexA === -1 ? 999 : indexA) -
      (indexB === -1 ? 999 : indexB)
    );
  });
};

const FIXED_LANGUAGES = [
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

const getNavItems = (t: any) => [
  { key: "home", label: t("nav.home"), link: "/" },
  {
    key: "about",
    label: t("nav.about"),
    children: [
      { key: "digital-identity", label: t("nav.about.digitalIdentity"), link: "/" },
      { key: "president-word",   label: t("nav.about.presidentWord"),   link: "/" },
      { key: "sectors",          label: t("nav.about.sectors"),         link: "/" },
      { key: "units",            label: t("nav.about.units"),           link: "/" },
      { key: "departments",      label: t("nav.about.departments"),     link: "/" },
      { key: "sitemap",          label: t("nav.about.sitemap"),         link: "/" },
      {
        key: "history",
        label: t("nav.about.history"),
        children: [
          { key: "vision",  label: t("nav.about.history.vision"),  link: "/" },
          { key: "mission", label: t("nav.about.history.mission"), link: "/" },
          { key: "goals",   label: t("nav.about.history.goals"),   link: "/" },
          { key: "ranking", label: t("nav.about.history.ranking"), link: "/" },
        ],
      },
    ],
  },
  { key: "programs", label: t("nav.programs"), link: "/colleges-programs" },
  {
    key: "university-management",
    label: t("nav.universityManagement"),
    children: [
      { key: "wafiden", label: t("nav.wafiden"), link: "/sectors/wafiden" },
      { key: "ceneva",  label: t("nav.ceneva"),  link: "/sectors/cenev"   },
      { key: "educ",    label: t("nav.educ"),    link: "/sectors/educ"    },
      { key: "env",     label: t("nav.env"),     link: "/sectors/env"     },
      { key: "env2",    label: t("nav.env2"),    link: "/sectors/env2"    },
      { key: "nci",     label: t("nav.nci"),     link: "/sectors/nci"     },
      { key: "postgrad",label: t("nav.postgrad"),link: "/sectors/postgrad"},
      { key: "sadat",   label: t("nav.sadat"),   link: "/sectors/sadat"   },
      { key: "secr",    label: t("nav.secr"),    link: "/sectors/secr"    },
      { key: "tico",    label: t("nav.tico"),    link: "/sectors/tico"    },
      { key: "univpres",label: t("nav.univpres"),link: "/sectors/univpres"},
    ],
  },
  {
    key: "students",
    label: t("nav.students"),
    children: [
      { key: "platforms",    label: t("nav.students.platforms"),    link: "/" },
      { key: "admission",    label: t("nav.students.admission"),    link: "/" },
      { key: "ethics",       label: t("nav.students.ethics"),       link: "/" },
      { key: "scholarships", label: t("nav.students.scholarships"), link: "/" },
      { key: "fees",         label: t("nav.students.fees"),         link: "/" },
      {
        key: "services",
        label: t("nav.students.services"),
        children: [
          { key: "housing",   label: t("nav.students.services.housing"),   link: "/" },
          { key: "transport", label: t("nav.students.services.transport"), link: "/" },
        ],
      },
    ],
  },
  {
    key: "expatriates",
    label: t("nav.expatriates"),
    children: [
      { key: "apply",        label: t("nav.expatriates.apply"),       link: "/" },
      { key: "exp-programs", label: t("nav.expatriates.programs"),    link: "/" },
      { key: "expenses",     label: t("nav.expatriates.expenses"),    link: "/" },
      { key: "housing",      label: t("nav.expatriates.housing"),     link: "/" },
      { key: "residency",    label: t("nav.expatriates.residency"),   link: "/" },
      { key: "student-life", label: t("nav.expatriates.studentLife"), link: "/" },
    ],
  },
  { key: "staff",   label: t("nav.staff"),   link: "/team"    },
  { key: "systems", label: t("nav.systems"), link: "/systems" },
  {
    key: "news",
    label: t("nav.news"),
    children: [
      { key: "news-list", label: t("nav.news.newsList"), link: "/news" },
      { key: "archive",   label: t("nav.news.archive"),  link: "/"     },
      {
        key: "media",
        label: t("nav.news.media"),
        children: [
          { key: "photos",  label: t("nav.news.media.photos"),  link: "/" },
          { key: "videos",  label: t("nav.news.media.videos"),  link: "/" },
          { key: "channel", label: t("nav.news.media.channel"), link: "/" },
        ],
      },
    ],
  },
  { key: "contact", label: t("nav.contact"), link: "/contactUs" },
];

const isDesktop = () => window.innerWidth > 1100;

const mapMenuItem = (item: any): any => {
  const hasSubMenus =
    Array.isArray(item.subMenus) &&
    item.subMenus.length > 0 &&
    item.subMenus.some((s: any) => s !== null && typeof s === "object");

  return {
    key:   String(item.id),
    label: item.title,
    link:  item.url || "/",
    ...(hasSubMenus ? { children: item.subMenus.map(mapMenuItem) } : {}),
  };
};

/* ─────────────────────────────────────────────
   SubDropdownItem
───────────────────────────────────────────── */
const SubDropdownItem = ({ item }: any) => {
  const [open, setOpen]    = useState(false);
  const hasChildren        = item.children?.length > 0;
  const ref                = useRef<HTMLDivElement | null>(null);
  const subDropdownRef     = useRef<HTMLDivElement | null>(null);
  const closeTimer         = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open || !subDropdownRef.current) return;
    const rect = subDropdownRef.current.getBoundingClientRect();
    if (rect.left < 0) {
      subDropdownRef.current.style.insetInlineStart = "100%";
      subDropdownRef.current.style.insetInlineEnd   = "auto";
    } else if (rect.right > window.innerWidth) {
      subDropdownRef.current.style.insetInlineStart = "auto";
      subDropdownRef.current.style.insetInlineEnd   = "100%";
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleMouseEnter = () => {
    if (!hasChildren || !isDesktop()) return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    if (!hasChildren || !isDesktop()) return;
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!hasChildren || isDesktop()) return;
    e.preventDefault();
    e.stopPropagation();
    setOpen(p => !p);
  };

  return (
    <div
      className={`dropdown-item ${hasChildren ? "has-sub" : ""} ${open ? "sub-open" : ""}`}
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {hasChildren ? (
        <span className="dropdown-item-label" onClick={handleClick}>
          <span className="dropdown-item-text">{item.label}</span>
          <ChevronLeft size={12} className="sub-arrow" />
        </span>
      ) : (
        <Link to={item.link} className="dropdown-item-label solo">
          <span className="dropdown-item-text">{item.label}</span>
        </Link>
      )}

      {hasChildren && open && (
        <div
          className="sub-dropdown"
          ref={subDropdownRef}
          onMouseEnter={() => { if (closeTimer.current) clearTimeout(closeTimer.current); }}
          onMouseLeave={handleMouseLeave}
        >
          {item.children.map((child: any) => (
            <Link key={child.key} to={child.link} className="dropdown-item-label solo">
              <span className="dropdown-item-text">{child.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   NavItem
───────────────────────────────────────────── */
const NavItem = ({ item, isActive }: any) => {
  const [open, setOpen] = useState(false);
  const hasChildren     = item.children?.length > 0;
  const ref             = useRef<HTMLLIElement | null>(null);
  const closeTimer      = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openDropdown  = () => { if (closeTimer.current) clearTimeout(closeTimer.current); setOpen(true);  };
  const closeDropdown = () => { closeTimer.current = setTimeout(() => setOpen(false), 150); };

  const handleMouseEnter = () => { if (hasChildren && isDesktop()) openDropdown(); };
  const handleMouseLeave = () => { if (hasChildren && isDesktop()) closeDropdown(); };

  const handleClick = (e: React.MouseEvent) => {
    if (!hasChildren || isDesktop()) return;
    e.preventDefault();
    e.stopPropagation();
    setOpen(p => !p);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <li
      className={`nav-item ${isActive ? "active" : ""} ${hasChildren ? "has-dropdown" : ""} ${open ? "dropdown-open" : ""}`}
      ref={ref}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {hasChildren ? (
        <span className="nav-link" onClick={handleClick}>
          <span className="nav-link-text">{item.label}</span>
          <ChevronDown size={11} className="nav-arrow" />
        </span>
      ) : (
        <Link to={item.link} className="nav-link">
          <span className="nav-link-text">{item.label}</span>
        </Link>
      )}

      {hasChildren && open && (
        <div
          className="dropdown-menu"
          onMouseEnter={() => { if (closeTimer.current) clearTimeout(closeTimer.current); }}
          onMouseLeave={handleMouseLeave}
        >
          {item.children.map((child: any) => (
            <SubDropdownItem key={child.key} item={child} />
          ))}
        </div>
      )}
    </li>
  );
};

/* ─────────────────────────────────────────────
   Main Header
───────────────────────────────────────────── */
const Header = () => {
  const { i18n, t } = useTranslation();
  const location    = useLocation();

  const getSavedLang = () => {
    try { return JSON.parse(localStorage.getItem("lang") || '{"code":"ar","id":1}'); }
    catch { return { code: "ar", id: 1 }; }
  };

  const [menuActive, setMenuActive]       = useState(false);
  const [langActive, setLangActive]       = useState(false);
  const [searchOpen, setSearchOpen]       = useState(false);
  const [searchTerm, setSearchTerm]       = useState("");
  const [currentLang, setCurrentLang]     = useState(getSavedLang);
  const [languages, setLanguages]         = useState(FIXED_LANGUAGES);
  const [aboutChildren, setAboutChildren] = useState<any[]>([]);
  const searchRef = useRef<HTMLDivElement | null>(null);

  // ─── جيب اللغات ───
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const response = await newsService.getLanguages();
        const result = response?.result;
        if (Array.isArray(result) && result.length > 0 && result.every((l: any) => l.code)) {
          setLanguages(sortLanguages(result));
        }
      } catch {
        // fallback على FIXED_LANGUAGES
      }
    };
    fetchLanguages();
  }, []);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const langId = currentLang?.id || 1;
        const data = await newsService.getFullMenu(langId);
        if (Array.isArray(data) && data.length > 0) {
          setAboutChildren(data.map(mapMenuItem));
        }
      } catch {
        setAboutChildren([]);
      }
    };
    fetchMenu();
  }, [currentLang?.id]);

const NAV_ITEMS = useMemo(() => {
  const items = getNavItems(t);
  if (aboutChildren.length === 0) return items;

  return items.map((item) => {
    if (item.key === "about") {
      return { ...item, children: aboutChildren };
    }
    if (item.key === "university-management") {
      const mgmt = aboutChildren.find(
        (c: any) =>
          c.label?.includes("ادار") ||
          c.label?.toLowerCase().includes("manag")
      );
      if (mgmt?.children?.length) {
        return { ...item, children: mgmt.children };
      }
    }
    return item;
  });
}, [t, aboutChildren]);

  useEffect(() => {
    i18n.changeLanguage(currentLang.code);
    document.documentElement.dir = currentLang.code === "ar" ? "rtl" : "ltr";
  }, []);

  useEffect(() => { setMenuActive(false); }, [location.pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchOpen && searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setSearchTerm("");
      }
      if (langActive && !(e.target as HTMLElement).closest(".lang-wrapper")) {
        setLangActive(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [searchOpen, langActive]);

  useEffect(() => {
    document.body.style.overflow = menuActive ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuActive]);

  const changeLanguage = (lang: any) => {
    localStorage.setItem("lang", JSON.stringify({
      id:   lang.id,
      name: lang.name,
      code: lang.code,
      flag: lang.flag,
    }));
    i18n.changeLanguage(lang.code);
    document.documentElement.dir = lang.code === "ar" ? "rtl" : "ltr";
    setCurrentLang(lang);
    setLangActive(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) console.log("Searching for:", searchTerm);
  };

  return (
    <header className="nav-container">
      <Link to="/" className="nav-logo">
        <img src={logo} alt="Menofia University Logo" />
      </Link>

      <nav className={`nav-links ${menuActive ? "nav-active" : ""}`}>
        <button className="nav-close" onClick={() => setMenuActive(false)} aria-label="close menu">
          <i className="fa-solid fa-times" />
        </button>
        <ul>
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.key}
              item={item}
              isActive={!!(item.link && location.pathname === item.link)}
            />
          ))}
        </ul>
      </nav>

      <div className="nav-icons">
        {/* Language Selector */}
        <div className="lang-wrapper" onClick={() => setLangActive(p => !p)}>
          <Globe size={20} />
          <span className="lang-code">{currentLang.code?.toUpperCase()}</span>
          <ChevronDown size={14} className={`lang-arrow ${langActive ? "rotated" : ""}`} />

          <div className={`lang-dropdown ${langActive ? "open" : ""}`}>
            {languages.map((lang: any) => (
              <div
                key={lang.code}
                className={`lang-option ${currentLang.code === lang.code ? "current" : ""}`}
                onClick={(e) => { e.stopPropagation(); changeLanguage(lang); }}
              >
                {lang.flag && (
                  <img
                    src={lang.flag}
                    alt={lang.name}
                    width={20}
                    height={15}
                    style={{ objectFit: "cover", borderRadius: "2px" }}
                  />
                )}
                <span>{lang.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="search-wrapper" ref={searchRef}>
          <button className="icon-btn search-btn" onClick={() => setSearchOpen(p => !p)} aria-label="search">
            <SearchIcon size={20} />
          </button>
          {searchOpen && (
            <form onSubmit={handleSearch} className="search-dropdown">
              <input
                type="text"
                className="search-input-pro"
                placeholder={t("search.placeholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
              <button type="submit" className="search-submit-btn" aria-label="submit search">
                <i className="fa-solid fa-magnifying-glass"></i>
              </button>
            </form>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button className="icon-btn menu-btn" onClick={() => setMenuActive(true)} aria-label="open menu">
          <i className="fa-solid fa-bars" />
        </button>
      </div>

      {menuActive && <div className="nav-overlay" onClick={() => setMenuActive(false)} />}
    </header>
  );
};

export default Header;