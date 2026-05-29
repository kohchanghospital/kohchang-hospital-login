import { useEffect, useState } from "react";
import AdminLayout from "../layouts/Layout";
import { Icons } from "../icons/Icons";
import api, { fetchAnnouncementTypes } from "../services/api";
import AnnouncementModal from "../components/AnnouncementModal";
import { TablePageSkeleton, TableRowsSkeleton } from "../components/SkeletonScreens";


type User = { id: number; name: string; email: string };

type AnnouncementType = {
    id: number;
    name: string;
};

type Announcement = {
    id: number;
    title: string;
    type_id: number;
    type: AnnouncementType;
    file_path: string;
    created_at: string;
};

type Meta = {
    current_page: number;
    last_page: number;
    total: number;
};

type Props = { user: User; onLogout: () => void };

export default function AnnouncementList({ user, onLogout }: Props) {

    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<Announcement | null>(null);

    const [types, setTypes] = useState<AnnouncementType[]>([]);
    const [items, setItems] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [typesLoaded, setTypesLoaded] = useState(false);
    const [itemsLoaded, setItemsLoaded] = useState(false);

    const [type, setType] = useState("");
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

        if (type) params.type_id = type;
        if (keyword) params.q = keyword;

        try {
            const res = await api.get("/api/announcements", { params });

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
        setItemsLoaded(true);
    };

    // 🔥 โหลดประเภท dropdown
    useEffect(() => {
        fetchAnnouncementTypes()
            .then((res) => setTypes(res.data.data))
            .catch((err) => console.error("โหลดประเภทไม่สำเร็จ ‼️", err))
            .finally(() => setTypesLoaded(true));
    }, []);

    // 🔥 โหลดรายการทุกครั้งที่ filter / page เปลี่ยน
    useEffect(() => {
        loadData();
    }, [type, page, perPage, keyword]);

    if (!typesLoaded || !itemsLoaded) {
        return (
            <AdminLayout user={user} onLogout={onLogout}>
                <TablePageSkeleton columns={6} filters={2} />
            </AdminLayout>
        );
    }

    return (
        <AdminLayout user={user} onLogout={onLogout}>
            <div className="page-surface page-pad">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-xl font-bold text-slate-900">ประกาศ</h2>
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn-primary"
                    >
                        + เพิ่มประกาศ
                    </button>
                    {showModal && (
                        <AnnouncementModal
                            types={types}
                            onClose={() => {
                                setShowModal(false);
                            }}
                            onSuccess={() => loadData()}
                        />
                    )}
                    {editingItem && (
                        <AnnouncementModal
                            types={types}
                            initialData={editingItem}
                            onClose={() => {
                                setEditingItem(null);
                            }}
                            onSuccess={() => loadData()}
                        />
                    )}
                </div>

                {/* Controls */}
                <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    {/* Filter */}
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <select
                            className="w-full sm:w-44"
                            value={type}
                            onChange={(e) => {
                                setType(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="">ทั้งหมด</option>
                            {types.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                        <input
                            type="text"
                            placeholder="ค้นหาหัวข้อ..."
                            className="w-full sm:w-64"
                            value={keyword}
                            onChange={(e) => {
                                setKeyword(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>

                    <div>
                        <select
                            className="w-full sm:w-48"
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
                {loading && <TableRowsSkeleton columns={6} rows={5} />}

                {!loading && items.length === 0 && (
                    <div className="text-gray-500 text-center">ไม่พบข้อมูล</div>
                )}

                {!loading && items.length > 0 && (
                    <>
                        <div className="table-wrap">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-center max-w-4">ลำดับ</th>
                                    <th className="text-left py-2">หัวข้อ</th>
                                    <th className="text-left py-2">ประเภท</th>
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
                                        <td className="text-left py-2">{i.type?.name}</td>
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
                                                href={`/announcements/deleted/${i.id}`}
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
                        </div>

                        {/* Pagination */}
                        {meta && (
                            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="text-sm text-gray-500">
                                    ทั้งหมด {meta.total} รายการ
                                </div>
                                <div className="flex flex-wrap gap-2">
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
