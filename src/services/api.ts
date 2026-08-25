import axios from "axios";

const apiBaseUrl = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

const api = axios.create({
    baseURL: apiBaseUrl,
    withCredentials: true, // สำคัญมากสำหรับ Sanctum
    withXSRFToken: true, // สำคัญมากสำหรับ Sanctum
    headers: {
        Accept: "application/json",
    },
});
// 👉 ดึง user ปัจจุบัน
export const fetchMe = () => api.get("/api/me");

// 👉 logout
export const logout = () => api.post("/logout");

// 👉 ดึงประเภทข่าวสาร
export const fetchAnnouncementTypes = () => api.get("/api/announcement-types");

export default api;
