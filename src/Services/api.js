import axios from "axios";

const API_URL = "https://newportal.runasp.net/api/v1/";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;