import React, { useMemo, useState } from "react";
import "./CollegeAndProgramsPage.css";
import Header from "../HomePage/Header/Header";
import Footer from "../HomePage/Footer/Footer";
import { useTranslation } from "react-i18next";
import { FaGraduationCap, FaSearch } from "react-icons/fa";
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

    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }

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
      const programsList = Array.isArray(college?.programs)
        ? college.programs
        : [];

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
      const title = sector.title.toLowerCase();
      const desc = sector.description.toLowerCase();
      const colleges = sector.colleges.join(" ").toLowerCase();
      const term = searchTerm.toLowerCase();

      return title.includes(term) || desc.includes(term) || colleges.includes(term);
    });
  }, [sectors, searchTerm]);

  const clearSearch = () => setSearchTerm("");

  return (
    <div className={`college-programs-page ${isArabic ? "rtl" : "ltr"}`}>
      <Header />

      <section
        className="cap-hero"
        style={{
          backgroundImage:
            "url(https://portaltest.menofia.edu.eg/images/AboutUniversity.jpg)",
          backgroundPosition: "top",
          backgroundSize: "cover",
        }}
      >
        <div className="cap-hero-overlay"></div>

        <div className="cap-hero-content">
          

          <h1 className="cap-title">
            {isArabic ? "الكليات والبرامج" : "Colleges & Programs"}
          </h1>

          <p className="cap-subtitle">
            {isArabic
              ? "استكشف كليات الجامعة وبرامجها الأكاديمية من مكان واحد بسهولة ووضوح."
              : "Explore the university’s colleges and academic programs from one unified place."}
          </p>

          <div className="cap-searchBox">
            <FaSearch className="cap-searchIcon" />
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
          </div>

          <div className="cap-switcher">
            <button
              type="button"
              className={`cap-switchBtn ${activeTab === "programs" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("programs");
                setSearchTerm("");
              }}
            >
              {isArabic ? "البرامج" : "Programs"}
            </button>

            <button
              type="button"
              className={`cap-switchBtn ${activeTab === "colleges" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("colleges");
                setSearchTerm("");
              }}
            >
              {isArabic ? "الكليات" : "Colleges"}
            </button>
          </div>
        </div>
      </section>

      <section className="cap-content">
        <div className="cap-container">
          {activeTab === "programs" ? (
            <>
              <div className="cap-sectionHead">
                <h2>{isArabic ? "البرامج الأكاديمية" : "Academic Programs"}</h2>
                <p>
                  {isArabic
                    ? "تصفح البرامج المتاحة داخل كل كلية بشكل منظم وواضح."
                    : "Browse available programs within each college in a clear organized view."}
                </p>
              </div>

              {filteredPrograms.length === 0 ? (
                <div className="cap-noResults">
                  <FaSearch />
                  <h3>{t("note.No colleges found", { ns: "Programs" })}</h3>
                  <button type="button" onClick={clearSearch}>
                    {t("note.Clear Search", { ns: "Programs" })}
                  </button>
                </div>
              ) : (
                <div className="cap-programsGrid">
                  {filteredPrograms.map((college, index) => (
                    <div className="cap-programCard" key={`${college.name}-${index}`}>
                      <img
                        src={getImageSrc(college.image)}
                        alt={college.name || ""}
                        className="cap-programImage"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = defaultProgramImage;
                        }}
                      />

                      <div className="cap-programBody">
                        <h3 className="cap-programTitle">{college.name}</h3>

                        <p className="cap-programSubtitle">
                          {t("note.programs", { ns: "Programs" })}
                        </p>

                        <ul className="cap-programList">
                          {(Array.isArray(college.programs)
                            ? college.programs
                            : []
                          ).map((prog, i) => (
                            <li key={i}>
                              <FaGraduationCap />
                              <span>{prog}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="cap-programFooter">
                          <Link
                            to={college.link || "#"}
                            className="cap-programLink"
                            onClick={() => window.scrollTo(0, 0)}
                          >
                            {isArabic ? "عرض التفاصيل" : "View Details"}
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="cap-rankingCard">
                <span className="cap-rankingLabel">
                  {isArabic ? "التصنيف الدولي" : "International Ranking"}
                </span>
                <h2>
                  {isArabic
                    ? "ثلاثة وعشرون كلية ومعهدًا"
                    : "Twenty-three colleges and institutes"}
                </h2>
                <p>
                  {isArabic
                    ? "حققت الجامعة مراكز متقدمة في التصنيفات الدولية والعربية، كما احتلت مراكز متميزة في مؤشرات الاستدامة والبحث العلمي والأداء الأكاديمي."
                    : "The university has achieved advanced positions in international and Arab rankings, with distinguished results in sustainability, scientific research, and academic performance."}
                </p>
              </div>

              <div className="cap-sectionHead">
                <h2>{isArabic ? "قطاعات الكليات" : "College Sectors"}</h2>
                <p>
                  {isArabic
                    ? "تعرف على قطاعات الجامعة والكليات التابعة لكل قطاع."
                    : "Explore the university sectors and the colleges included in each sector."}
                </p>
              </div>

              {filteredSectors.length === 0 ? (
                <div className="cap-noResults">
                  <FaSearch />
                  <h3>
                    {isArabic ? "لم يتم العثور على نتائج" : "No results found"}
                  </h3>
                  <button type="button" onClick={clearSearch}>
                    {isArabic ? "مسح البحث" : "Clear Search"}
                  </button>
                </div>
              ) : (
                <div className="cap-sectorsList">
                  {filteredSectors.map((sector) => (
                    <div
                      className={`cap-sectorCard ${
                        expandedSector === sector.id ? "expanded" : ""
                      }`}
                      key={sector.id}
                    >
                      <button
                        type="button"
                        className="cap-sectorHeader"
                        onClick={() =>
                          setExpandedSector(
                            expandedSector === sector.id ? null : sector.id
                          )
                        }
                      >
                        <div>
                          <h3>{sector.title}</h3>
                          <p>{sector.description}</p>
                        </div>
                        <span>{expandedSector === sector.id ? "−" : "+"}</span>
                      </button>

                      <div className="cap-sectorDetails">
                        <div className="cap-sectorAbout">
                          <h4>{isArabic ? "عن القطاع" : "About Sector"}</h4>
                          <p>{sector.detailText}</p>
                        </div>

                        <div className="cap-sectorColleges">
                          <h4>{isArabic ? "الكليات" : "Colleges"}</h4>
                          <div>
                            {sector.colleges.map((college, i) => (
                              <span key={i}>{college}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
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