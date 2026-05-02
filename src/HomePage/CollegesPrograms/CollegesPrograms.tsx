import React, { useState, useEffect } from "react";
import "./CollegesPrograms.css";
import { useTranslation } from "react-i18next";
import newsService from "../../Services/newsService";

const getLangKey = (lang: string) => {
  if (lang.startsWith("ar")) return "ar";
  if (lang.startsWith("de")) return "de";
  if (lang.startsWith("fr")) return "fr";
  return "en";
};

// ─── Fallback hardcoded ───
const FALLBACK_COLLEGES: Record<string, { name: string; link: string }[]> = {
  ar: [
    { name: "كلية الهندسة",                            link: "https://www.menofia.edu.eg/ENG/Home/ar" },
    { name: "كلية العلوم",                             link: "https://www.menofia.edu.eg/SCI/Home/ar" },
    { name: "كلية الزراعة",                            link: "https://www.menofia.edu.eg/AGR/Home/ar" },
    { name: "كلية الحقوق",                             link: "https://www.menofia.edu.eg/LAW/Home/ar" },
    { name: "كلية التربية",                            link: "https://www.menofia.edu.eg/EDU/Home/ar" },
    { name: "كلية التجارة",                            link: "https://www.menofia.edu.eg/COM/Home/ar" },
    { name: "كلية التمريض",                            link: "https://www.menofia.edu.eg/NUR/Home/ar" },
    { name: "كلية الذكاء الاصطناعي",                  link: "https://mu.menofia.edu.eg/ai/Home/ar"   },
    { name: "كلية الآداب",                             link: "https://www.menofia.edu.eg/ART/Home/ar" },
    { name: "كلية الطب",                               link: "https://www.menofia.edu.eg/MED/Home/ar" },
    { name: "كلية الصيدلة",                            link: "http://mu.menofia.edu.eg/pharm/Home/ar" },
    { name: "كلية الطب البيطري",                       link: "https://mu.menofia.edu.eg/vmed/Home/ar" },
    { name: "كلية الحاسبات والمعلومات",                link: "https://www.menofia.edu.eg/FCI/Home/ar" },
    { name: "كلية التربية للطفولة المبكرة",            link: "https://mu.menofia.edu.eg/fpe/Home/ar"  },
    { name: "كلية الهندسة الإلكترونية بمنوف",          link: "https://www.menofia.edu.eg/ENG/Home/ar" },
    { name: "كلية تكنولوجيا العلوم الصحية التطبيقية", link: "https://mu.menofia.edu.eg/NCI/Home/ar"  },
    { name: "كلية الإعلام",                            link: "https://www.menofia.edu.eg/MED/Home/ar" },
    { name: "كلية التربية النوعية",                    link: "https://www.menofia.edu.eg/EDV/Home/ar" },
    { name: "كلية التربية الرياضية",                   link: "https://www.menofia.edu.eg/PED/Home/ar" },
  ],
  en: [
    { name: "Faculty of Engineering",                        link: "https://www.menofia.edu.eg/ENG/Home/en" },
    { name: "Faculty of Science",                            link: "https://www.menofia.edu.eg/SCI/Home/en" },
    { name: "Faculty of Agriculture",                        link: "https://www.menofia.edu.eg/AGR/Home/en" },
    { name: "Faculty of Law",                                link: "https://www.menofia.edu.eg/LAW/Home/en" },
    { name: "Faculty of Education",                          link: "https://www.menofia.edu.eg/EDU/Home/en" },
    { name: "Faculty of Commerce",                           link: "https://www.menofia.edu.eg/COM/Home/en" },
    { name: "Faculty of Nursing",                            link: "https://www.menofia.edu.eg/NUR/Home/en" },
    { name: "Faculty of Artificial Intelligence",            link: "https://mu.menofia.edu.eg/ai/Home/en"   },
    { name: "Faculty of Arts",                               link: "https://www.menofia.edu.eg/ART/Home/en" },
    { name: "Faculty of Medicine",                           link: "https://www.menofia.edu.eg/MED/Home/en" },
    { name: "Faculty of Pharmacy",                           link: "http://mu.menofia.edu.eg/pharm/Home/en" },
    { name: "Faculty of Veterinary Medicine",                link: "https://mu.menofia.edu.eg/vmed/Home/en" },
    { name: "Faculty of Computers and Information",          link: "https://www.menofia.edu.eg/FCI/Home/en" },
    { name: "Faculty of Early Childhood Education",          link: "https://mu.menofia.edu.eg/fpe/Home/en"  },
    { name: "Faculty of Electronic Engineering, Menouf",     link: "https://www.menofia.edu.eg/ENG/Home/en" },
    { name: "Faculty of Applied Health Sciences Technology", link: "https://mu.menofia.edu.eg/NCI/Home/en"  },
    { name: "Faculty of Mass Communication",                 link: "https://www.menofia.edu.eg/MED/Home/en" },
    { name: "Faculty of Specific Education",                 link: "https://www.menofia.edu.eg/EDV/Home/en" },
    { name: "Faculty of Physical Education",                 link: "https://www.menofia.edu.eg/PED/Home/en" },
  ],
  de: [
    { name: "Fakultät für Ingenieurwesen",             link: "https://www.menofia.edu.eg/ENG/Home/en" },
    { name: "Fakultät für Naturwissenschaften",        link: "https://www.menofia.edu.eg/SCI/Home/en" },
    { name: "Fakultät für Landwirtschaft",             link: "https://www.menofia.edu.eg/AGR/Home/en" },
    { name: "Fakultät für Rechtswissenschaft",         link: "https://www.menofia.edu.eg/LAW/Home/en" },
    { name: "Fakultät für Pädagogik",                  link: "https://www.menofia.edu.eg/EDU/Home/en" },
    { name: "Fakultät für Handel",                     link: "https://www.menofia.edu.eg/COM/Home/en" },
    { name: "Fakultät für Krankenpflege",              link: "https://www.menofia.edu.eg/NUR/Home/en" },
    { name: "Fakultät für Künstliche Intelligenz",     link: "https://mu.menofia.edu.eg/ai/Home/en"   },
    { name: "Fakultät für Geisteswissenschaften",      link: "https://www.menofia.edu.eg/ART/Home/en" },
    { name: "Fakultät für Medizin",                    link: "https://www.menofia.edu.eg/MED/Home/en" },
    { name: "Fakultät für Pharmazie",                  link: "http://mu.menofia.edu.eg/pharm/Home/en" },
    { name: "Fakultät für Veterinärmedizin",           link: "https://mu.menofia.edu.eg/vmed/Home/en" },
    { name: "Fakultät für Informatik",                 link: "https://www.menofia.edu.eg/FCI/Home/en" },
    { name: "Fakultät für Frühkindliche Bildung",      link: "https://mu.menofia.edu.eg/fpe/Home/en"  },
    { name: "Elektronisches Ingenieurwesen Menouf",    link: "https://www.menofia.edu.eg/ENG/Home/en" },
    { name: "Angewandte Gesundheitstechnologie",       link: "https://mu.menofia.edu.eg/NCI/Home/en"  },
    { name: "Fakultät für Massenkommunikation",        link: "https://www.menofia.edu.eg/MED/Home/en" },
    { name: "Fakultät für Spezielle Pädagogik",        link: "https://www.menofia.edu.eg/EDV/Home/en" },
    { name: "Fakultät für Sportpädagogik",             link: "https://www.menofia.edu.eg/PED/Home/en" },
  ],
  fr: [
    { name: "Faculté d'Ingénierie",                    link: "https://www.menofia.edu.eg/ENG/Home/en" },
    { name: "Faculté des Sciences",                    link: "https://www.menofia.edu.eg/SCI/Home/en" },
    { name: "Faculté d'Agriculture",                   link: "https://www.menofia.edu.eg/AGR/Home/en" },
    { name: "Faculté de Droit",                        link: "https://www.menofia.edu.eg/LAW/Home/en" },
    { name: "Faculté de Pédagogie",                    link: "https://www.menofia.edu.eg/EDU/Home/en" },
    { name: "Faculté de Commerce",                     link: "https://www.menofia.edu.eg/COM/Home/en" },
    { name: "Faculté des Soins Infirmiers",            link: "https://www.menofia.edu.eg/NUR/Home/en" },
    { name: "Faculté d'Intelligence Artificielle",     link: "https://mu.menofia.edu.eg/ai/Home/en"   },
    { name: "Faculté des Lettres",                     link: "https://www.menofia.edu.eg/ART/Home/en" },
    { name: "Faculté de Médecine",                     link: "https://www.menofia.edu.eg/MED/Home/en" },
    { name: "Faculté de Pharmacie",                    link: "http://mu.menofia.edu.eg/pharm/Home/en" },
    { name: "Faculté de Médecine Vétérinaire",         link: "https://mu.menofia.edu.eg/vmed/Home/en" },
    { name: "Faculté d'Informatique",                  link: "https://www.menofia.edu.eg/FCI/Home/en" },
    { name: "Éducation de la Petite Enfance",          link: "https://mu.menofia.edu.eg/fpe/Home/en"  },
    { name: "Ingénierie Électronique de Menouf",       link: "https://www.menofia.edu.eg/ENG/Home/en" },
    { name: "Sciences de la Santé Appliquées",         link: "https://mu.menofia.edu.eg/NCI/Home/en"  },
    { name: "Faculté de Communication de Masse",       link: "https://www.menofia.edu.eg/MED/Home/en" },
    { name: "Faculté de Pédagogie Spécifique",         link: "https://www.menofia.edu.eg/EDV/Home/en" },
    { name: "Faculté d'Éducation Physique",            link: "https://www.menofia.edu.eg/PED/Home/en" },
  ],
};

