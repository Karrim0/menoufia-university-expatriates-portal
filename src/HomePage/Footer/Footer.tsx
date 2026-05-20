import React from "react";
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

const Footer: React.FC = () => {
  const { i18n, t } = useTranslation();

  const isRTL = i18n.dir() === "rtl";
  const currentYear = new Date().getFullYear();

  const moreLabel = t("footerModern.more", {
    defaultValue: isRTL ? "المزيد" : "More",
  });

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
            "footerModern.sections.researchDevelopment.links.measurementCenter"
          ),
          href: "https://mu.menofia.edu.eg/CenEv/SectorsHome/ar",
        },
        {
          label: t(
            "footerModern.sections.researchDevelopment.links.excellenceCenters"
          ),
          href: "https://www.menofia.edu.eg/View/63344/ar",
        },
        {
          label: t("footerModern.sections.researchDevelopment.links.isoCourses"),
          href: "https://www.menofia.edu.eg/View/126087/ar",
        },
        {
          label: t(
            "footerModern.sections.researchDevelopment.links.researchEthics"
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
            "footerModern.sections.digitalTransformation.links.digitalSystems"
          ),
          href: "https://services.menofia.education/dtfc/Account/Login",
        },
        {
          label: t(
            "footerModern.sections.digitalTransformation.links.eLearningCenter"
          ),
          href: "https://melc.menofia.edu.eg/",
        },
        {
          label: t(
            "footerModern.sections.digitalTransformation.links.digitalLibrary"
          ),
          href: "https://mu.menofia.edu.eg/library/LibraryHome/ar",
        },
        {
          label: t(
            "footerModern.sections.digitalTransformation.links.engineeringLibrary"
          ),
          href: "https://www.menofia.edu.eg/View/129655/ar",
        },
        {
          label: t(
            "footerModern.sections.digitalTransformation.links.governmentComplaints"
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
          label: t("footerModern.sections.programsEducation.links.commercePrograms"),
          href: "https://www.menofia.edu.eg/View/12737/ar",
        },
        {
          label: t(
            "footerModern.sections.programsEducation.links.openLegalEducation"
          ),
          href: "https://www.menofia.edu.eg/View/12738/ar",
        },
        {
          label: t("footerModern.sections.programsEducation.links.blendedArts"),
          href: "https://www.menofia.edu.eg/View/12739/ar",
        },
        {
          label: t(
            "footerModern.sections.programsEducation.links.integratedMedicine"
          ),
          href: "https://www.menofia.edu.eg/View/69836/ar",
        },
        {
          label: t(
            "footerModern.sections.programsEducation.links.electricalComputers"
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
            "footerModern.sections.academicServices.links.undergraduateServices"
          ),
          href: "https://www.menofia.edu.eg/View/64477/ar",
        },
        {
          label: t(
            "footerModern.sections.academicServices.links.postgraduateServices"
          ),
          href: "https://www.menofia.edu.eg/View/64484/ar",
        },
        {
          label: t(
            "footerModern.sections.academicServices.links.postgraduateRegistration"
          ),
          href: "http://193.227.24.15/umisbuilt_new/Registration/PG_admin.aspx",
        },
        {
          label: t("footerModern.sections.academicServices.links.candidateCollege"),
          href: "https://www.menofia.edu.eg/Students/ar",
        },
      ],
    },
  ];

  return (
    <footer className="ft-root" dir={isRTL ? "rtl" : "ltr"}>
      <div className="ft-grid">
        {sections.map((sec, si) => (
          <div
            className="ft-col"
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

            <ul className="ft-links">
              {sec.links.map((lk, li) => (
                <li key={li}>
                  <a
                    href={lk.href}
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

            <button type="button" className="ft-more-btn">
              {moreLabel}
            </button>
          </div>
        ))}
      </div>

      <div className="ft-divider" />

      <div className="ft-bottom">
        <img src={logo1} alt="Menofia University" className="ft-logo" />
        <p className="ft-copy">
          ©️ {currentYear} {t("footerModern.copyrights")}
        </p>
      </div>
    </footer>
  );
};

export default Footer;