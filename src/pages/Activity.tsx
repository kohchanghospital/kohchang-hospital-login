import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import AdminLayout from "../layouts/Layout";
import { Icons } from "../icons/Icons";
import api from "../services/api";
import ActivityModal, { type ActivityRecord } from "../components/ActivityModal";
import { TablePageSkeleton } from "../components/SkeletonScreens";

type User = { id: number; name: string; email: string };
type Meta = { current_page: number; last_page: number; total: number };
type Props = { user: User; onLogout: () => void };

const thaiDate = (date: string) => {
    const [year, month, day] = date.slice(0, 10).split("-").map(Number);
    return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric" }).format(new Date(year, month - 1, day));
};

const timeRange = (activity: ActivityRecord) => {
    const start = activity.start_time?.slice(0, 5);
    const end = activity.end_time?.slice(0, 5);
    if (start && end) return `${start} - ${end}`;
    return start ?? end ?? "ตลอดวัน";
};

export default function Activity({ user, onLogout }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [editingItem, setEditingItem] = useState<ActivityRecord | null>(null);
    const [viewingItem, setViewingItem] = useState<ActivityRecord | null>(null);
    const [items, setItems] = useState<ActivityRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [keyword, setKeyword] = useState("");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [meta, setMeta] = useState<Meta | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("/api/activities", { params: { page, per_page: perPage, q: keyword || undefined } });
            setItems(response.data.data);
            setMeta({ current_page: response.data.current_page, last_page: response.data.last_page, total: response.data.total });
        } catch {
            toast.error("โหลดข้อมูลกิจกรรมไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    }, [keyword, page, perPage]);

    useEffect(() => { void loadData(); }, [loadData]);

    const deleteActivity = async (activity: ActivityRecord) => {
        if (!window.confirm(`ยืนยันการลบกิจกรรม “${activity.title}” หรือไม่?`)) return;
        const toastId = toast.loading("กำลังลบกิจกรรม...");
        try {
            await api.delete(`/api/activities/${activity.id}`);
            toast.success("ลบกิจกรรมเรียบร้อย", { id: toastId });
            if (items.length === 1 && page > 1) setPage((current) => current - 1);
            else await loadData();
        } catch {
            toast.error("ลบกิจกรรมไม่สำเร็จ", { id: toastId });
        }
    };

    if (loading && items.length === 0) {
        return <AdminLayout user={user} onLogout={onLogout}><TablePageSkeleton columns={7} filters={1} /></AdminLayout>;
    }

    return (
        <AdminLayout user={user} onLogout={onLogout}>
            <div className="page-surface page-pad">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div><h2 className="text-xl font-bold text-slate-900">ปฏิทินกิจกรรม</h2><p className="mt-1 text-sm text-slate-500">จัดการกิจกรรมที่แสดงบนเว็บไซต์โรงพยาบาล</p></div>
                    <button onClick={() => setShowCreate(true)} className="btn-primary">+ เพิ่มกิจกรรม</button>
                </div>
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <input type="search" placeholder="ค้นหาหัวข้อกิจกรรม..." className="w-full sm:w-72" value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(1); }} />
                    <select className="w-full sm:w-48" value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}>
                        {[10, 20, 50, 100].map((size) => <option key={size} value={size}>แสดง {size} รายการ</option>)}
                    </select>
                </div>
                <div className="table-wrap">
                    <table className="w-full min-w-[950px] border-collapse">
                        <thead><tr className="border-b"><th className="px-3 py-3 text-center">ลำดับ</th><th className="px-3 py-3 text-left">วันที่</th><th className="px-3 py-3 text-left">เวลา</th><th className="px-3 py-3 text-left">หัวข้อ</th><th className="px-3 py-3 text-center">รายละเอียด</th><th className="px-3 py-3 text-left">หมายเหตุ</th><th className="px-3 py-3 text-center">จัดการ</th></tr></thead>
                        <tbody>
                            {items.map((activity, index) => (
                                <tr key={activity.id} className="border-b">
                                    <td className="px-3 py-3 text-center">{((meta?.current_page ?? 1) - 1) * perPage + index + 1}</td>
                                    <td className="whitespace-nowrap px-3 py-3">{thaiDate(activity.activity_date)}</td>
                                    <td className="whitespace-nowrap px-3 py-3">{timeRange(activity)}</td>
                                    <td className="max-w-xs px-3 py-3 font-medium text-slate-800">{activity.title}</td>
                                    <td className="px-3 py-3 text-center">{activity.details.length}</td>
                                    <td className="max-w-xs truncate px-3 py-3 text-slate-500">{activity.note || "ไม่มี"}</td>
                                    <td className="px-3 py-3"><div className="flex items-center justify-center gap-1">
                                        <button onClick={() => setViewingItem(activity)} className="rounded-lg px-2 py-1 text-primary-700 hover:bg-primary-50" title="ดู">ดู</button>
                                        <button onClick={() => setEditingItem(activity)} className="icon-button text-amber-500 hover:bg-amber-50" title="แก้ไข" aria-label="แก้ไข"><Icons.Edit /></button>
                                        <button onClick={() => void deleteActivity(activity)} className="icon-button text-red-600 hover:bg-red-50" title="ลบ" aria-label="ลบ"><Icons.TrashAlt /></button>
                                    </div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!loading && items.length === 0 && <div className="p-10 text-center text-slate-500">ไม่พบข้อมูลกิจกรรม</div>}
                </div>
                {meta && meta.last_page > 1 && <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-slate-500">ทั้งหมด {meta.total} รายการ</div>
                    <div className="flex flex-wrap gap-2">
                        <button disabled={meta.current_page === 1} onClick={() => setPage(meta.current_page - 1)} className="icon-button border border-slate-200 disabled:opacity-40" aria-label="หน้าก่อนหน้า"><Icons.ChevronLeft /></button>
                        {Array.from({ length: meta.last_page }, (_, i) => i + 1).map((number) => <button key={number} onClick={() => setPage(number)} className={`h-9 min-w-9 rounded-xl border px-2 ${number === meta.current_page ? "border-primary-600 bg-primary-600 text-white" : "border-slate-200"}`}>{number}</button>)}
                        <button disabled={meta.current_page === meta.last_page} onClick={() => setPage(meta.current_page + 1)} className="icon-button border border-slate-200 disabled:opacity-40" aria-label="หน้าถัดไป"><Icons.ChevronRight /></button>
                    </div>
                </div>}
            </div>
            {showCreate && <ActivityModal onClose={() => setShowCreate(false)} onSuccess={() => void loadData()} />}
            {editingItem && <ActivityModal initialData={editingItem} onClose={() => setEditingItem(null)} onSuccess={() => void loadData()} />}
            {viewingItem && <ActivityModal initialData={viewingItem} readOnly onClose={() => setViewingItem(null)} />}
        </AdminLayout>
    );
}
