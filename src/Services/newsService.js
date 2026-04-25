import api from "./api";

const newsService = {
  getUniversityNews: async ({
    languageId,
    pageIndex = 1,
    pageSize = 10,
    search = "",
  }) => {
    const response = await api.get("/news/NewsUniv", {
      params: {
        LanguageId: languageId,
        PageIndex: pageIndex,
        PageSize: pageSize,
        Search: search,
      },
    });

    return response.data;
  },

  getSectorsNews: async ({
    languageId,
    pageIndex = 1,
    pageSize = 10,
    search = "",
  }) => {
    const response = await api.get("/news/SectorsNews", {
      params: {
        LanguageId: languageId,
        PageIndex: pageIndex,
        PageSize: pageSize,
        Search: search,
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

  searchByAbbreviation: async ({
    abbreviation,
    lid,
    pageIndex = 1,
    pageSize = 10,
    search = "",
  }) => {
    const response = await api.get("/news/SearchAbbreviation", {
      params: {
        Abbreviation: abbreviation,
        Lid: lid,
        PageIndex: pageIndex,
        PageSize: pageSize,
        Search: search,
      },
    });

    return response.data;
  },
};

export default newsService;