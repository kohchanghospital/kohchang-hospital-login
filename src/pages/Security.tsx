import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import AdminLayout from "../layouts/Layout";
import api from "../services/api";
import { Link, useNavigate } from "react-router-dom";

type Props = { user: { id: number; name: string; email: string }; onLogout: () => void };
type Status = { enabled: boolean; confirmed_at: string | null; recovery_codes_remaining: number };
type Setup = { secret: string; otpauth_uri: string; reconfigure: boolean };

export default function Security({ user, onLogout }: Props) {
    const navigate = useNavigate();
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [passwordBusy, setPasswordBusy] = useState(false);
    const [passwordError, setPasswordError] = useState("");
    const [status, setStatus] = useState<Status | null>(null);
    const [setup, setSetup] = useState<Setup | null>(null);
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");
    const [codes, setCodes] = useState<string[]>([]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const refresh = async () => setStatus((await api.get<Status>("/api/security/two-factor")).data);
    useEffect(() => { void refresh().catch(() => setError("Unable to load security settings.")); }, []);

    const run = async (action: () => Promise<void>) => {
        if (busy) return;
        setBusy(true); setError(""); setNotice("");
        try { await action(); await refresh(); }
        catch (err: unknown) {
            const response = err && typeof err === "object" && "response" in err
                ? (err as { response?: { data?: { message?: string } } }).response : undefined;
            setError(response?.data?.message || "The request failed. Please try again.");
        } finally { setBusy(false); }
    };

    const start = (reconfigure: boolean) => void run(async () => {
        const { data } = await api.post(`/api/security/two-factor/${reconfigure ? "reconfigure" : "setup"}`, { password });
        setSetup({ ...data, reconfigure }); setCodes([]); setCode(""); setPassword("");
    });
    const confirm = () => void run(async () => {
        if (!setup) return;
        const { data } = await api.post(`/api/security/two-factor/${setup.reconfigure ? "reconfigure/confirm" : "confirm"}`, { code, ...(setup.reconfigure ? { password } : {}) });
        setCodes(data.recovery_codes); setSetup(null); setCode(""); setPassword("");
        setNotice("Authenticator 2FA is enabled. Save your recovery codes now; they will not be shown again.");
    });
    const regenerate = () => void run(async () => {
        const { data } = await api.post("/api/security/two-factor/recovery-codes", { password });
        setCodes(data.recovery_codes); setPassword("");
        setNotice("New recovery codes generated. Your old codes no longer work.");
    });
    const disable = () => void run(async () => {
        await api.post("/api/security/two-factor/disable", { password });
        setPassword(""); setCodes([]); setSetup(null);
        window.location.assign("/2fa/setup");
    });

    const changePassword = async (event: React.FormEvent) => {
        event.preventDefault(); setPasswordBusy(true); setPasswordError("");
        try {
            await api.put("/api/profile/password", { current_password: oldPassword, password: newPassword, password_confirmation: confirmation });
            onLogout(); navigate("/login", { replace: true });
        } catch (err: unknown) {
            const response = err && typeof err === "object" && "response" in err ? (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response : undefined;
            setPasswordError(response?.data?.errors ? Object.values(response.data.errors).flat().join(" ") : response?.data?.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ");
        } finally { setPasswordBusy(false); }
    };

    return <AdminLayout user={user} onLogout={onLogout}>
        <div className="mx-auto max-w-3xl space-y-6">
            <div><p className="text-sm font-semibold text-primary-700">บัญชีของฉัน</p><h1 className="mt-1 text-2xl font-bold text-slate-900">ความปลอดภัยบัญชี</h1><p className="mt-2 text-sm text-slate-600">จัดการรหัสผ่านและ Authenticator App</p></div>
            <nav aria-label="การตั้งค่าบัญชี" className="flex flex-wrap gap-2"><Link to="/profile" className="rounded-xl bg-white px-4 py-2 font-semibold text-primary-700 hover:bg-primary-50">ข้อมูลโปรไฟล์</Link><Link to="/profile/security" className="rounded-xl bg-primary-600 px-4 py-2 font-semibold text-white">ความปลอดภัยบัญชี</Link></nav>
            <section className="page-surface page-pad"><h2 className="text-lg font-bold text-slate-900">เปลี่ยนรหัสผ่าน</h2><p className="mt-1 text-sm text-slate-500">รหัสผ่านใหม่ต้องมีอย่างน้อย 12 ตัวอักษร ทั้งตัวพิมพ์เล็ก พิมพ์ใหญ่ ตัวเลข และสัญลักษณ์</p>{passwordError && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-red-700">{passwordError}</p>}<form onSubmit={changePassword} className="mt-4 grid gap-4 sm:grid-cols-2"><label className="text-sm font-semibold text-slate-700">รหัสผ่านปัจจุบัน<input className="mt-2 w-full" type="password" autoComplete="current-password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} required /></label><div className="hidden sm:block" /><label className="text-sm font-semibold text-slate-700">รหัสผ่านใหม่<input className="mt-2 w-full" type="password" autoComplete="new-password" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={12} required /></label><label className="text-sm font-semibold text-slate-700">ยืนยันรหัสผ่านใหม่<input className="mt-2 w-full" type="password" autoComplete="new-password" value={confirmation} onChange={e => setConfirmation(e.target.value)} required /></label><div className="sm:col-span-2"><button className="btn-primary" disabled={passwordBusy}>{passwordBusy ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}</button></div></form></section>
            {error && <div role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</div>}
            {notice && <div role="status" className="rounded-2xl bg-green-50 p-4 text-sm text-green-800">{notice}</div>}
            <section className="page-surface page-pad space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-bold text-slate-900">Two-Factor Authentication · Authenticator App</h2><span className={`rounded-full px-3 py-1 text-xs font-bold ${status?.enabled ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"}`}>{status?.enabled ? "เปิดใช้งานแล้ว" : "ยังไม่ได้เปิดใช้งาน"}</span></div>
                {setup ? <>
                    <p className="text-sm text-slate-600">Scan this QR code, then enter the six-digit code shown by your app. Setup expires after 10 minutes.</p>
                    <div className="w-fit rounded-2xl border border-slate-200 bg-white p-4"><QRCodeSVG value={setup.otpauth_uri} size={192} marginSize={1} /></div>
                    <p className="text-sm text-slate-600">Cannot scan? Enter this key manually: <code className="block break-all rounded-lg bg-slate-100 p-2 font-mono text-slate-900">{setup.secret}</code></p>
                    <label className="block text-sm font-semibold text-slate-700">Authenticator code<input autoFocus className="mt-2 w-full" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ""))} /></label>
                    {setup.reconfigure && <label className="block text-sm font-semibold text-slate-700">Confirm password<input className="mt-2 w-full" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></label>}
                    <button className="btn-primary" disabled={busy || code.length !== 6 || (setup.reconfigure && !password)} onClick={confirm}>{busy ? "Verifying..." : "Verify and enable"}</button>
                </> : <>
                    {status?.enabled && <p className="text-sm text-slate-600">{status.recovery_codes_remaining} unused recovery codes remain. Keep them somewhere safe.</p>}
                    <label className="block text-sm font-semibold text-slate-700">Confirm your password to {status?.enabled ? "change security settings" : "begin setup"}<input className="mt-2 w-full" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} /></label>
                    <div className="flex flex-wrap gap-2">{status?.enabled ? <>
                        <button className="btn-primary" disabled={busy || !password} onClick={() => start(true)}>Change Authenticator App</button>
                        <button className="btn-muted" disabled={busy || !password} onClick={regenerate}>Regenerate recovery codes</button>
                        <button className="btn-muted" disabled={busy || !password} onClick={disable}>Disable 2FA</button>
                    </> : <button className="btn-primary" disabled={busy || !password} onClick={() => start(false)}>Enable two-factor authentication</button>}</div>
                </>}
            </section>
            {codes.length > 0 && <section className="page-surface page-pad"><h2 className="text-lg font-bold text-slate-900">Recovery codes</h2><p className="mt-2 text-sm text-slate-600">Each code works once. Save these now; they cannot be viewed later.</p><div className="mt-4 grid grid-cols-2 gap-2 font-mono text-sm sm:grid-cols-4">{codes.map(item => <code key={item} className="rounded-lg bg-slate-100 p-2 text-center">{item}</code>)}</div><button className="btn-muted mt-4" onClick={() => navigator.clipboard.writeText(codes.join("\n"))}>Copy codes</button></section>}
        </div>
    </AdminLayout>;
}
