import React, { useMemo, useState } from "react";
import "./CollegeAndProgramsPage.css";
import { useTranslation } from "react-i18next";
import { FaGraduationCap, FaSearch, FaChevronDown } from "react-icons/fa";
import { Link } from "react-router-dom";

const CollegeAndProgramsPage = () => {
  const { t, i18n } = useTranslation(["College", "Programs"]);
  const lang = i18n.language || "ar";
  const isArabic = lang.startsWith("ar");

  const [activeTab, setActiveTab] = useState("programs");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedSector, setExpandedSector] = useState("academic");

  const collegesPrograms = t("colleges", {
    ns: "Programs",
    returnObjects: true,
  });

  const defaultProgramImage =
    "https://portaltest.menofia.edu.eg/images/AboutUniversity.jpg";

  const getImageSrc = (image) => {
    if (!image || typeof image !== "string") return defaultProgramImage;
    if (image.startsWith("http://") || image.startsWith("https://"))
      return image;
    return `https://portaltest.menofia.edu.eg/images/${image.replace(/^\/+/, "")}`;
  };

  const sectors = useMemo(
    () => [
      {
        id: "academic",
        title: isArabic ? "القطاع الهندسي" : "Engineering Sector",
        description: isArabic
          ? "برامج دراسات جامعية وعليا معتمدة"
          : "Accredited undergraduate and postgraduate programs",
        detailText: isArabic
          ? "القطاع الهندسي هو مجال يهتم بتصميم وبناء وتطوير المشاريع مثل المباني والطرق والآلات، ويشمل تخصصات متعددة ويساهم في تحسين حياتنا اليومية."
          : "The engineering sector focuses on designing, building, and developing projects such as buildings, roads, and machines, with multiple specializations that improve daily life.",
        colleges: isArabic
          ? ["كلية الهندسة", "هندسة إلكترونية بمنوف", "الحاسبات والمعلومات", "كلية ذكاء اصطناعي"]
          : ["Faculty of Engineering", "Electronic Engineering Menouf", "Computers and Information", "Artificial Intelligence"],
      },
      {
        id: "research",
        title: isArabic ? "قطاع العلوم" : "Science Sector",
        description: isArabic
          ? "مراكز البحث العلمي والتطوير التكنولوجي"
          : "Scientific research and technological development centers",
        detailText: isArabic
          ? "يهتم قطاع العلوم بالبحث العلمي والتجارب المعملية والتخصصات العلمية الأساسية التي تخدم المجتمع وسوق العمل."
          : "The science sector focuses on scientific research, laboratory work, and core scientific disciplines that serve society and the labor market.",
        colleges: isArabic
          ? ["كلية العلوم", "كلية الزراعة"]
          : ["Faculty of Science", "Faculty of Agriculture"],
      },
      {
        id: "medical",
        title: isArabic ? "القطاع الطبي" : "Medical Sector",
        description: isArabic
          ? "الكليات الطبية والمستشفيات التعليمية"
          : "Medical colleges and teaching hospitals",
        detailText: isArabic
          ? "يضم القطاع الطبي الكليات المرتبطة بالرعاية الصحية والتعليم الطبي، ويهدف إلى إعداد كوادر قادرة على خدمة المجتمع صحيًا."
          : "The medical sector includes colleges related to healthcare and medical education, aiming to prepare qualified professionals to serve the community.",
        colleges: isArabic
          ? ["كلية الطب", "كلية طب الأسنان", "كلية الصيدلة", "كلية التمريض", "كلية الطب البيطري"]
          : ["Faculty of Medicine", "Faculty of Dentistry", "Faculty of Pharmacy", "Faculty of Nursing", "Faculty of Veterinary Medicine"],
      },
      {
        id: "educational",
        title: isArabic ? "القطاع التربوي" : "Educational Sector",
        description: isArabic
          ? "إعداد المعلمين وتطوير العملية التعليمية"
          : "Preparing teachers and improving the educational process",
        detailText: isArabic
          ? "يهتم القطاع التربوي بإعداد المعلمين وتنمية مهاراتهم وتطوير أساليب التعليم بما يخدم المؤسسات التعليمية."
          : "The educational sector focuses on preparing teachers, developing their skills, and improving teaching methods for educational institutions.",
        colleges: isArabic
          ? ["كلية التربية", "كلية التربية النوعية", "كلية التربية للطفولة المبكرة", "كلية التربية الرياضية"]
          : ["Faculty of Education", "Faculty of Specific Education", "Early Childhood Education", "Physical Education"],
      },
    ],
    [isArabic]
  );

  const filteredPrograms = useMemo(() => {
    if (!Array.isArray(collegesPrograms)) return [];
    return collegesPrograms.filter((college) => {
      const collegeName = college?.name?.toLowerCase?.() || "";
      const programsList = Array.isArray(college?.programs) ? college.programs : [];
      return (
        collegeName.includes(searchTerm.toLowerCase()) ||
        programsList.some((prog) =>
          prog?.toLowerCase?.().includes(searchTerm.toLowerCase())
        )
      );
    });
  }, [collegesPrograms, searchTerm]);

  const filteredSectors = useMemo(() => {
    return sectors.filter((sector) => {
      const term = searchTerm.toLowerCase();
      return (
        sector.title.toLowerCase().includes(term) ||
        sector.description.toLowerCase().includes(term) ||
        sector.colleges.join(" ").toLowerCase().includes(term)
      );
    });
  }, [sectors, searchTerm]);

  const clearSearch = () => setSearchTerm("");

  return (
    <div className={`cap-page ${isArabic ? "cap-rtl" : "cap-ltr"}`}>

      {/* ══════ Hero ══════ */}
      <section className="cap-hero">
        <div className="cap-hero-bg">
          <img
            src="https://portaltest.menofia.edu.eg/images/AboutUniversity.jpg"
            alt=""
            aria-hidden="true"
          />
        </div>
        <div className="cap-hero-overlay" />

        <div className="cap-hero-inner">
          <span className="cap-hero-badge">
            {isArabic ? "جامعة المنوفية" : "Menoufia University"}
          </span>

          <h1 className="cap-hero-title">
            {isArabic ? "الكليات والبرامج الأكاديمية" : "Colleges & Academic Programs"}
          </h1>

          <p className="cap-hero-desc">
            {isArabic
              ? "استكشف كليات الجامعة وبرامجها الأكاديمية من مكان واحد بسهولة ووضوح."
              : "Explore the university's colleges and academic programs from one unified place."}
          </p>

          {/* Search */}
          <div className="cap-search">
            <FaSearch className="cap-search-icon" />
            <input
              type="text"
              placeholder={
                activeTab === "programs"
                  ? t("note.searchPlaceholder", { ns: "Programs" })
                  : isArabic
                    ? "ابحث عن قطاع أو كلية..."
                    : "Search for a sector or college..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="cap-search-clear" onClick={clearSearch} type="button">✕</button>
            )}
          </div>

          {/* Tabs */}
          <div className="cap-tabs">
            <button
              type="button"
              className={`cap-tab ${activeTab === "programs" ? "cap-tab--active" : ""}`}
              onClick={() => { setActiveTab("programs"); setSearchTerm(""); }}
            >
              <FaGraduationCap />
              {isArabic ? "البرامج" : "Programs"}
            </button>
            <button
              type="button"
              className={`cap-tab ${activeTab === "colleges" ? "cap-tab--active" : ""}`}
              onClick={() => { setActiveTab("colleges"); setSearchTerm(""); }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              {isArabic ? "الكليات" : "Colleges"}
            </button>
          </div>
        </div>
      </section>

      {/* ══════ Content ══════ */}
      <section className="cap-body">
        <div className="cap-wrap">

          {activeTab === "programs" ? (
            <>
              <div className="cap-section-header">
                <h2>{isArabic ? "البرامج الأكاديمية" : "Academic Programs"}</h2>
                <p>{isArabic
                  ? "تصفح البرامج المتاحة داخل كل كلية بشكل منظم وواضح."
                  : "Browse available programs within each college in a clear organized view."}</p>
              </div>

              {filteredPrograms.length === 0 ? (
                <div className="cap-empty">
                  <div className="cap-empty-icon">
                    <FaSearch />
                  </div>
                  <h3>{t("note.No colleges found", { ns: "Programs" })}</h3>
                  <button type="button" onClick={clearSearch}>
                    {t("note.Clear Search", { ns: "Programs" })}
                  </button>
                </div>
              ) : (
                <div className="cap-grid">
                  {filteredPrograms.map((college, index) => (
                    <article className="cap-card" key={`${college.name}-${index}`}>
                      <div className="cap-card-img">
                        <img
                          src={getImageSrc(college.image)}
                          alt={college.name || ""}
                          loading="lazy"
                          onError={(e) => { e.currentTarget.src = defaultProgramImage; }}
                        />
                        <div className="cap-card-img-overlay">
                          <span className="cap-card-count">
                            {Array.isArray(college.programs) ? college.programs.length : 0}{" "}
                            {isArabic ? "برنامج" : "Programs"}
                          </span>
                        </div>
                      </div>

                      <div className="cap-card-body">
                        <h3 className="cap-card-title">{college.name}</h3>

                        <ul className="cap-card-list">
                          {(Array.isArray(college.programs) ? college.programs : []).map(
                            (prog, i) => (
                              <li key={i}>
                                <span className="cap-card-dot" />
                                <span>{prog}</span>
                              </li>
                            )
                          )}
                        </ul>

                        <Link
                          to={college.link || "#"}
                          className="cap-card-btn"
                          onClick={() => window.scrollTo(0, 0)}
                        >
                          {isArabic ? "عرض التفاصيل" : "View Details"}
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Ranking */}
              <div className="cap-highlight">
                <div className="cap-highlight-content">
                  <span className="cap-highlight-label">
                    {isArabic ? "التصنيف الدولي" : "International Ranking"}
                  </span>
                  <h2>{isArabic ? "ثلاثة وعشرون كلية ومعهدًا" : "Twenty-three colleges and institutes"}</h2>
                  <p>{isArabic
                    ? "حققت الجامعة مراكز متقدمة في التصنيفات الدولية والعربية، كما احتلت مراكز متميزة في مؤشرات الاستدامة والبحث العلمي والأداء الأكاديمي."
                    : "The university has achieved advanced positions in international and Arab rankings, with distinguished results in sustainability, scientific research, and academic performance."}</p>
                </div>
              </div>

              <div className="cap-section-header">
                <h2>{isArabic ? "قطاعات الكليات" : "College Sectors"}</h2>
                <p>{isArabic
                  ? "تعرف على قطاعات الجامعة والكليات التابعة لكل قطاع."
                  : "Explore the university sectors and the colleges included in each sector."}</p>
              </div>

              {filteredSectors.length === 0 ? (
                <div className="cap-empty">
                  <div className="cap-empty-icon"><FaSearch /></div>
                  <h3>{isArabic ? "لم يتم العثور على نتائج" : "No results found"}</h3>
                  <button type="button" onClick={clearSearch}>
                    {isArabic ? "مسح البحث" : "Clear Search"}
                  </button>
                </div>
              ) : (
                <div className="cap-accordion">
                  {filteredSectors.map((sector) => {
                    const isOpen = expandedSector === sector.id;
                    return (
                      <div className={`cap-acc-item ${isOpen ? "cap-acc-item--open" : ""}`} key={sector.id}>
                        <button
                          type="button"
                          className="cap-acc-trigger"
                          onClick={() => setExpandedSector(isOpen ? null : sector.id)}
                        >
                          <div className="cap-acc-trigger-text">
                            <h3>{sector.title}</h3>
                            <p>{sector.description}</p>
                          </div>
                          <span className="cap-acc-chevron">
                            <FaChevronDown />
                          </span>
                        </button>

                        <div className="cap-acc-panel">
                          <div className="cap-acc-panel-inner">
                            <div className="cap-acc-about">
                              <h4>{isArabic ? "عن القطاع" : "About Sector"}</h4>
                              <p>{sector.detailText}</p>
                            </div>

                            <div className="cap-acc-colleges">
                              <h4>{isArabic ? "الكليات" : "Colleges"}</h4>
                              <div className="cap-acc-tags">
                                {sector.colleges.map((college, i) => (
                                  <span key={i} className="cap-acc-tag">{college}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

        </div>
      </section>
    </div>
  );
};

export default CollegeAndProgramsPage;