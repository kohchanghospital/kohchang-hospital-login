import { useState } from "react";
import { FaHospital, FaLock, FaUserShield } from "react-icons/fa";
import api from "../services/api";

type Props = {
    onLoginSuccess: () => void;
};

export default function Login({ onLoginSuccess }: Props) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await api.get("/sanctum/csrf-cookie");
            await api.post("/login", { email, password });

            localStorage.setItem("isLoggedIn", "true");

            onLoginSuccess();
        } catch (err: unknown) {
            const message = err && typeof err === "object" && "response" in err
                ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                : undefined;

            setError(
                message ||
                "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center px-4 py-10">
            <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 shadow-lift backdrop-blur lg:grid-cols-[1.05fr_0.95fr]">
                <div className="hidden min-h-[34rem] flex-col justify-between bg-slate-950 p-10 text-white lg:flex">
                    <div>
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500 shadow-lg shadow-primary-950/40">
                            <FaHospital className="text-2xl" />
                        </div>
                        <h1 className="mt-8 text-4xl font-bold leading-tight">
                            Kohchang Hospital
                        </h1>
                        <p className="mt-4 max-w-sm text-sm leading-7 text-slate-300">
                            ระบบจัดการข้อมูลเว็บไซต์โรงพยาบาลสำหรับทีมงานภายใน ออกแบบให้ใช้ง่าย ชัดเจน และพร้อมทำงานทุกหน้าจอ
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-2xl bg-white/10 p-4">
                            <div className="text-2xl font-bold text-primary-200">24/7</div>
                            <div className="mt-1 text-slate-300">พร้อมใช้งาน</div>
                        </div>
                        <div className="rounded-2xl bg-white/10 p-4">
                            <div className="text-2xl font-bold text-accent-100">Secure</div>
                            <div className="mt-1 text-slate-300">สำหรับผู้ดูแล</div>
                        </div>
                    </div>
                </div>

                <div className="p-6 sm:p-10">
                    <div className="mb-8 lg:hidden">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-600 text-white">
                            <FaHospital />
                        </div>
                        <h1 className="mt-4 text-2xl font-bold text-slate-900">
                            Kohchang Hospital
                        </h1>
                    </div>

                    <div className="mb-8">
                        <div className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1 text-sm font-semibold text-primary-800">
                            <FaUserShield />
                            Admin Login
                        </div>
                        <h2 className="mt-4 text-3xl font-bold text-slate-900">
                            เข้าสู่ระบบ
                        </h2>
                        <p className="mt-2 text-sm text-slate-500">
                            กรุณาใช้อีเมลและรหัสผ่านของผู้ดูแลระบบ
                        </p>
                    </div>

                    {error && (
                        <div className="mb-4 rounded-2xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                อีเมล
                            </label>
                            <input
                                type="email"
                                className="w-full"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                รหัสผ่าน
                            </label>
                            <input
                                type="password"
                                className="w-full"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full"
                        >
                            <FaLock />
                            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm text-slate-400">
                        © Kohchang Hospital
                    </div>
                </div>
            </div>
        </div>
    );
}
