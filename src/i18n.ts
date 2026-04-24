import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// English (EN) imports
import enHome from './Local/EN/Home.json';
import enCollege from "./Local/EN/College.json";
import enContact from "./Local/EN/Contact.json";
import enPrograms from "./Local/EN/Programs.json";
import enNews from "./Local/EN/News.json";
import enNewsDetails from "./Local/EN/NewsDetails.json";
import enLogin from "./Local/EN/Login.json";

// Arabic (AR) imports
import arHome from './Local/AR/Home.json';
import arCollege from "./Local/AR/College.json";
import arContact from "./Local/AR/Contact.json";
import arPrograms from "./Local/AR/Programs.json";
import arNews from "./Local/AR/News.json";
import arNewsDetails from "./Local/AR/NewsDetails.json";
import arLogin from "./Local/AR/Login.json";


// French (FR) imports
import frHome from './Local/FR/Home.json';
import frCollege from "./Local/FR/College.json";
import frContact from "./Local/FR/Contact.json";
import frPrograms from "./Local/FR/Programs.json";
import frNews from "./Local/FR/News.json";
import frNewsDetails from "./Local/FR/NewsDetails.json";
import frLogin from "./Local/FR/Login.json";

// German (DE) imports
import deHome from './Local/DE/Home.json';
import deCollege from "./Local/DE/College.json";
import deContact from "./Local/DE/Contact.json";
import dePrograms from "./Local/DE/Programs.json";
import deNews from "./Local/DE/News.json";
import deNewsDetails from "./Local/DE/NewsDetails.json";
import deLogin from "./Local/DE/Login.json";


i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enHome,
        Contact: enContact,
        College: enCollege,
        Programs: enPrograms,
        News: enNews,
        NewsDetails: enNewsDetails,
        Login: enLogin
      },
      ar: {
        translation: arHome,
        Contact: arContact,
        College: arCollege,
        Programs: arPrograms,
        News: arNews,
        NewsDetails: arNewsDetails,
        Login: arLogin
      },

      fr: {
        translation: frHome,
        Contact: frContact,
        College: frCollege,
        Programs: frPrograms,
        News: frNews,
        NewsDetails: frNewsDetails,
        Login: frLogin
      },
      de: {
        translation: deHome,
        Contact: deContact,
        College: deCollege,
        Programs: dePrograms,
        News: deNews,
        NewsDetails: deNewsDetails,
        Login: deLogin
      },
  
    },
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;