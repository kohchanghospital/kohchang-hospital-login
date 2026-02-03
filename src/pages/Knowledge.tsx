import { useEffect, useState } from "react";
import AdminLayout from "../layouts/Layout";
import { Icons } from "../icons/Icons";
import KnowledgeModal from "../components/KnowledgeModal";
import api from "../services/api";


type User = { id: number; name: string; email: string };


type Knowledge = {
    id: number;
    title: string;
    file_path: string;
    created_at: string;
};

type Meta = {
    current_page: number;
    last_page: number;
    total: number;
};

type Props = { user: User; onLogout: () => void };

export default function Knowledge({ user, onLogout }: Props) {

    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<Knowledge | null>(null);

    const [items, setItems] = useState<Knowledge[]>([]);
    const [loading, setLoading] = useState(false);

    const [keyword, setKeyword] = useState("");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    const [meta, setMeta] = useState<Meta | null>(null);

    // 🔥 โหลดรายการประกาศจาก API
    const loadData = async () => {
        setLoading(true);

        const params: any = {
            page,
            per_page: perPage,
        };

        if (keyword) params.q = keyword;

        try {
            const res = await api.get("/api/knowledges", { params });

            setItems(res.data.data);
            setMeta({
                current_page: res.data.current_page,
                last_page: res.data.last_page,
                total: res.data.total,
            });
        } catch (err) {
            console.error("โหลดประกาศไม่สำเร็จ ‼️", err);
        }

        setLoading(false);
    };

    // 🔥 โหลดรายการทุกครั้งที่ filter / page เปลี่ยน
    useEffect(() => {
        loadData();
    }, [page, perPage, keyword]);

    return (
        <AdminLayout user={user} onLogout={onLogout}>
            <div className="bg-white rounded-xl shadow p-6">
                <div className="flex justify-between mb-4">
                    <h2 className="text-xl font-bold">สาระความรู้</h2>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                    >
                        + เพิ่มข้อมูล
                    </button>
                    {showModal && (
                        <KnowledgeModal
                            onClose={() => {
                                setShowModal(false);
                            }}
                            onSuccess={() => loadData()}
                        />
                    )}
                    {editingItem && (
                        <KnowledgeModal
                            initialData={editingItem}
                            onClose={() => {
                                setEditingItem(null);
                            }}
                            onSuccess={() => loadData()}
                        />
                    )}
                </div>

                {/* Controls */}
                <div className="flex justify-between items-center mb-4">
                    {/* Filter */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="ค้นหาหัวข้อ..."
                            className="border rounded-lg px-3 py-2"
                            value={keyword}
                            onChange={(e) => {
                                setKeyword(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>

                    <div>
                        <select
                            className="border rounded-lg px-3 py-2"
                            value={perPage}
                            onChange={(e) => {
                                setPerPage(Number(e.target.value));
                                setPage(1);
                            }}
                        >
                            <option value={10}>แสดง 10 รายการ</option>
                            <option value={20}>แสดง 20 รายการ</option>
                            <option value={50}>แสดง 50 รายการ</option>
                            <option value={100}>แสดง 100 รายการ</option>
                            <option value={9999}>แสดงทั้งหมด</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                {loading && <div className="text-gray-500 text-center">กำลังโหลด...</div>}

                {!loading && items.length === 0 && (
                    <div className="text-gray-500 text-center">ไม่พบข้อมูล</div>
                )}

                {!loading && items.length > 0 && (
                    <>
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-center max-w-4">ลำดับ</th>
                                    <th className="text-left py-2">หัวข้อ</th>
                                    <th className="text-center py-2">ไฟล์</th>
                                    <th className="text-center py-2">วันที่</th>
                                    <th className="text-center py-2 w-24">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((i, index) => (
                                    <tr
                                        key={i.id}
                                        className="border-b hover:bg-gray-50 transition"
                                    >
                                        <td className="text-center py-2">
                                            {(meta?.current_page! - 1) * perPage + index + 1}
                                        </td>
                                        <td className="text-left py-2">{i.title}</td>
                                        <td className="text-center py-2">
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
                                        <td className="text-center py-2 items-center justify-center flex gap-2">
                                            <button
                                                onClick={() => setEditingItem(i)}
                                                className="text-yellow-500 hover:underline"
                                                title="แก้ไข"
                                            >
                                                <Icons.Edit />
                                            </button>
                                            |{" "}
                                            <a
                                                href={`/Knowledges/deleted/${i.id}`}
                                                className="text-red-600 hover:underline"
                                                title="ลบ"
                                            >
                                                <Icons.TrashAlt />
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