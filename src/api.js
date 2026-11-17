import axios from "axios";

export const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
const api = axios.create({ baseURL: API });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

export function errMsg(e) {
  const d = e.response?.data?.detail;
  if (Array.isArray(d)) return d.map((x) => x.msg).join(", ");
  if (d && typeof d === "object") return d.message || "Something went wrong.";
  return d || e.message || "Something went wrong.";
}

export const photoSrc = (u) => (u.startsWith("http") ? u : API + u);
