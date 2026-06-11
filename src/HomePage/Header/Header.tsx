import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Header.css";
import logo from "../../assets/logo.jpg";
import { useTranslation } from "react-i18next";
import {
  Globe,
  ChevronDown,
  ChevronLeft,
  Palette as PaletteIcon,
} from "lucide-react";
import newsService from "../../Services/newsService";
import { saveLanguage } from "../../utils/language";
import { useTheme } from "../../theme/ThemeContext";

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

const sortLanguages = (langs: any[]) =>
  [...langs].sort((a, b) => {
    const ia = LANGUAGE_ORDER.indexOf(a.code);
    const ib = LANGUAGE_ORDER.indexOf(b.code);
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

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

const SECTOR_NAV_ITEMS = [
  {
    key: "univpres",
    labelKey: "nav.sectorsList.univpres",
  },
  {
    key: "educ",
    labelKey: "nav.sectorsList.educ",
  },
  {
    key: "env",
    labelKey: "nav.sectorsList.env",
  },
  {
    key: "postgrad",
    labelKey: "nav.sectorsList.postgrad",
  },
  {
    key: "secr",
    labelKey: "nav.sectorsList.secr",
  },
];

const isExternalLink = (link?: string) => {
  return typeof link === "string" && /^https?:\/\//i.test(link);
};

const MenuLink = ({ item, className }: any) => {
  if (isExternalLink(item.link)) {
    return (
      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        <span className="dropdown-item-text">{item.label}</span>
      </a>
    );
  }

  return (
    <Link to={item.link || "/"} className={className}>
      <span className="dropdown-item-text">{item.label}</span>
    </Link>
  );
};

const getNavItems = (t: any) => [
  {
    key: "home",
    label: t("nav.home"),
    link: "/",
  },

  {
    key: "about",
    label: t("nav.about"),
    children: [
      {
        key: "digital-identity",
        label:t("nav.aboutDigitalIdentity"),
        link: "/",
      },
      {
        key: "sectors",
        label: t("nav.aboutSectors"),
        link: "/",
      },
      {
        key: "units",
        label: t("nav.aboutUnits"),
        link: "/",
      },
      {
        key: "departments",
        label: t("nav.aboutDepartments"),
        link: "/",
      },
      {
        key: "sitemap",
        label: t("nav.aboutSitemap"),
        link: "/",
      },
      {
        key: "history",
        label: t("nav.aboutHistory"),
        children: [
          {
            key: "vision",
            label: t("nav.aboutHistoryVision"),
            link: "/",
          },
          {
            key: "mission",
            label: t("nav.aboutHistoryMission"),
            link: "/",
          },
          {
            key: "goals",
            label: t("nav.aboutHistoryGoals"),
            link: "/",
          },
          {
            key: "ranking",
            label: t("nav.aboutHistoryRanking"),
            link: "/",
          },
        ],
      },
    ],
  },

  {
    key: "sectors",
    label: t("nav.sectors"),
    children: [
      {
        key: "univpres",
        label: t("nav.sectorsList.univpres"),
        link: "/sectors/univpres",
      },
      {
        key: "educ",
        label: t("nav.sectorsList.educ"),
        link: "/sectors/educ",
      },
      {
        key: "env",
        label: t("nav.sectorsList.env"),
        link: "/sectors/env",
      },
      {
        key: "postgrad",
        label: t("nav.sectorsList.postgrad"),
        link: "/sectors/postgrad",
      },
      {
        key: "secr",
        label: t("nav.sectorsList.secr"),
        link: "/sectors/secr",
      },
    ],
  },

  {
    key: "programs",
    label: t("nav.programs"),
    link: "/colleges-programs",
  },

  {
    key: "university-systems",
    label: t("nav.universitySystems"),
    children: [
      {
        key: "wafiden",
        label: t("nav.wafiden"),
        link: "/sectors/wafiden",
      },
      {
        key: "ceneva",
        label: t("nav.ceneva"),
        link: "/sectors/cenev",
      },
      {
        key: "nci",
        label: t("nav.nci"),
        link: "/sectors/nci",
      },
      {
        key: "tico",
        label: t("nav.tico"),
        link: "/sectors/tico",
      },
      {
        key: "sadat",
        label: t("nav.sadat"),
        link: "/sectors/sadat",
      },
      {
        key: "env2",
        label: t("nav.env2"),
        link: "/sectors/env2",
      },
    ],
  },

  {
    key: "students",
    label: t("nav.students"),
    children: [
      {
        key: "university-cities-application",
        label: t("nav.studentsList.universityCitiesApplication"),
        link: "https://al-zahraa.mans.edu.eg/studentApplications",
      },
      {
        key: "undergraduate-stage",
        label: t("nav.studentsList.undergraduateStage"),
        children: [
          {
            key: "study-system",
            label: t("nav.studentsList.studySystem"),
            link: "https://www.menofia.edu.eg/View/39378/ar",
          },
          {
            key: "open-education",
            label: t("nav.studentsList.openEducation"),
            link: "https://mu.menofia.edu.eg/open_edu/home.asp",
          },
          {
            key: "undergraduate-electronic-services",
            label: t("nav.studentsList.electronicServices"),
            link: "https://www.menofia.edu.eg/View/69337/ar",
          },
        ],
      },
      {
        key: "postgraduate-stage",
        label: t("nav.studentsList.postgraduateStage"),
        children: [
          {
            key: "registration-conditions",
            label: t("nav.studentsList.registrationConditions"),
            link: "https://www.menofia.edu.eg/View/39380/ar",
          },
          {
            key: "postgraduate-electronic-services",
            label: t("nav.studentsList.electronicServices"),
            link: "https://www.menofia.edu.eg/View/39381/ar",
          },
        ],
      },
      {
        key: "graduates",
        label: t("nav.studentsList.graduates"),
        children: [
          {
            key: "graduates-care-association",
            label: t("nav.studentsList.graduatesCareAssociation"),
            link: "https://mu.menofia.edu.eg/caamu/CaamuHome/ar",
          },
          {
            key: "graduates-database",
            label: t("nav.studentsList.graduatesDatabase"),
            link: "https://www.menofia.edu.eg/Home/ar",
          },
          {
            key: "graduate-search",
            label: t("nav.studentsList.graduateSearch"),
            link: "https://mu.menofia.edu.eg/educ/SearchGrade/ar",
          },
        ],
      },
      {
        key: "international-students",
        label: t("nav.studentsList.internationalStudents"),
        link: "https://mu.menofia.edu.eg/postgrad/View/70399/ar",
      },
      {
        key: "student-services",
        label: t("nav.studentsList.studentServices"),
        children: [
          {
            key: "electronic-application",
            label: t("nav.studentsList.electronicApplication"),
            link: "http://eush.edu.eg/eu/ApplicationForm.py",
          },
          {
            key: "medical-services",
            label: t("nav.studentsList.medicalServices"),
            link: "https://www.menofia.edu.eg/View/39389/ar",
          },
          {
            key: "university-professor",
            label: t("nav.studentsList.universityProfessor"),
            link: "https://www.menofia.edu.eg/View/39391/ar",
          },
          {
            key: "student-takaful",
            label: t("nav.studentsList.studentTakaful"),
            link: "https://www.menofia.edu.eg/View/39392/ar",
          },
          {
            key: "student-guide",
            label: t("nav.studentsList.studentGuide"),
            link: "https://www.menofia.edu.eg/View/39393/ar",
          },
          {
            key: "university-cities-evaluation",
            label: t("nav.studentsList.universityCitiesEvaluation"),
            link: "https://al-zahraa.mans.edu.eg/studentApplications",
          },
          {
            key: "military-education",
            label: t("nav.studentsList.militaryEducation"),
            link: "https://www.menofia.edu.eg/View/39397/ar",
          },
          {
            key: "summer-training",
            label: t("nav.studentsList.summerTraining"),
            link: "https://www.menofia.edu.eg/View/39394/ar",
          },
          {
            key: "information-club",
            label: t("nav.studentsList.informationClub"),
            link: "https://www.menofia.edu.eg/View/39395/ar",
          },
          {
            key: "tuition-fees",
            label: t("nav.studentsList.tuitionFees"),
            link: "https://www.menofia.edu.eg/View/39395/ar",
          },
          {
            key: "university-cities",
            label: t("nav.studentsList.universityCities"),
            link: "https://mu.menofia.edu.eg/housing/home.asp",
          },
        ],
      },
      {
        key: "student-activities",
        label: t("nav.studentsList.studentActivities"),
        link: "https://www.menofia.edu.eg/View/39384/ar",
      },
      {
        key: "postgraduate-results",
        label: t("nav.studentsList.postgraduateResults"),
        link: "http://193.227.24.15/Epg/natigapg/",
      },
      {
        key: "youth-care",
        label: t("nav.studentsList.youthCare"),
        link: "https://www.menofia.edu.eg/View/39385/ar",
      },
      {
        key: "exam-results",
        label: t("nav.studentsList.examResults"),
        link: "http://mu.menofia.edu.eg/AllFacResults/ar",
      },
      {
        key: "get-email",
        label: t("nav.studentsList.getEmail"),
        link: "http://193.227.24.15/email/",
      },
      {
        key: "foreign-students-registration",
        label: t("nav.studentsList.foreignStudentsRegistration"),
        link: "https://mu.menofia.edu.eg/foreigner/ar",
      },
    ],
  },

  {
    key: "staff",
    label: t("nav.staff"),
    children: [
      {
        key: "staff-search",
        label: t("nav.staffList.personalWebsite"),
        link: "https://mu.menofia.edu.eg/StaffSearch/ar",
      },
      {
        key: "staff-cvs",
        label: t("nav.staffList.cv"),
        link: "https://mu.menofia.edu.eg/StaffCVs/ar",
      },
      {
        key: "staff-page",
        label: t("nav.staffList.searchFaculty"),
        link: "https://mu.menofia.edu.eg/StaffPage/ar",
      },
      {
        key: "staff-electronic-services",
        label: t("nav.staffList.electronicServices"),
        link: "https://mu.menofia.edu.eg/View/7726/ar",
      },
      {
        key: "staff-email",
        label: t("nav.staffList.getEmail"),
        link: "https://mu.menofia.edu.eg/StaffEmail/ar",
      },
      {
        key: "staff-university-mail-login",
        label: t("nav.staffList.universityEmailLogin"),
        link: "https://mu.menofia.edu.eg/StaffEmail/ar",
      },
      {
        key: "staff-college-mail-login",
        label: t("nav.staffList.collegeEmailLogin"),
        link: "https://mu.menofia.edu.eg/StaffEmail/ar",
      },
    ],
  },

  {
    key: "research",
    label: t("nav.research"),
    children: [
      {
        key: "eulc",
        label: t("nav.researchList.eulc"),
        link: "#",
      },
      {
        key: "protocols",
        label: t("nav.researchList.protocols"),
        link: "#",
      },
      {
        key: "scientific-activities",
        label: t("nav.researchList.scientificActivities"),
        children: [
          {
            key: "scientific-reports",
            label: t("nav.researchList.scientificReports"),
            link: "#",
          },
        ],
      },
      {
        key: "scientific-repository",
        label: t("nav.researchList.scientificRepository"),
        link: "#",
      },
    ],
  },

  {
    key: "news",
    label: t("nav.newsEvents"),
    children: [
      {
        key: "news-list",
        label: t("nav.news.newsList"),
        link: "/news",
      },
      {
        key: "archive",
        label: t("nav.news.archive"),
        link: "/",
      },
      {
        key: "media",
        label: t("nav.news.media"),
        children: [
          {
            key: "photos",
            label: t("nav.news.photos"),
            link: "/",
          },
          {
            key: "videos",
            label: t("nav.news.videos"),
            link: "/",
          },
          {
            key: "channel",
            label: t("nav.news.channel"),
            link: "/",
          },
        ],
      },
    ],
  },

  {
    key: "contact",
    label: t("nav.contact"),
    link: "/contactUs",
  },
];

const isDesktop = () => window.innerWidth > 1100;

const normalizeInternalLink = (url?: string) => {
  const value = String(url || "").trim();

  if (!value || value === "#") return "/";
  if (isExternalLink(value)) return value;
  if (value.startsWith("/")) return value;

  return `/${value}`;
};

const mapMenuItem = (item: any): any => {
  const childrenSource = Array.isArray(item?.subMenus)
    ? item.subMenus
    : Array.isArray(item?.children)
    ? item.children
    : [];

  const validChildren = childrenSource.filter(
    (child: any) => child !== null && typeof child === "object"
  );

  const rawUrl = item?.url || item?.link || "/";

  return {
    key: String(item?.id ?? item?.menuId ?? item?.key ?? item?.title),
    label: item?.title ?? item?.label ?? "",
    link: normalizeInternalLink(rawUrl),
    ...(validChildren.length > 0
      ? { children: validChildren.map(mapMenuItem) }
      : {}),
  };
};

const SubDropdownItem = ({ item }: any) => {
  const [open, setOpen] = useState(false);
  const hasChildren = item.children?.length > 0;
  const ref = useRef<HTMLDivElement | null>(null);
  const subDropdownRef = useRef<HTMLDivElement | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open || !subDropdownRef.current) return;

    const rect = subDropdownRef.current.getBoundingClientRect();

    if (rect.left < 0) {
      subDropdownRef.current.style.insetInlineStart = "100%";
      subDropdownRef.current.style.insetInlineEnd = "auto";
    } else if (rect.right > window.innerWidth) {
      subDropdownRef.current.style.insetInlineStart = "auto";
      subDropdownRef.current.style.insetInlineEnd = "100%";
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);

    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const onEnter = () => {
    if (!hasChildren || !isDesktop()) return;
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  };

  const onLeave = () => {
    if (!hasChildren || !isDesktop()) return;
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  const onClick = (e: React.MouseEvent) => {
    if (!hasChildren || isDesktop()) return;
    e.preventDefault();
    e.stopPropagation();
    setOpen((prev) => !prev);
  };

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

      {hasChildren && open && (
        <div
          className="sub-dropdown"
          ref={subDropdownRef}
          onMouseEnter={() => {
            if (closeTimer.current) clearTimeout(closeTimer.current);
          }}
          onMouseLeave={onLeave}
        >
          {item.children.map((child: any) => (
            <SubDropdownItem key={child.key} item={child} />
          ))}
        </div>
      )}
    </div>
  );
};

const NavItem = ({ item, isActive }: any) => {
  const [open, setOpen] = useState(false);
  const hasChildren = item.children?.length > 0;
  const ref = useRef<HTMLLIElement | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onEnter = () => {
    if (hasChildren && isDesktop()) {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      setOpen(true);
    }
  };

  const onLeave = () => {
    if (hasChildren && isDesktop()) {
      closeTimer.current = setTimeout(() => setOpen(false), 150);
    }
  };

  const onClick = (e: React.MouseEvent) => {
    if (!hasChildren || isDesktop()) return;
    e.preventDefault();
    e.stopPropagation();
    setOpen((prev) => !prev);
  };

  useEffect(() => {
    if (!open) return;

    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);

    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

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
      ) : isExternalLink(item.link) ? (
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="nav-link"
        >
          <span className="nav-link-text">{item.label}</span>
        </a>
      ) : (
        <Link to={item.link} className="nav-link">
          <span className="nav-link-text">{item.label}</span>
        </Link>
      )}

      {hasChildren && open && (
        <div
          className="dropdown-menu"
          onMouseEnter={() => {
            if (closeTimer.current) clearTimeout(closeTimer.current);
          }}
          onMouseLeave={onLeave}
        >
          {item.children.map((child: any) => (
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

  const getSavedLang = () => {
    try {
      return JSON.parse(localStorage.getItem("lang") || '{"code":"ar","id":1}');
    } catch {
      return { code: "ar", id: 1 };
    }
  };

  const [menuActive, setMenuActive] = useState(false);
  const [langActive, setLangActive] = useState(false);
  const [paletteActive, setPaletteActive] = useState(false);
  const [currentLang, setCurrentLang] = useState(getSavedLang);
  const [languages, setLanguages] = useState(FIXED_LANGUAGES);
  const [aboutChildren, setAboutChildren] = useState<any[]>([]);

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

  newsService
    .getFullMenu(currentLang?.id || 1)
    .then((data: any) => {
      if (!mounted) return;

      const result = Array.isArray(data)
        ? data
        : Array.isArray(data?.result)
        ? data.result
        : [];

      setAboutChildren(result.map(mapMenuItem));
    })
    .catch(() => {
      if (mounted) setAboutChildren([]);
    });

  return () => {
    mounted = false;
  };
}, [currentLang?.id]);

  const NAV_ITEMS = useMemo(() => {
    const items = getNavItems(t);

    const newsStatisticsItem = {
      key: "news-statistics",
      label: t("nav.newsStatistics"),
      link: "https://stage.menofia.edu.eg/dashboard",
    };

    return items.map((item) => {
      if (item.key === "about") {
        const children = aboutChildren.length ? aboutChildren : item.children || [];

        const hasNewsStatistics = children.some(
          (child: any) => child.key === "news-statistics"
        );

        return {
          ...item,
          children: hasNewsStatistics
            ? children
            : [...children, newsStatisticsItem],
        };
      }

      if (item.key === "sectors") {
  return {
    ...item,
    children: SECTOR_NAV_ITEMS.map((sector) => ({
      key: sector.key,
      label: t(sector.labelKey),
      link: `/university-sectors/${sector.key}`,
    })),
  };
}

      return item;
    });
  }, [t, aboutChildren]);

  useEffect(() => {
    i18n.changeLanguage(currentLang.code);
    document.documentElement.dir = currentLang.code === "ar" ? "rtl" : "ltr";
  }, []);

  useEffect(() => {
    setMenuActive(false);
  }, [location.pathname]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

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

  const changeLanguage = async (lang: any) => {
    saveLanguage(lang);

    await i18n.changeLanguage(lang.code);

    document.documentElement.lang = lang.code;
    document.documentElement.dir =
      lang.code === "ar" || lang.code === "fa" ? "rtl" : "ltr";

    setCurrentLang(lang);
    setLangActive(false);
  };

  return (
    <header className="nav-container">
      <Link to="/" className="nav-logo">
        <img src={logo} alt="Menofia University Logo" />
      </Link>

      <nav className={`nav-links ${menuActive ? "nav-active" : ""}`}>
        <button
          className="nav-close"
          onClick={() => setMenuActive(false)}
          aria-label="close menu"
        >
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
            onClick={(e) => e.stopPropagation()}
          >
            {Object.values(palettes).map((palette: any) => (
              <button
                type="button"
                key={palette.id}
                className={`palette-option ${
                  selectedPalette === palette.id ? "selected" : ""
                }`}
                onClick={() => {
                  changePalette(palette.id);
                  setPaletteActive(false);
                }}
              >
                <span className="palette-colors">
                  {palette.preview.map((color: string) => (
                    <span
                      key={color}
                      className="palette-color"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </span>

                <span>{palette.name}</span>
              </button>
            ))}
          </div>
        </div>

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
            {languages.map((lang: any) => (
              <div
                key={lang.code}
                className={`lang-option ${
                  currentLang.code === lang.code ? "current" : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
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

        <button
          className="icon-btn menu-btn"
          onClick={() => setMenuActive(true)}
          aria-label="open menu"
        >
          <i className="fa-solid fa-bars" />
        </button>
      </div>

      {menuActive && (
        <div className="nav-overlay" onClick={() => setMenuActive(false)} />
      )}
    </header>
  );
};

export default Header;