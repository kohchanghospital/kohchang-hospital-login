import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

type User = { id: number; name: string; email: string };
type Props = { onVerified: (user: User) => void; recovery?: boolean };

export default function VerifyTwoFactor({ onVerified, recovery = false }: Props) {
    const navigate = useNavigate();
    const input = useRef<HTMLInputElement>(null);
    const [code, setCode] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        void api.get("/two-factor/challenge").then(({ data }) => {
            if (data.next !== "/2fa/verify") navigate(data.next || "/login", { replace: true });
            else setReady(true);
        }).catch(() => navigate("/login", { replace: true }));
    }, [navigate]);
    useEffect(() => { if (ready) input.current?.focus(); }, [ready, recovery]);

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (busy || !code || (!recovery && code.length !== 6)) return;
        setBusy(true); setError("");
        try {
            const { data } = await api.post("/two-factor/challenge", { code });
            onVerified(data.user);
        } catch (err: unknown) {
            const response = err && typeof err === "object" && "response" in err
                ? (err as { response?: { status?: number; data?: { message?: string } } }).response : undefined;
            setError(response?.data?.message || "Invalid or expired verification code.");
            setCode("");
            if (response?.status === 419) navigate("/login", { replace: true });
            else input.current?.focus();
        } finally { setBusy(false); }
    };

    if (!ready) return <div className="flex min-h-screen items-center justify-center text-primary-700">Checking security step...</div>;
    return <div className="flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-[2rem] border border-white/70 bg-white/90 p-6 shadow-lift sm:p-10">
            <span className="rounded-full bg-primary-50 px-3 py-1 text-sm font-semibold text-primary-800">Security step 2 of 2</span>
            <h1 className="mt-5 text-2xl font-bold text-slate-900">Two-Factor Authentication</h1>
            <p className="mt-2 text-sm text-slate-600">{recovery ? "Enter one of your single-use recovery codes." : "Enter the 6-digit verification code from your Authenticator App."}</p>
            {error && <div role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}
            <form onSubmit={submit} className="mt-6 space-y-4">
                <label htmlFor="two-factor-code" className="block text-sm font-semibold text-slate-700">{recovery ? "Recovery code" : "Verification code"}</label>
                <input id="two-factor-code" ref={input} type="text" inputMode={recovery ? "text" : "numeric"} autoComplete="one-time-code" maxLength={recovery ? 20 : 6} value={code} disabled={busy} aria-invalid={Boolean(error)}
                    onChange={event => setCode(recovery ? event.target.value.toUpperCase() : event.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full rounded-2xl border-2 border-primary-200 bg-white px-4 py-4 text-center font-mono text-2xl tracking-[0.2em] focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-100" />
                <button className="btn-primary w-full" type="submit" disabled={busy || (recovery ? !code.trim() : code.length !== 6)}>{busy ? "Verifying..." : "Verify"}</button>
            </form>
            <div className="mt-5 flex flex-col gap-3 text-center text-sm">
                <Link className="font-semibold text-primary-700 hover:underline" to={recovery ? "/2fa/verify" : "/2fa/recovery"}>{recovery ? "Use Authenticator code" : "Use a recovery code"}</Link>
                <Link className="text-slate-500 hover:underline" to="/login">Back to login</Link>
            </div>
        </div>
    </div>;
}