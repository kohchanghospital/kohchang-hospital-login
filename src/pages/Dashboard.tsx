import { useEffect, useState } from "react";
import { FaCalendarDay, FaCircle, FaUsers } from "react-icons/fa";
import AdminLayout from "../layouts/Layout";
import api from "../services/api";

type User = { id: number; name: string; email: string; username?: string | null };
type Props = { user: User; onLogout: () => void };
type Summary = {
    total_visitors: number;
    online_visitors: number;
    today_visitors: number;
    tracking_started_at: string | null;
    as_of: string;
};

const number = new Intl.NumberFormat("th-TH");

export default function Dashboard({ user, onLogout }: Props) {
    const [summary, setSummary] = useState<Summary | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let active = true;
        const refresh = async () => {
            try {
                const { data } = await api.get<Summary>("/api/admin/analytics/summary", { headers: { "Cache-Control": "no-cache" } });
                if (active) { setSummary(data); setError(false); }
            } catch {
                if (active) { setSummary(null); setError(true); }
            } finally { if (active) setLoading(false); }
        };
        void refresh();
        const interval = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 45_000);
        const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
        document.addEventListener("visibilitychange", onVisible);
        return () => { active = false; window.clearInterval(interval); document.removeEventListener("visibilitychange", onVisible); };
    }, []);

    const cards = [
        { title: "ผู้เข้าชมทั้งหมด", value: summary?.total_visitors, description: "ผู้เข้าชมสะสม", icon: FaUsers },
        { title: "ออนไลน์ขณะนี้", value: summary?.online_visitors, description: "ใช้งานภายใน 5 นาทีล่าสุด", icon: FaCircle },
        { title: "ผู้เข้าชมวันนี้", value: summary?.today_visitors, description: "ตามเวลาไทย", icon: FaCalendarDay },
    ];

    return <AdminLayout user={user} onLogout={onLogout}>
        <div className="mb-6 rounded-3xl bg-slate-950 p-6 text-white shadow-lift sm:p-8">
            <div className="max-w-2xl">
                <div className="text-sm font-semibold uppercase tracking-wide text-primary-200">Kohchang Hospital</div>
                <h1 className="mt-3 text-2xl font-bold sm:text-4xl">ยินดีต้อนรับ, {user.name}</h1>
                <p className="mt-3 text-sm leading-7 text-slate-300">ภาพรวมการเข้าชมเว็บไซต์โรงพยาบาล</p>
            </div>
        </div>

        <section aria-labelledby="visitor-statistics-heading" className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-2">
                <div><h2 id="visitor-statistics-heading" className="text-xl font-bold text-slate-900 sm:text-2xl">สถิติผู้เข้าชมเว็บไซต์</h2><p className="mt-1 text-sm text-slate-500">ข้อมูลจากเว็บไซต์สาธารณะ อัปเดตทุก 45 วินาที</p></div>
                {summary?.tracking_started_at && <p className="text-xs text-slate-500">เริ่มเก็บข้อมูล {new Date(summary.tracking_started_at).toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", year: "numeric", month: "short", day: "numeric" })}</p>}
            </div>
            {error && <div role="alert" className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">ไม่สามารถโหลดสถิติผู้เข้าชมได้ กรุณาลองใหม่อีกครั้ง</div>}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
                {cards.map(({ title, value, description, icon: Icon }) => <div key={title} className="page-surface page-pad min-h-44">
                    <div className="flex items-start justify-between gap-3"><h3 className="text-sm font-semibold text-slate-600">{title}</h3><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700"><Icon aria-hidden="true" /></span></div>
                    {loading ? <div className="mt-5 h-10 w-28 animate-pulse rounded-lg bg-slate-100" aria-label="กำลังโหลดสถิติ" /> : <p className="mt-4 text-4xl font-bold tabular-nums text-primary-800">{typeof value === "number" ? number.format(value) : "—"}<span className="ml-2 text-sm font-medium text-slate-500">คน</span></p>}
                    <p className="mt-2 text-sm text-slate-500">{description}</p>
                </div>)}
            </div>
            {!loading && summary?.total_visitors === 0 && <p className="text-sm text-slate-500">ยังไม่มีข้อมูลผู้เข้าชม สถิติจะเริ่มนับเมื่อมีผู้เข้าชมเว็บไซต์สาธารณะ</p>}
        </section>
    </AdminLayout>;
}
