import axios from "axios";
import Cookies from "js-cookie";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

// Automatically attach the cookie-based token if present, without overwriting manual headers
api.interceptors.request.use((config) => {
  if (config.headers && config.headers.Authorization) {
    return config;
  }

  const token = Cookies.get("token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
