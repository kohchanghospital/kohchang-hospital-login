import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import AdminLayout from "../layouts/Layout";
import { Icons } from "../icons/Icons";
import api from "../services/api";
import CarModal, { type VehicleScheduleRecord } from "../components/CarModal";
import { TablePageSkeleton } from "../components/SkeletonScreens";

type User = { id: number; name: string; email: string };
type Meta = { current_page: number; last_page: number; total: number };
type Props = { user: User; onLogout: () => void };

const thaiDate = (date: string) => {
    const [year, month, day] = date.slice(0, 10).split("-").map(Number);
    return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric" }).format(new Date(year, month - 1, day));
};
const timeRange = (item: VehicleScheduleRecord) => {
    const start = item.start_time?.slice(0, 5); const end = item.end_time?.slice(0, 5);
    return start && end ? `${start} - ${end}` : start ?? end ?? "ตลอดวัน";
};

export default function Car({ user, onLogout }: Props) {
    const [showCreate, setShowCreate] = useState(false);
    const [editing, setEditing] = useState<VehicleScheduleRecord | null>(null);
    const [viewing, setViewing] = useState<VehicleScheduleRecord | null>(null);
    const [items, setItems] = useState<VehicleScheduleRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [keyword, setKeyword] = useState("");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [meta, setMeta] = useState<Meta | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const response = await api.get("/api/vehicle-schedules", { params: { page, per_page: perPage, q: keyword || undefined } });
            setItems(response.data.data);
            setMeta({ current_page: response.data.current_page, last_page: response.data.last_page, total: response.data.total });
        } catch { toast.error("โหลดข้อมูลแผนการใช้รถยนต์ไม่สำเร็จ"); }
        finally { setLoading(false); }
    }, [keyword, page, perPage]);

    useEffect(() => { void loadData(); }, [loadData]);

    const remove = async (item: VehicleScheduleRecord) => {
        if (!window.confirm("ยืนยันการลบรายการใช้รถนี้หรือไม่?")) return;
        const toastId = toast.loading("กำลังลบรายการ...");
        try {
            await api.delete(`/api/vehicle-schedules/${item.id}`);
            toast.success("ลบรายการใช้รถเรียบร้อย", { id: toastId });
            if (items.length === 1 && page > 1) setPage((current) => current - 1); else await loadData();
        } catch { toast.error("ลบรายการใช้รถไม่สำเร็จ", { id: toastId }); }
    };

    if (loading && items.length === 0) return <AdminLayout user={user} onLogout={onLogout}><TablePageSkeleton columns={8} filters={1} /></AdminLayout>;

    return (
        <AdminLayout user={user} onLogout={onLogout}>
            <div className="page-surface page-pad">
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-bold text-slate-900">แผนการใช้รถยนต์</h2><p className="mt-1 text-sm text-slate-500">จัดการตารางรถและพนักงานขับรถที่แสดงบนเว็บไซต์</p></div><button onClick={() => setShowCreate(true)} className="btn-primary">+ เพิ่มแผนการใช้รถยนต์</button></div>
                <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><input type="search" placeholder="ค้นหาหัวข้อ..." className="w-full sm:w-72" value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(1); }} /><select className="w-full sm:w-48" value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}>{[10, 20, 50, 100].map((size) => <option key={size} value={size}>แสดง {size} รายการ</option>)}</select></div>
                <div className="table-wrap">
                    <table className="w-full min-w-[1100px] border-collapse"><thead><tr className="border-b"><th className="px-3 py-3 text-center">ลำดับ</th><th className="px-3 py-3 text-left">วันที่</th><th className="px-3 py-3 text-left">เวลา</th><th className="px-3 py-3 text-left">หัวข้อ</th><th className="px-3 py-3 text-left">พนักงานขับรถ</th><th className="px-3 py-3 text-left">ทะเบียนรถ</th><th className="px-3 py-3 text-center">รายละเอียด</th><th className="px-3 py-3 text-center">จัดการ</th></tr></thead>
                        <tbody>{items.map((item, index) => <tr key={item.id} className="border-b"><td className="px-3 py-3 text-center">{((meta?.current_page ?? 1) - 1) * perPage + index + 1}</td><td className="whitespace-nowrap px-3 py-3">{thaiDate(item.schedule_date)}</td><td className="whitespace-nowrap px-3 py-3">{timeRange(item)}</td><td className="max-w-xs px-3 py-3 font-medium">{item.title}</td><td className="px-3 py-3">{item.driver.name}</td><td className="whitespace-nowrap px-3 py-3">{item.vehicle.registration_number}</td><td className="px-3 py-3 text-center">{item.details.length}</td><td className="px-3 py-3"><div className="flex items-center justify-center gap-1"><button onClick={() => setViewing(item)} className="rounded-lg px-2 py-1 text-primary-700 hover:bg-primary-50">ดู</button><button onClick={() => setEditing(item)} className="icon-button text-amber-500 hover:bg-amber-50" aria-label="แก้ไข"><Icons.Edit /></button><button onClick={() => void remove(item)} className="icon-button text-red-600 hover:bg-red-50" aria-label="ลบ"><Icons.TrashAlt /></button></div></td></tr>)}</tbody>
                    </table>
                    {!loading && items.length === 0 && <div className="p-10 text-center text-slate-500">ไม่พบข้อมูลแผนการใช้รถยนต์</div>}
                </div>
                {meta && meta.last_page > 1 && <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="text-sm text-slate-500">ทั้งหมด {meta.total} รายการ</div><div className="flex gap-2"><button disabled={meta.current_page === 1} onClick={() => setPage(meta.current_page - 1)} className="icon-button border disabled:opacity-40"><Icons.ChevronLeft /></button>{Array.from({ length: meta.last_page }, (_, i) => i + 1).map((number) => <button key={number} onClick={() => setPage(number)} className={`h-9 min-w-9 rounded-xl border px-2 ${number === meta.current_page ? "border-primary-600 bg-primary-600 text-white" : "border-slate-200"}`}>{number}</button>)}<button disabled={meta.current_page === meta.last_page} onClick={() => setPage(meta.current_page + 1)} className="icon-button border disabled:opacity-40"><Icons.ChevronRight /></button></div></div>}
            </div>
            {showCreate && <CarModal onClose={() => setShowCreate(false)} onSuccess={() => void loadData()} />}
            {editing && <CarModal initialData={editing} onClose={() => setEditing(null)} onSuccess={() => void loadData()} />}
            {viewing && <CarModal initialData={viewing} readOnly onClose={() => setViewing(null)} />}
        </AdminLayout>
    );
}
