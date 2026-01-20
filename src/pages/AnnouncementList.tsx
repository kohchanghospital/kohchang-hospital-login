import { useEffect, useState } from "react";
import api from "../services/api";
import AdminLayout from "../layouts/Layout";
import { Icons } from "../icons/icons";

type User = { id: number; name: string; email: string };

type Announcement = {
    id: number;
    title: string;
    type: string;
    file_path: string;
    created_at: string;
};

type Meta = {
    current_page: number;
    last_page: number;
    total: number;
};

const MOCK_ANNOUNCEMENTS = [
    {
        id: 1,
        title: "ประกาศหยุดให้บริการชั่วคราว",
        type: "news",
        file_path: "announcements/holiday.pdf",
        created_at: "2026-01-15T10:30:00",
    },
    {
        id: 2,
        title: "แนวทางป้องกันไข้หวัดใหญ่",
        type: "news",
        file_path: "announcements/flu-guide.pdf",
        created_at: "2026-01-14T09:00:00",
    },
    {
        id: 3,
        title: "ประชาสัมพันธ์การฉีดวัคซีนโควิด",
        type: "news",
        file_path: "announcements/covid-vaccine.pdf",
        created_at: "2026-01-13T08:20:00",
    },
    {
        id: 4,
        title: "ประกาศสอบราคาจัดซื้อเวชภัณฑ์",
        type: "procurement",
        file_path: "announcements/medical-supply.pdf",
        created_at: "2026-01-12T14:45:00",
    },
    {
        id: 5,
        title: "TOR จัดซื้อรถพยาบาล",
        type: "procurement",
        file_path: "announcements/ambulance-tor.pdf",
        created_at: "2026-01-11T11:10:00",
    },
];

type Props = { user: User; onLogout: () => void };

export default function AnnouncementList({ user, onLogout }: Props) {
    // const [items, setItems] = useState<Announcement[]>([]);
    const [items, setItems] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS);
    const [loading, setLoading] = useState(false);

    const [type, setType] = useState("");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(5); // 🔥 จำนวนต่อหน้า

    const [meta, setMeta] = useState<Meta | null>(null);
    // const [loading, setLoading] = useState(true);

    // const loadData = async () => {
    //     setLoading(true);

    //     const params: any = { page };
    //     if (type) params.type = type;

    //     const res = await api.get("/api/announcements", { params });

    //     setItems(res.data.data);   // 🔥 data อยู่ใน data.data
    //     setMeta({
    //         current_page: res.data.current_page,
    //         last_page: res.data.last_page,
    //         total: res.data.total,
    //     });

    //     setLoading(false);
    // };

    const loadData = () => {
        let filtered = MOCK_ANNOUNCEMENTS;

        if (type) {
            filtered = filtered.filter((i) => i.type === type);
        }

        const total = filtered.length;
        const last_page = Math.ceil(total / perPage);
        const start = (page - 1) * perPage;
        const end = start + perPage;

        const paginated = filtered.slice(start, end);

        setItems(paginated);
        setMeta({
            current_page: page,
            last_page,
            total,
        });

        setLoading(false);
    };

    useEffect(() => {
        setLoading(true);
        loadData();
    }, [type, page, perPage]); // 🔥 เพิ่ม perPage


    // useEffect(() => {
    //     loadData();
    // }, [type, page]);

    return (
        <AdminLayout user={user} onLogout={onLogout}>
            <div className="bg-white rounded-xl shadow p-6">
                <div className="flex justify-between mb-4">
                    <h2 className="text-xl font-bold">ประกาศ</h2>

                    <a
                        href="/announcements/upload"
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                    >
                        + เพิ่มประกาศ
                    </a>
                </div>

                {/* Controls */}
                <div className="flex justify-between items-center mb-4">
                    {/* Filter */}
                <div className="mb-4">
                    <select
                        className="border rounded-lg px-3 py-2"
                        value={type}
                        onChange={(e) => {
                            setType(e.target.value);
                            setPage(1); // 🔥 reset หน้าเมื่อเปลี่ยน filter
                        }}
                    >
                        <option value="">ทั้งหมด</option>
                        <option value="news">ข่าวสาร/ประชาสัมพันธ์</option>
                        <option value="procurement">จัดซื้อจัดจ้าง</option>
                    </select>
                </div>
                
                    <div>
                        <select
                            className="border rounded-lg px-3 py-2"
                            value={perPage}
                            onChange={(e) => {
                                setPerPage(Number(e.target.value));
                                setPage(1); // 🔥 reset หน้าเมื่อเปลี่ยน perPage
                            }}
                        >
                            <option value={5}>แสดง 5 รายการ</option>
                            <option value={10}>แสดง 10 รายการ</option>
                            <option value={20}>แสดง 20 รายการ</option>
                            <option value={50}>แสดง 50 รายการ</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                {loading && <div className="text-gray-500">กำลังโหลด...</div>}

                {!loading && items.length === 0 && (
                    <div className="text-gray-500">ไม่พบข้อมูล</div>
                )}

                {!loading && items.length > 0 && (
                    <>
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left">หัวข้อ</th>
                                    <th className="text-left">ประเภท</th>
                                    <th className="text-center">ไฟล์</th>
                                    <th className="text-center">วันที่</th>
                                    <th className="text-center">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((i) => (
                                    <tr key={i.id} className="border-b hover:bg-gray-50">
                                        <td className="text-left">{i.title}</td>
                                        <td className="text-left">
                                            {i.type === "news" && "ข่าวสาร/ประชาสัมพันธ์"}
                                            {i.type === "procurement" && "จัดซื้อจัดจ้าง"}
                                        </td>
                                        <td className="text-center">
                                            <a
                                                href={`http://localhost:8000/storage/${i.file_path}`}
                                                target="_blank"
                                                className="text-primary-600 hover:underline"
                                            >
                                                ดูไฟล์
                                            </a>
                                        </td>
                                        <td className="text-center">
                                            {new Date(i.created_at).toLocaleDateString("th-TH")}
                                        </td>
                                        <td className="text-center">
                                            <a
                                                href={`/announcements/edit/${i.id}`}
                                                className="text-red-600 hover:underline"
                                            >
                                                ลบ
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {meta && (
                            <div className="flex justify-between items-center mt-4">
                                <div className="text-sm text-gray-500">
                                    ทั้งหมด {meta.total} รายการ
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        disabled={meta.current_page === 1}
                                        onClick={() => setPage(meta.current_page - 1)}
                                        className="px-3 py-1 border rounded disabled:opacity-50"
                                    >
                                        <Icons.ChevronLeft />
                                    </button>

                                    {Array.from(
                                        { length: meta.last_page },
                                        (_, i) => i + 1
                                    ).map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setPage(p)}
                                            className={`px-3 py-1 border rounded ${p === meta.current_page
                                                ? "bg-primary-600 text-white"
                                                : ""
                                                }`}
                                        >
                                            {p}
                                        </button>
                                    ))}

                                    <button
                                        disabled={meta.current_page === meta.last_page}
                                        onClick={() => setPage(meta.current_page + 1)}
                                        className="px-3 py-1 border rounded disabled:opacity-50"
                                    >
                                        <Icons.ChevronRight />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </AdminLayout>
    );
}
