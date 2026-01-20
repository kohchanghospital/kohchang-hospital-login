import { useEffect, useState } from "react";
import api from "../services/api";
import AdminLayout from "../layouts/Layout";

type News = {
    id: number;
    title: string;
    file_path: string;
    created_at: string;
};

type User = {
    id: number;
    name: string;
    email: string;
};

type Props = {
    user: User;
    onLogout: () => void;
};

const MOCK_NEWS = [
    {
        id: 1,
        title: "ประกาศหยุดให้บริการชั่วคราว",
        file_path: "news/holiday.pdf",
        created_at: "2026-01-15T10:30:00",
    },
    {
        id: 2,
        title: "แนวทางป้องกันไข้หวัดใหญ่",
        file_path: "news/flu-guide.pdf",
        created_at: "2026-01-14T09:00:00",
    },
    {
        id: 3,
        title: "ตารางตรวจแพทย์ประจำสัปดาห์",
        file_path: "news/doctor-schedule.pdf",
        created_at: "2026-01-12T15:45:00",
    },
    {
        id: 4,
        title: "ประชาสัมพันธ์การฉีดวัคซีนโควิด",
        file_path: "news/covid-vaccine.pdf",
        created_at: "2026-01-10T08:20:00",
    },
];


export default function NewsList({ user, onLogout }: Props) {
    // const [news, setNews] = useState<News[]>([]);
    // const [loading, setLoading] = useState(true);
    const [news, setNews] = useState<News[]>(MOCK_NEWS);
    const [loading, setLoading] = useState(false);

    const [error, setError] = useState("");

    const loadNews = async () => {
        try {
            const res = await api.get("/api/news");
            setNews(res.data);
        } catch {
            setError("โหลดข่าวสารไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("ต้องการลบข่าวนี้ใช่หรือไม่?")) return;

        try {
            await api.delete(`/api/news/${id}`);
            setNews(news.filter((n) => n.id !== id));
        } catch {
            alert("ลบไม่สำเร็จ");
        }
    };

    useEffect(() => {
        loadNews();
    }, []);

    return (
        <AdminLayout user={user} onLogout={onLogout}>
            <div className="bg-white rounded-xl shadow p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-800">
                        ข่าวสาร
                    </h2>

                    <a
                        href="/news/upload"
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
                    >
                        + อัปโหลดข่าว
                    </a>
                </div>

                {loading && (
                    <div className="text-gray-500">
                        กำลังโหลด...
                    </div>
                )}

                {error && (
                    <div className="text-red-600">
                        {error}
                    </div>
                )}

                {!loading && news.length === 0 && (
                    <div className="text-gray-500">
                        ยังไม่มีข่าวสาร
                    </div>
                )}

                {!loading && news.length > 0 && (
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="text-left border-b">
                                <th className="py-2">หัวข้อ</th>
                                <th>ไฟล์</th>
                                <th>วันที่</th>
                                <th className="w-24">จัดการ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {news.map((item) => (
                                <tr
                                    key={item.id}
                                    className="border-b hover:bg-gray-50 transition"
                                >
                                    <td className="py-2">
                                        {item.title}
                                    </td>
                                    <td>
                                        <a
                                            href={`http://localhost:8000/storage/${item.file_path}`}
                                            target="_blank"
                                            className="text-primary-600 hover:underline"
                                        >
                                            ดูไฟล์
                                        </a>
                                    </td>
                                    <td>
                                        {new Date(
                                            item.created_at
                                        ).toLocaleDateString("th-TH")}
                                    </td>
                                    <td>
                                        <button
                                            onClick={() =>
                                                handleDelete(item.id)
                                            }
                                            className="text-red-600 hover:underline"
                                        >
                                            ลบ
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </AdminLayout>
    );
}
