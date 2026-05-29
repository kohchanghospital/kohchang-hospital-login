import { useEffect, useRef, useState } from "react";
import { FaBars, FaChevronDown, FaSignOutAlt, FaUserCircle } from "react-icons/fa";
import Breadcrumb from "./Breadcrumb";

type User = {
    id: number;
    name: string;
    email: string;
};

type Props = {
    user: User;
    onLogout: () => void;
    onMenuClick?: () => void;
};

export default function Topbar({ user, onLogout, onMenuClick }: Props) {
    const [openProfile, setOpenProfile] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

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
        <div className="sticky top-4 z-20 mb-6 flex items-center justify-between gap-3 rounded-3xl border border-white/70 bg-white/85 px-4 py-3 shadow-soft backdrop-blur-xl sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
                <button
                    type="button"
                    onClick={onMenuClick}
                    className="icon-button text-slate-600 lg:hidden"
                    aria-label="เปิดเมนู"
                >
                    <FaBars />
                </button>
                <div className="min-w-0">
                    <Breadcrumb />
                </div>
            </div>

            <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setOpenProfile(!openProfile)}
                    className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-2 py-2 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:px-4"
                >
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-600 font-bold text-white shadow-sm">
                        {user?.name?.charAt(0).toUpperCase() || "U"}
                    </div>

                    <div className="hidden text-left sm:block">
                        <div className="max-w-40 truncate text-sm font-semibold text-slate-800">
                            {user?.name || "ผู้ใช้"}
                        </div>
                        <div className="max-w-44 truncate text-xs text-slate-500">
                            {user?.email || ""}
                        </div>
                    </div>

                    <FaChevronDown
                        className={`h-3 w-3 text-slate-500 transition ${openProfile ? "rotate-180" : ""}`}
                    />
                </button>

                {openProfile && (
                    <div className="absolute right-0 z-50 mt-3 w-56 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-lift animate-fade-up">
                        <button className="flex w-full items-center gap-3 px-4 py-3 text-left text-slate-700 transition hover:bg-slate-50">
                            <FaUserCircle className="text-primary-600" />
                            โปรไฟล์
                        </button>
                        <button
                            onClick={onLogout}
                            className="flex w-full items-center gap-3 border-t border-slate-100 px-4 py-3 text-left text-red-600 transition hover:bg-red-50"
                        >
                            <FaSignOutAlt />
                            ออกจากระบบ
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
