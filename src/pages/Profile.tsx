import { useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../layouts/Layout";
import api from "../services/api";

export type ProfileUser = { id: number; username?: string | null; name: string; email: string };
type Props = { user: ProfileUser; onLogout: () => void; onUpdated: (user: ProfileUser) => void };

export default function Profile({ user, onLogout, onUpdated }: Props) {
    const [username, setUsername] = useState(user.username || "");
    const [name, setName] = useState(user.name);
    const [email, setEmail] = useState(user.email);
    const [currentPassword, setCurrentPassword] = useState("");
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const save = async (event: React.FormEvent) => {
        event.preventDefault(); setBusy(true); setError(""); setMessage("");
        try {
            const { data } = await api.put<ProfileUser>("/api/profile", { username, name, email, current_password: currentPassword });
            onUpdated(data); setCurrentPassword(""); setMessage("บันทึกข้อมูลโปรไฟล์แล้ว");
        } catch (err: unknown) {
            const response = err && typeof err === "object" && "response" in err ? (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response : undefined;
            setError(response?.data?.errors ? Object.values(response.data.errors).flat().join(" ") : response?.data?.message || "บันทึกข้อมูลไม่สำเร็จ");
        } finally { setBusy(false); }
    };

    return <AdminLayout user={user} onLogout={onLogout}>
        <div className="mx-auto max-w-3xl space-y-6">
            <div className="page-surface page-pad flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-2xl font-bold text-white">{user.username?.[0]?.toUpperCase() || user.name[0]?.toUpperCase()}</div>
                <div><p className="text-sm font-semibold text-primary-700">บัญชีของฉัน</p><h1 className="text-2xl font-bold text-slate-900">{user.username || user.name}</h1><p className="text-sm text-slate-500">{user.name}</p></div>
            </div>
            <nav aria-label="การตั้งค่าบัญชี" className="flex flex-wrap gap-2"><Link to="/profile" className="rounded-xl bg-primary-600 px-4 py-2 font-semibold text-white">ข้อมูลโปรไฟล์</Link><Link to="/profile/security" className="rounded-xl bg-white px-4 py-2 font-semibold text-primary-700 hover:bg-primary-50">ความปลอดภัยบัญชี</Link></nav>
            <section className="page-surface page-pad"><h2 className="text-xl font-bold text-slate-900">ข้อมูลโปรไฟล์</h2><p className="mt-1 text-sm text-slate-500">ใช้รหัสผ่านปัจจุบันเมื่อเปลี่ยนชื่อผู้ใช้</p>
                {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}
                {message && <p role="status" className="mt-4 rounded-xl bg-green-50 p-3 text-green-700">{message}</p>}
                <form onSubmit={save} className="mt-5 grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-semibold text-slate-700">ชื่อผู้ใช้<input className="mt-2 w-full" value={username} onChange={e => setUsername(e.target.value)} minLength={3} maxLength={64} pattern="[A-Za-z0-9][A-Za-z0-9._-]*" required /></label>
                    <label className="text-sm font-semibold text-slate-700">ชื่อ-นามสกุล<input className="mt-2 w-full" value={name} onChange={e => setName(e.target.value)} required /></label>
                    <label className="text-sm font-semibold text-slate-700">อีเมล<input className="mt-2 w-full" type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
                    <label className="text-sm font-semibold text-slate-700">รหัสผ่านปัจจุบัน (เมื่อเปลี่ยนชื่อผู้ใช้)<input className="mt-2 w-full" type="password" autoComplete="current-password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required={username.trim().toLowerCase() !== user.username} /></label>
                    <div className="sm:col-span-2"><button className="btn-primary" disabled={busy}>{busy ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}</button></div>
                </form>
            </section>
        </div>
    </AdminLayout>;
}
