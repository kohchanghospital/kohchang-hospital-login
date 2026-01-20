import { useEffect, useRef, useState } from "react";
import Breadcrumb from "./Breadcrumb";

type User = {
    id: number;
    name: string;
    email: string;
};

type Props = {
    user: User;
    onLogout: () => void;
};

export default function Topbar({ user, onLogout }: Props) {
    const [openProfile, setOpenProfile] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    // 🔥 ปิด dropdown เมื่อคลิกนอกกรอบ
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setOpenProfile(false);
            }
        };

        if (openProfile) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [openProfile]);

    return (
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">
                <Breadcrumb />
            </h1>

            {/* Profile dropdown */}
            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setOpenProfile(!openProfile)}
                    className="flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow hover:bg-gray-100 transition"
                >
                    <div className="w-9 h-9 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold">
                        {user?.name?.charAt(0).toUpperCase() || "U"}
                    </div>

                    <div className="text-left hidden sm:block">
                        <div className="text-sm font-semibold text-gray-800">
                            {user?.name || "ผู้ใช้"}
                        </div>
                        <div className="text-xs text-gray-500">
                            {user?.email || ""}
                        </div>
                    </div>

                    <svg
                        className={`w-4 h-4 text-gray-600 transition ${openProfile ? "rotate-180" : ""
                            }`}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                    >
                        <path d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {openProfile && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg overflow-hidden z-50">
                        <button className="w-full text-left px-4 py-3 hover:bg-gray-100 transition">
                            👤 โปรไฟล์
                        </button>
                        <button className="w-full text-left px-4 py-3 hover:bg-gray-100 transition">
                            ⚙️ ตั้งค่า
                        </button>
                        <hr />
                        <button
                            onClick={onLogout}
                            className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 transition"
                        >
                            🚪 ออกจากระบบ
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
