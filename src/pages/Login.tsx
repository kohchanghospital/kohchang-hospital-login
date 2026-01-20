import { useState } from "react";
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

            onLoginSuccess(); // 👉 แจ้ง App.tsx ให้เปลี่ยนหน้า
        } catch (err: any) {
            setError(
                err.response?.data?.message ||
                "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
                <h1 className="text-3xl font-bold text-center text-primary-700 mb-2">
                    Kohchang Hospital
                </h1>
                <h2 className="text-center text-gray-600 mb-6">
                    เข้าสู่ระบบ
                </h2>

                {error && (
                    <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm mb-1 text-gray-700">
                            อีเมล
                        </label>
                        <input
                            type="email"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm mb-1 text-gray-700">
                            รหัสผ่าน
                        </label>
                        <input
                            type="password"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
                    >
                        {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
                    </button>
                </form>

                <div className="text-center text-sm text-gray-400 mt-6">
                    © Kohchang Hospital
                </div>
            </div>
        </div>
    );
}