const CollegesPrograms: React.FC = () => {
  const { i18n, t } = useTranslation();
  const isRTL   = i18n.dir() === "rtl";
  const langKey = getLangKey(i18n.language ?? "en");

  const savedLang = (() => {
    try { return JSON.parse(localStorage.getItem("lang") || "{}"); }
    catch { return {}; }
  })();

  const [colleges, setColleges] = useState<{ name: string; link: string }[]>(
    FALLBACK_COLLEGES[langKey] || FALLBACK_COLLEGES.en
  );

  // ─── جيب الكليات من الـ API ───
  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const langId = savedLang?.id || 1;
        const data = await newsService.getColleges(langId);

        // الـ API بيرجع array مباشرة: [{ id, title, url, ... }]
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((item: any) => ({
            name: item.title,
            link: item.url || "#",
          }));
          setColleges(mapped);
        }
      } catch {
        // fallback على الـ hardcoded حسب اللغة
        setColleges(FALLBACK_COLLEGES[langKey] || FALLBACK_COLLEGES.en);
      }
    };

    fetchColleges();
  }, [savedLang?.id, langKey]);

  return (
    <section className={`cp-section ${isRTL ? "cp-rtl" : "cp-ltr"}`}>
      <div className="cp-container">
        <div className="cp-titleWrap">
          <h2 className="cp-title">{t("nav.programs")}</h2>
          <span className="cp-underline" />
        </div>

        <div className="cp-grid">
          {colleges.map((college, index) => (
            <a
              key={index}
              href={college.link}
              target="_blank"
              rel="noopener noreferrer"
              className="cp-item"
            >
              {college.name}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CollegesPrograms;