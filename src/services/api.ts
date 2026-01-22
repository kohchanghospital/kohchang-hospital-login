import axios from "axios";

const api = axios.create({
    baseURL: "http://localhost:8000",
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
