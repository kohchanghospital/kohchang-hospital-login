import { useState } from "react";
import { FaLock, FaUserShield } from "react-icons/fa";
import api from "../services/api";

type Props = { onPending: (next: string) => void };

export default function Login({ onPending }: Props) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (loading) return;
        setLoading(true); setError("");
        try {
            await api.get("/sanctum/csrf-cookie");
            const { data } = await api.post("/login", { username: username.trim(), password });
            setPassword("");
            onPending(data.next);
        } catch (err: unknown) {
            const response = err && typeof err === "object" && "response" in err
                ? (err as { response?: { data?: { message?: string } } }).response : undefined;
            setError(response?.data?.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
        } finally { setLoading(false); }
    };

    return <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="grid w-full max-w-xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-lift backdrop-blur lg:grid-cols-[7%_93%]">
            <div className="hidden min-h-[34rem] bg-slate-950 lg:block" />
            <div className="p-6 sm:p-10">
                <h1 className="mt-4 text-2xl font-bold text-slate-900">Kohchang Hospital</h1>
                <div className="mb-8 mt-8">
                    <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-sm font-semibold text-primary-800"><FaUserShield /> Admin Login</div>
                    <h2 className="mt-4 text-3xl font-bold text-slate-900">เข้าสู่ระบบ</h2>
                    <p className="mt-2 text-sm text-slate-500">กรุณาใช้ชื่อผู้ใช้และรหัสผ่านของผู้ดูแลระบบ</p>
                </div>
                {error && <div role="alert" className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
                <form onSubmit={submit} className="space-y-4">
                    <label className="block text-sm font-semibold text-slate-700">ชื่อผู้ใช้<input type="text" autoComplete="username" className="mt-2 w-full" value={username} onChange={e => setUsername(e.target.value)} required /></label>
                    <label className="block text-sm font-semibold text-slate-700">รหัสผ่าน<input type="password" autoComplete="current-password" className="mt-2 w-full" value={password} onChange={e => setPassword(e.target.value)} required /></label>
                    <button type="submit" disabled={loading} className="btn-primary w-full"><FaLock />{loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}</button>
                </form>
                <div className="mt-8 text-center text-sm text-slate-400">© Kohchang Hospital</div>
            </div>
        </div>
    </div>;
}
