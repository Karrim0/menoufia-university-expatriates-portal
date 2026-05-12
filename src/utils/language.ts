export const LANG_ID_BY_CODE: Record<string, number> = {
  ar: 1,
  en: 2,
  fr: 3,
  de: 24,
  ja: 23,
  tr: 25,
  fa: 26,
  ru: 27,
  ch: 28,
  it: 29,
};

export const LANG_CODE_BY_ID: Record<number, string> = {
  1: "ar",
  2: "en",
  3: "fr",
  24: "de",
  23: "ja",
  25: "tr",
  26: "fa",
  27: "ru",
  28: "ch",
  29: "it",
};

export const getLanguageId = (code?: string) => {
  return LANG_ID_BY_CODE[String(code || "ar").toLowerCase()] || 1;
};

export const saveLanguage = (lang: any) => {
  localStorage.setItem(
    "lang",
    JSON.stringify({
      id: lang.id,
      name: lang.name,
      code: lang.code,
      flag: lang.flag,
    })
  );
};