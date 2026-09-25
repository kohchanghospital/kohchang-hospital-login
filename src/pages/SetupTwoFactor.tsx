import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

type User = { id: number; name: string; email: string };
type Props = { onVerified: (user: User) => void };
type Setup = { secret: string; otpauth_uri: string };

export default function SetupTwoFactor({ onVerified }: Props) {
    const navigate = useNavigate();
    const [setup, setSetup] = useState<Setup | null>(null);
    const [code, setCode] = useState("");
    const [codes, setCodes] = useState<string[]>([]);
    const [verifiedUser, setVerifiedUser] = useState<User | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;
        void api.get("/two-factor/challenge").then(async ({ data }) => {
            if (data.next !== "/2fa/setup") { navigate(data.next || "/login", { replace: true }); return; }
            const result = await api.post<Setup>("/two-factor/setup");
            if (active) setSetup(result.data);
        }).catch(() => { if (active) navigate("/login", { replace: true }); });
        return () => { active = false; };
    }, [navigate]);

    const confirm = async (event: React.FormEvent) => {
        event.preventDefault();
        if (busy || code.length !== 6) return;
        setBusy(true); setError("");
        try {
            const { data } = await api.post("/two-factor/confirm", { code });
            setCodes(data.recovery_codes);
            setVerifiedUser(data.user);
            setSetup(null);
            setCode("");
        } catch (err: unknown) {
            const response = err && typeof err === "object" && "response" in err
                ? (err as { response?: { status?: number; data?: { message?: string } } }).response : undefined;
            setError(response?.data?.message || "Invalid or expired verification code.");
            setCode("");
            if (response?.status === 419) navigate("/login", { replace: true });
        } finally { setBusy(false); }
    };

    return <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-lift sm:p-10">
            <span className="rounded-full bg-primary-50 px-3 py-1 text-sm font-semibold text-primary-800">Security step 2 of 2</span>
            <h1 className="mt-5 text-2xl font-bold text-slate-900">Set up Authenticator App</h1>
            {codes.length ? <>
                <p className="mt-3 text-sm text-slate-600">2FA is enabled. Save these single-use recovery codes now. They cannot be viewed again.</p>
                <div className="mt-5 grid grid-cols-2 gap-2 font-mono text-sm sm:grid-cols-4">{codes.map(item => <code key={item} className="rounded-lg bg-slate-100 p-2 text-center">{item}</code>)}</div>
                <button type="button" className="btn-muted mt-5" onClick={() => void navigator.clipboard.writeText(codes.join("\n"))}>Copy codes</button>
                <button type="button" className="btn-primary mt-5 w-full" onClick={() => verifiedUser && onVerified(verifiedUser)}>Continue to dashboard</button>
            </> : setup ? <>
                <p className="mt-3 text-sm text-slate-600">Scan the QR code with Google Authenticator, Microsoft Authenticator, Authy, or another compatible app.</p>
                <div className="mt-5 w-fit rounded-2xl border border-slate-200 bg-white p-4"><QRCodeSVG value={setup.otpauth_uri} size={192} marginSize={1} /></div>
                <p className="mt-4 text-sm text-slate-600">Cannot scan? Enter this key manually:</p>
                <code className="mt-2 block break-all rounded-lg bg-slate-100 p-2 font-mono text-slate-900">{setup.secret}</code>
                {error && <div role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
                <form onSubmit={confirm} className="mt-5 space-y-4">
                    <label className="block text-sm font-semibold text-slate-700">Authenticator code<input autoFocus type="text" inputMode="numeric" autoComplete="one-time-code" className="mt-2 w-full" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ""))} /></label>
                    <button type="submit" className="btn-primary w-full" disabled={busy || code.length !== 6}>{busy ? "Verifying..." : "Verify and enable 2FA"}</button>
                </form>
            </> : <p className="mt-5 text-sm text-slate-600">Preparing Authenticator setup...</p>}
            {!codes.length && <Link to="/login" className="mt-5 block text-center text-sm text-slate-500 hover:underline">Back to login</Link>}
        </div>
    </div>;
}