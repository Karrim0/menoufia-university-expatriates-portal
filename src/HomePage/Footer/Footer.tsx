import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import "./Footer.css";
import logo1 from "../../assets/MNF_logo.png";

type FooterLink = {
  label: string;
  href: string;
};

type FooterSection = {
  title: string;
  icon: string;
  color: string;
  links: FooterLink[];
};

type SocialLink = {
  label: string;
  href: string;
  icon: string;
};

const VISIBLE_LINKS_COUNT = 4;

const SUPPORTED_LANGS = ["ar", "en", "fr", "de", "tr", "fa", "ru", "ch", "it", "ja"];

const SOCIAL_LINKS: SocialLink[] = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/MenoufiaUniversity",
    icon: "fa-brands fa-facebook-f",
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/channel/UCcoPxoor5XEnac34BwEI_9w",
    icon: "fa-brands fa-youtube",
  },
  {
    label: "X",
    href: "https://x.com/mediamenoufiaun?lang=ar",
    icon: "fa-brands fa-x-twitter",
  },
  {
    label: "LinkedIn",
    href: "https://eg.linkedin.com/school/menofia-university/",
    icon: "fa-brands fa-linkedin-in",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/menoufiauniversity/",
    icon: "fa-brands fa-instagram",
  },
];

const Footer: React.FC = () => {
  const { i18n, t } = useTranslation();

  const currentLangCode = String(i18n.resolvedLanguage || i18n.language || "en")
    .trim()
    .toLowerCase()
    .split("-")[0];

  const safeLangCode = SUPPORTED_LANGS.includes(currentLangCode)
    ? currentLangCode
    : "en";

  const isRTL = safeLangCode === "ar" || safeLangCode === "fa";
  const currentYear = new Date().getFullYear();

  const [openColumns, setOpenColumns] = useState<Record<number, boolean>>({});

  const tx = (key: string, fallback: string, options = {}) =>
    t(key, {
      defaultValue: fallback,
      ...options,
    });

  const localizeUrl = (url: string) => {
    return url.replace(
      /\/(ar|en|fr|de|tr|fa|ru|ch|it|ja)(?=\/?$|[?#])/i,
      `/${safeLangCode}`,
    );
  };

  const moreLabel = tx(
    "footerModern.more",
    isRTL ? "عرض المزيد" : "Show more",
  );

  const lessLabel = tx(
    "footerModern.less",
    isRTL ? "عرض أقل" : "Show less",
  );

  const sections: FooterSection[] = [
    {
      title: t("footerModern.sections.community.title"),
      icon: "fa-solid fa-building-columns",
      color: "#e6f25c",
      links: [
        {
          label: t("footerModern.sections.community.links.convoys"),
          href: "https://www.menofia.edu.eg/View/43474/ar",
        },
        {
          label: t("footerModern.sections.community.links.notary"),
          href: "https://www.menofia.edu.eg/View/133384/ar",
        },
        {
          label: t("footerModern.sections.community.links.specialServices"),
          href: "https://www.menofia.edu.eg/View/66343/ar",
        },
        {
          label: t("footerModern.sections.community.links.crisisManagement"),
          href: "https://mu.menofia.edu.eg/env2/SectorsHome/ar",
        },
        {
          label: t("footerModern.sections.community.links.complaints"),
          href: "https://www.menofia.edu.eg/Complains/ar",
        },
        {
          label: t("footerModern.sections.community.links.importantSites"),
          href: "https://www.menofia.edu.eg/View/66343/ar",
        },
      ],
    },
    {
      title: t("footerModern.sections.campusLife.title"),
      icon: "fa-solid fa-seedling",
      color: "#58df9c",
      links: [
        {
          label: t("footerModern.sections.campusLife.links.youthCare"),
          href: "https://mu.menofia.edu.eg/yw/Home/ar",
        },
        {
          label: t("footerModern.sections.campusLife.links.militaryEducation"),
          href: "https://mu.menofia.edu.eg/miliarityEdu/Home2",
        },
        {
          label: t("footerModern.sections.campusLife.links.universityCities"),
          href: "https://mu.menofia.edu.eg/house/Home/ar",
        },
        {
          label: t("footerModern.sections.campusLife.links.takaful"),
          href: "https://services.menofia.education/Takaful/Account/Login",
        },
        {
          label: t("footerModern.sections.campusLife.links.healthCare"),
          href: "https://193.227.24.9/health/",
        },
        {
          label: t("footerModern.sections.campusLife.links.staffInsurance"),
          href: "https://mu.menofia.edu.eg/SIF/SUHome/ar",
        },
      ],
    },
    {
      title: t("footerModern.sections.researchDevelopment.title"),
      icon: "fa-solid fa-user-group",
      color: "#cfa000",
      links: [
        {
          label: t(
            "footerModern.sections.researchDevelopment.links.measurementCenter",
          ),
          href: "https://mu.menofia.edu.eg/CenEv/SectorsHome/ar",
        },
        {
          label: t(
            "footerModern.sections.researchDevelopment.links.excellenceCenters",
          ),
          href: "https://www.menofia.edu.eg/View/63344/ar",
        },
        {
          label: t("footerModern.sections.researchDevelopment.links.isoCourses"),
          href: "https://www.menofia.edu.eg/View/126087/ar",
        },
        {
          label: t(
            "footerModern.sections.researchDevelopment.links.researchEthics",
          ),
          href: "https://mu.menofia.edu.eg/sci/IACUC/Home/ar",
        },
        {
          label: t("footerModern.sections.researchDevelopment.links.erj"),
          href: "https://erjm.journals.ekb.eg/",
        },
      ],
    },
    {
      title: t("footerModern.sections.digitalTransformation.title"),
      icon: "fa-solid fa-desktop",
      color: "#d48df5",
      links: [
        {
          label: t(
            "footerModern.sections.digitalTransformation.links.digitalSystems",
          ),
          href: "https://services.menofia.education/dtfc/Account/Login",
        },
        {
          label: t(
            "footerModern.sections.digitalTransformation.links.eLearningCenter",
          ),
          href: "https://melc.menofia.edu.eg/",
        },
        {
          label: t(
            "footerModern.sections.digitalTransformation.links.digitalLibrary",
          ),
          href: "https://mu.menofia.edu.eg/library/LibraryHome/ar",
        },
        {
          label: t(
            "footerModern.sections.digitalTransformation.links.engineeringLibrary",
          ),
          href: "https://www.menofia.edu.eg/View/129655/ar",
        },
        {
          label: t(
            "footerModern.sections.digitalTransformation.links.governmentComplaints",
          ),
          href: "https://www.shakwa.eg/GCP/Default.aspx",
        },
      ],
    },
    {
      title: t("footerModern.sections.programsEducation.title"),
      icon: "fa-solid fa-book-open",
      color: "#46b9dd",
      links: [
        {
          label: t(
            "footerModern.sections.programsEducation.links.commercePrograms",
          ),
          href: "https://www.menofia.edu.eg/View/12737/ar",
        },
        {
          label: t(
            "footerModern.sections.programsEducation.links.openLegalEducation",
          ),
          href: "https://www.menofia.edu.eg/View/12738/ar",
        },
        {
          label: t("footerModern.sections.programsEducation.links.blendedArts"),
          href: "https://www.menofia.edu.eg/View/12739/ar",
        },
        {
          label: t(
            "footerModern.sections.programsEducation.links.integratedMedicine",
          ),
          href: "https://www.menofia.edu.eg/View/69836/ar",
        },
        {
          label: t(
            "footerModern.sections.programsEducation.links.electricalComputers",
          ),
          href: "https://www.menofia.edu.eg/View/12740/ar",
        },
      ],
    },
    {
      title: t("footerModern.sections.academicServices.title"),
      icon: "fa-solid fa-graduation-cap",
      color: "#5a8d68",
      links: [
        {
          label: t("footerModern.sections.academicServices.links.expatriates"),
          href: "https://mu.menofia.edu.eg/MUIS/Home/ar",
        },
        {
          label: t("footerModern.sections.academicServices.links.staffServices"),
          href: "https://mu.menofia.edu.eg/MUIS/Home/ar",
        },
        {
          label: t(
            "footerModern.sections.academicServices.links.undergraduateServices",
          ),
          href: "https://www.menofia.edu.eg/View/64477/ar",
        },
        {
          label: t(
            "footerModern.sections.academicServices.links.postgraduateServices",
          ),
          href: "https://www.menofia.edu.eg/View/64484/ar",
        },
        {
          label: t(
            "footerModern.sections.academicServices.links.postgraduateRegistration",
          ),
          href: "http://193.227.24.15/umisbuilt_new/Registration/PG_admin.aspx",
        },
        {
          label: t(
            "footerModern.sections.academicServices.links.candidateCollege",
          ),
          href: "https://www.menofia.edu.eg/Students/ar",
        },
      ],
    },
  ];

  const toggleColumn = (index: number) => {
    setOpenColumns((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <footer className="ft-root" dir={isRTL ? "rtl" : "ltr"}>
      <div className="ft-grid">
        {sections.map((sec, si) => {
          const isOpen = Boolean(openColumns[si]);
          const hasMoreLinks = sec.links.length > VISIBLE_LINKS_COUNT;
          const visibleLinks = isOpen
            ? sec.links
            : sec.links.slice(0, VISIBLE_LINKS_COUNT);

          return (
            <div
              className={`ft-col ${isOpen ? "is-open" : ""}`}
              key={si}
              style={{ "--ac": sec.color } as React.CSSProperties}
            >
              <div className="ft-icon-wrap">
                <span className="ft-icon-ring" />
                <i className={`${sec.icon} ft-icon-glyph`} />
              </div>

              <h3 className="ft-col-title">
                {sec.title.split("\n").map((line, li) => (
                  <React.Fragment key={li}>
                    {line}
                    {li < sec.title.split("\n").length - 1 && <br />}
                  </React.Fragment>
                ))}
              </h3>

              <span className="ft-rule" />

              <div className={`ft-links-box ${isOpen ? "scrollable" : ""}`}>
                <ul className="ft-links">
                  {visibleLinks.map((lk, li) => (
                    <li key={li}>
                      <a
                        href={localizeUrl(lk.href)}
                        className="ft-link"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <span className="ft-link-text">{lk.label}</span>
                        <span className="ft-link-dot" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {hasMoreLinks && (
                <button
                  type="button"
                  className="ft-more-btn"
                  onClick={() => toggleColumn(si)}
                  aria-expanded={isOpen}
                >
                  {isOpen ? lessLabel : moreLabel}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="ft-divider" />

      <div className="ft-modern-bottom">
        <div className="ft-contact-row">
          <div className="ft-contact-card ft-contact-location">
            <div className="ft-contact-text">
              <h4>
                {tx(
                  "footerModern.bottom.locationTitle",
                  isRTL ? "موقعنا" : "Our Location",
                )}
              </h4>

              <p>
                {tx(
                  "footerModern.bottom.locationLine1",
                  isRTL
                    ? "محافظة المنوفية - شبين الكوم"
                    : "Menoufia Governorate - Shebin El-Kom",
                )}
              </p>

              <p>
                {tx(
                  "footerModern.bottom.locationLine2",
                  isRTL
                    ? "محافظة المنوفية، مصر"
                    : "Menoufia Governorate, Egypt",
                )}
              </p>
            </div>

            <div className="ft-contact-icon">
              <i className="fa-solid fa-location-dot" />
            </div>
          </div>

          <div className="ft-contact-card ft-contact-phone">
            <div className="ft-contact-text">
              <h4>
                {tx(
                  "footerModern.bottom.contactTitle",
                  isRTL ? "تواصل معنا" : "Contact Us",
                )}
              </h4>

              <p>0482222170</p>

              <span className="ft-work-time">
                <i className="fa-regular fa-clock" />
                {tx(
                  "footerModern.bottom.workingHours",
                  isRTL
                    ? "ساعات العمل: من 8 صباحا - 4 مساء"
                    : "Working hours: 8 AM - 4 PM",
                )}
              </span>
            </div>

            <div className="ft-contact-icon">
              <i className="fa-solid fa-phone" />
            </div>
          </div>

          <div className="ft-main-logo-wrap">
            <img
              src={logo1}
              alt={tx(
                "footerModern.bottom.logoAlt",
                isRTL ? "جامعة المنوفية" : "Menoufia University",
              )}
              className="ft-main-logo"
            />
          </div>

          <div className="ft-contact-card ft-contact-email">
            <div className="ft-contact-text">
              <h4>
                {tx(
                  "footerModern.bottom.emailTitle",
                  isRTL ? "البريد الإلكتروني" : "Email",
                )}
              </h4>

              <p>info@menofia.edu.eg</p>
            </div>

            <div className="ft-contact-icon">
              <i className="fa-regular fa-envelope" />
            </div>
          </div>
        </div>

        <div className="ft-social-row">
          <span className="ft-social-line" />

          <div className="ft-social-center">
            <strong>
              {tx(
                "footerModern.bottom.followUs",
                isRTL ? "تابعنا على" : "Follow us",
              )}
            </strong>

            <div className="ft-social-icons">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                >
                  <i className={social.icon} />
                </a>
              ))}
            </div>
          </div>

          <span className="ft-social-line" />
        </div>

        <div className="ft-bottom-links-row">
          <p className="ft-copy">
            {tx(
              "footerModern.bottom.copyright",
              isRTL
                ? "جامعة المنوفية - جميع الحقوق محفوظة {{year}}"
                : "Menoufia University - All rights reserved {{year}}",
              { year: currentYear },
            )}
          </p>

          <div className="ft-policy-links">
            <a href="/privacy-policy">
              {tx(
                "footerModern.bottom.privacyPolicy",
                isRTL ? "سياسة الخصوصية" : "Privacy Policy",
              )}
            </a>

            <a href="/terms">
              {tx(
                "footerModern.bottom.termsOfUse",
                isRTL ? "شروط الاستخدام" : "Terms of Use",
              )}
            </a>

            <a href="/site-map">
              {tx(
                "footerModern.bottom.siteMap",
                isRTL ? "خريطة الموقع" : "Site Map",
              )}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;