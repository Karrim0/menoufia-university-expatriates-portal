import api from "./api";
import axios from "axios";

const facultyApi = axios.create({
  baseURL: "http://193.227.24.31:5050/api",
  headers: {
    "Content-Type": "application/json",
  },
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

  getHighlights: async ({
  fac,
  langId,
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

  getFacultyNewsDetails: async (id, fac, langId) => {
    const response = await facultyApi.get("/faculty-news/details", {
      params: {
        id,
        fac,
        langId,
      },
    });

    return response.data;
  },
};

export default newsService;