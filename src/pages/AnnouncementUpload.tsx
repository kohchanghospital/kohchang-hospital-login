import { useState } from "react";
import api from "../services/api";
import AdminLayout from "../layouts/Layout";

type User = { id: number; name: string; email: string };
type Props = { user: User; onLogout: () => void };

export default function AnnouncementUpload({ user, onLogout }: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState("");
    const [type, setType] = useState("news");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) {
            setMessage("กรุณาเลือกไฟล์ PDF");
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const formData = new FormData();
            formData.append("title", title);
            formData.append("type", type);
            formData.append("file", file);

            await api.post("/api/announcements", formData);

            setMessage("อัปโหลดสำเร็จ 🎉");
            setFile(null);
            setTitle("");
            setType("news");
        } catch (err: any) {
            setMessage(err.response?.data?.message || "อัปโหลดไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AdminLayout user={user} onLogout={onLogout}>
            <div className="bg-white rounded-xl shadow p-6 max-w-xl">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                    อัปโหลดประกาศ (PDF)
                </h2>

                {message && <div className="mb-4 text-sm">{message}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm mb-1">หัวข้อ</label>
                        <input
                            type="text"
                            className="w-full border rounded-lg px-3 py-2"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1">ประเภท</label>
                        <select
                            className="w-full border rounded-lg px-3 py-2"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            <option value="news">ข่าวสาร/ประชาสัมพันธ์</option>
                            <option value="procurement">จัดซื้อจัดจ้าง</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm mb-1">ไฟล์ PDF</label>
                        <input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            required
                        />
                        {file && (
                            <div className="text-sm text-gray-500 mt-1">
                                ไฟล์ที่เลือก: {file.name}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
                    >
                        {loading ? "กำลังอัปโหลด..." : "อัปโหลด"}
                    </button>
                </form>
            </div>
        </AdminLayout>
    );
}
