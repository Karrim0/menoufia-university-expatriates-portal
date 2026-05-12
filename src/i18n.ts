import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// ─── EN ───
import enHome from "./Local/EN/Home.json";
import enCollege from "./Local/EN/College.json";
import enContact from "./Local/EN/Contact.json";
import enPrograms from "./Local/EN/Programs.json";
import enNews from "./Local/EN/News.json";
import enNewsDetails from "./Local/EN/NewsDetails.json";
import enLogin from "./Local/EN/Login.json";
import enErrorPage from "./Local/EN/ErrorPage.json";

// ─── AR ───
import arHome from "./Local/AR/Home.json";
import arCollege from "./Local/AR/College.json";
import arContact from "./Local/AR/Contact.json";
import arPrograms from "./Local/AR/Programs.json";
import arNews from "./Local/AR/News.json";
import arNewsDetails from "./Local/AR/NewsDetails.json";
import arLogin from "./Local/AR/Login.json";
import arErrorPage from "./Local/AR/ErrorPage.json";

// ─── FR ───
import frHome from "./Local/FR/Home.json";
import frCollege from "./Local/FR/College.json";
import frContact from "./Local/FR/Contact.json";
import frPrograms from "./Local/FR/Programs.json";
import frNews from "./Local/FR/News.json";
import frNewsDetails from "./Local/FR/NewsDetails.json";
import frLogin from "./Local/FR/Login.json";
import frErrorPage from "./Local/FR/ErrorPage.json";

// ─── DE ───
import deHome from "./Local/DE/Home.json";
import deCollege from "./Local/DE/College.json";
import deContact from "./Local/DE/Contact.json";
import dePrograms from "./Local/DE/Programs.json";
import deNews from "./Local/DE/News.json";
import deNewsDetails from "./Local/DE/NewsDetails.json";
import deLogin from "./Local/DE/Login.json";
import deErrorPage from "./Local/DE/ErrorPage.json";

// ─── CH ───
import chHome from "./Local/CH/Home.json";
import chCollege from "./Local/CH/College.json";
import chContact from "./Local/CH/Contact.json";
import chPrograms from "./Local/CH/Programs.json";
import chNews from "./Local/CH/News.json";
import chNewsDetails from "./Local/CH/NewsDetails.json";
import chLogin from "./Local/CH/Login.json";
import chErrorPage from "./Local/CH/ErrorPage.json";

// ─── FA ───
import faHome from "./Local/FA/Home.json";
import faCollege from "./Local/FA/College.json";
import faContact from "./Local/FA/Contact.json";
import faPrograms from "./Local/FA/Programs.json";
import faNews from "./Local/FA/News.json";
import faNewsDetails from "./Local/FA/NewsDetails.json";
import faLogin from "./Local/FA/Login.json";
import faErrorPage from "./Local/FA/ErrorPage.json";

// ─── IT ───
import itHome from "./Local/IT/Home.json";
import itCollege from "./Local/IT/College.json";
import itContact from "./Local/IT/Contact.json";
import itPrograms from "./Local/IT/Programs.json";
import itNews from "./Local/IT/News.json";
import itNewsDetails from "./Local/IT/NewsDetails.json";
import itLogin from "./Local/IT/Login.json";
import itErrorPage from "./Local/IT/ErrorPage.json";

// ─── JA ───
import jaHome from "./Local/JA/Home.json";
import jaCollege from "./Local/JA/College.json";
import jaContact from "./Local/JA/Contact.json";
import jaPrograms from "./Local/JA/Programs.json";
import jaNews from "./Local/JA/News.json";
import jaNewsDetails from "./Local/JA/NewsDetails.json";
import jaLogin from "./Local/JA/Login.json";
import jaErrorPage from "./Local/JA/ErrorPage.json";

// ─── RU ───
import ruHome from "./Local/RU/Home.json";
import ruCollege from "./Local/RU/College.json";
import ruContact from "./Local/RU/Contact.json";
import ruPrograms from "./Local/RU/Programs.json";
import ruNews from "./Local/RU/News.json";
import ruNewsDetails from "./Local/RU/NewsDetails.json";
import ruLogin from "./Local/RU/Login.json";
import ruErrorPage from "./Local/RU/ErrorPage.json";

// ─── TR ───
import trHome from "./Local/TR/Home.json";
import trCollege from "./Local/TR/College.json";
import trContact from "./Local/TR/Contact.json";
import trPrograms from "./Local/TR/Programs.json";
import trNews from "./Local/TR/News.json";
import trNewsDetails from "./Local/TR/NewsDetails.json";
import trLogin from "./Local/TR/Login.json";
import trErrorPage from "./Local/TR/ErrorPage.json";

const buildResources = (
  Home: any,
  College: any,
  Contact: any,
  Programs: any,
  News: any,
  NewsDetails: any,
  Login: any,
    ErrorPage: any
) => ({
  translation: Home,
  College,
  Contact,
  Programs,
  News,
  NewsDetails,
  Login,
  ErrorPage
});

const getInitialLanguage = () => {
  try {
    const savedLang = JSON.parse(localStorage.getItem("lang") || "{}");

    if (savedLang?.code) {
      return savedLang.code;
    }

    localStorage.setItem(
      "lang",
      JSON.stringify({
        id: 1,
        code: "ar",
        name: "عربي",
        flag: "https://flagcdn.com/w40/eg.png",
      })
    );

    return "ar";
  } catch {
    return "ar";
  }
};

const initialLanguage = getInitialLanguage();

i18n.use(initReactI18next).init({
  resources: {
    en: buildResources(
      enHome,
      enCollege,
      enContact,
      enPrograms,
      enNews,
      enNewsDetails,
      enLogin,
      enErrorPage
    ),
    ar: buildResources(
      arHome,
      arCollege,
      arContact,
      arPrograms,
      arNews,
      arNewsDetails,
      arLogin,
      arErrorPage
    ),
    fr: buildResources(
      frHome,
      frCollege,
      frContact,
      frPrograms,
      frNews,
      frNewsDetails,
      frLogin,
      frErrorPage
    ),
    de: buildResources(
      deHome,
      deCollege,
      deContact,
      dePrograms,
      deNews,
      deNewsDetails,
      deLogin,
      deErrorPage
    ),
    ch: buildResources(
      chHome,
      chCollege,
      chContact,
      chPrograms,
      chNews,
      chNewsDetails,
      chLogin,
      chErrorPage
    ),
    fa: buildResources(
      faHome,
      faCollege,
      faContact,
      faPrograms,
      faNews,
      faNewsDetails,
      faLogin,
      faErrorPage
    ),
    it: buildResources(
      itHome,
      itCollege,
      itContact,
      itPrograms,
      itNews,
      itNewsDetails,
      itLogin,
      itErrorPage
    ),
    ja: buildResources(
      jaHome,
      jaCollege,
      jaContact,
      jaPrograms,
      jaNews,
      jaNewsDetails,
      jaLogin,
      jaErrorPage
    ),
    ru: buildResources(
      ruHome,
      ruCollege,
      ruContact,
      ruPrograms,
      ruNews,
      ruNewsDetails,
      ruLogin,
      ruErrorPage
    ),
    tr: buildResources(
      trHome,
      trCollege,
      trContact,
      trPrograms,
      trNews,
      trNewsDetails,
      trLogin,
      trErrorPage
    ),
  },

  lng: initialLanguage,
  fallbackLng: "ar",

  interpolation: {
    escapeValue: false,
  },
});

document.documentElement.lang = initialLanguage;
document.documentElement.dir =
  initialLanguage === "ar" || initialLanguage === "fa" ? "rtl" : "ltr";

export default i18n;