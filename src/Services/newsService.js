import api from "./api";
import axios from "axios";

const facultyApi = axios.create({
  baseURL: "https://stage.menofia.edu.eg:5050/api",
});
const facultyV1Api = axios.create({
  baseURL: "https://stage.menofia.edu.eg:5050/api/v1",
});
const newsService = {
  getUniversityNews: async ({
    languageId,
    pageIndex = 1,
    pageSize = 10,
    search = "",
    fromDate,
    toDate,
    dateFilter,
  }) => {
    const response = await api.get("/news/NewsUniv", {
      params: {
        LanguageId: languageId,
        PageIndex: pageIndex,
        PageSize: pageSize,
        Search: search,
        ...(dateFilter ? { DateFilter: dateFilter } : {}),
        ...(fromDate ? { FromDate: fromDate } : {}),
        ...(toDate ? { ToDate: toDate } : {}),
      },
    });

    return response.data;
  },

  getSectorsNews: async ({
    languageId,
    pageIndex = 1,
    pageSize = 10,
    search = "",
    fromDate,
    toDate,
    dateFilter,
  }) => {
    const response = await api.get("/news/SectorsNews", {
      params: {
        LanguageId: languageId,
        PageIndex: pageIndex,
        PageSize: pageSize,
        Search: search,
        ...(dateFilter ? { DateFilter: dateFilter } : {}),
        ...(fromDate ? { FromDate: fromDate } : {}),
        ...(toDate ? { ToDate: toDate } : {}),
      },
    });

    return response.data;
  },

  getUniversityNewsById: async (id, lid) => {
    const response = await api.get(`/news/newUniv/${id}/${lid}`);
    return response.data;
  },

  getSectorNewsById: async (id, lid) => {
    const response = await api.get(`/news/newSec/${id}/${lid}`);
    return response.data;
  },

  getNewsById: async (id, lid) => {
    const response = await api.get(`/News/${id}/${lid}`);
    return response.data;
  },

  getLanguages: async () => {
    const response = await api.get("/languages");
    return response.data;
  },

  getFullMenu: async (langId) => {
    const response = await api.get(`/UniversityMenu/full-menu/${langId}`);
    return response.data;
  },

  getColleges: async (langId) => {
    const response = await api.get(`/UniversityMenu/colleges/${langId}`);
    return response.data;
  },

  searchByAbbreviation: async ({
    abbreviation,
    lid,
    pageIndex = 1,
    pageSize = 10,
    search = "",
    fromDate,
    toDate,
    dateFilter,
  }) => {
    const response = await api.get("/news/SearchAbbreviation", {
      params: {
        Abbreviation: abbreviation,
        Lid: lid,
        PageIndex: pageIndex,
        PageSize: pageSize,
        Search: search,
        ...(dateFilter ? { DateFilter: dateFilter } : {}),
        ...(fromDate ? { FromDate: fromDate } : {}),
        ...(toDate ? { ToDate: toDate } : {}),
      },
    });

    return response.data;
  },

  getSectorMenu: async ({ keyword, lang = 1 }) => {
    const response = await facultyApi.get(
      `/UnivPresMenu/${encodeURIComponent(keyword)}`,
      {
        params: {
          lang,
        },
      },
    );

    return response.data;
  },
  getSpecialUnitsMenu: async ({ abbr, lang = 1 }) => {
  const response = await facultyApi.get(
    `/SpecialUnitsMenu/${encodeURIComponent(abbr)}`,
    {
      params: {
        lang,
      },
    },
  );

  return response.data;
},
    getStudentMenu: async ({ lang = 1 }) => {
  const response = await facultyApi.get("/StudentMenu", {
    params: {
      lang,
    },
  });

  return response.data;
},
  getSectorPage: async ({ articleId, lang = 1 }) => {
    const response = await facultyApi.get(`/UnivPresPage/${articleId}`, {
      params: {
        lang,
      },
    });

    return response.data;
  },

  getDepartmentMenu: async ({ facultyCode, departmentCode, lang = 1 }) => {
    const response = await facultyApi.get(
      `/DepartmentMenu/${encodeURIComponent(
        facultyCode,
      )}/${encodeURIComponent(departmentCode)}`,
      {
        params: {
          lang,
        },
      },
    );

    return response.data;
  },

  getHighlights: async ({
    fac,
    langId,
    departmentCode = "",
    pageIndex = 1,
    pageSize = 10,
    search = "",
    fromDate,
    toDate,
  }) => {
    const response = await facultyApi.get("/highlights", {
      params: {
        fac,
        langId,
        departmentCode,
        PageIndex: pageIndex,
        PageSize: pageSize,
        Search: search,
        ...(fromDate ? { FromDate: fromDate } : {}),
        ...(toDate ? { ToDate: toDate } : {}),
      },
    });

    return response.data;
  },

  getFacultyNews: async ({
    fac,
    langId,
    departmentCode = "",
    pageIndex = 1,
    pageSize = 10,
    search = "",
    fromDate,
    toDate,
    dateFilter,
  }) => {
    const response = await facultyApi.get("/faculty-news", {
      params: {
        fac,
        langId,
        departmentCode,
        PageIndex: pageIndex,
        PageSize: pageSize,
        Search: search,
        ...(dateFilter ? { DateFilter: dateFilter } : {}),
        ...(fromDate ? { FromDate: fromDate } : {}),
        ...(toDate ? { ToDate: toDate } : {}),
      },
    });

    return response.data;
  },

  getFacultyNewsDetails: async ({ id, fac, langId, departmentCode = "" }) => {
    const response = await facultyApi.get("/faculty-news/details", {
      params: {
        id,
        fac,
        langId,
        departmentCode,
      },
    });

    return response.data;
  },
  getCollegesLogos: async ({ langId = 1, pageIndex = 1, pageSize = 100 }) => {
    const response = await facultyApi.get("/faculty-news/GetCollegesLogos", {
      params: {
        langId,
        PageIndex: pageIndex,
        PageSize: pageSize,
      },
    });

    return response.data;
  },

  submitComplain: async ({
  fullName,
  email,
  phone,
  categoryId,
  messageText,
  attachments = [],
  facultyCode,
}) => {
  const formData = new FormData();

  const categoryNumber = Number(categoryId);

  formData.append("FullName", String(fullName || "").trim());
  formData.append("Email", String(email || "").trim());
  formData.append("Phone", String(phone || "").trim());
  formData.append("CategoryId", String(categoryNumber));
  formData.append("MessageText", String(messageText || "").trim());

  formData.append(
    "FacultyCode",
    categoryNumber === 3 ? String(facultyCode || "").trim() : "",
  );

  if (Array.isArray(attachments) && attachments.length > 0) {
    attachments.forEach((file) => {
      formData.append("Attachments", file);
    });
  } else {
    formData.append("Attachments", "string");
  }

  const response = await facultyApi.post("/Complain/submit", formData, {
    headers: {
      accept: "*/*",
    },
  });

  return response.data;
},
  replyToComplain: async ({ complainId, replyText }) => {
    const response = await facultyApi.post(
      `/Complain/reply/${complainId}`,
      {
        replyText,
      },
      {
        headers: {
          "Content-Type": "application/json",
          accept: "*/*",
        },
      },
    );

    return response.data;
  },
  getSpecialUnitsMenuByLang: async ({ langId = 1 } = {}) => {
  const response = await facultyV1Api.get(
    `/UniversityMenu/special-units/menu/${langId}`,
  );

  return response.data;
},
getSpecialUnitsLogos: async ({ pageIndex = 1, pageSize = 100 } = {}) => {
  const response = await facultyApi.get("/SpecialUnitsLogos", {
    params: {
      PageIndex: pageIndex,
      PageSize: pageSize,
    },
  });

  return response.data;
},
getGeneralAdministrations: async ({ langId = 1 } = {}) => {
  const response = await facultyApi.get("/GeneralAdministrations", {
    params: {
      langId,
    },
  });

  return response.data;
},
getUniversityMenu: async (langId = 1) => {
  const response = await facultyApi.get("/UniversityMenu", {
    params: {
      langId,
    },
  });

  return response.data;
},
};

export default newsService;
