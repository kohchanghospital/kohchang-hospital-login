import { NavLink } from "react-router-dom";
import {
    FaBell,
    FaBookOpen,
    FaBullseye,
    FaCalendarAlt,
    FaCarSide,
    FaCog,
    FaHandHoldingHeart,
    FaHeartbeat,
    FaHome,
    FaHospital,
    FaScroll,
    FaTimes,
    FaUserTie,
} from "react-icons/fa";

const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: FaHome },
    { path: "/activity", label: "ปฏิทินกิจกรรม", icon: FaCalendarAlt },
    { path: "/announcements", label: "ประกาศ", icon: FaBell },
    { path: "/knowledges", label: "สาระความรู้", icon: FaBookOpen },
    { path: "/car", label: "แผนการใช้รถ", icon: FaCarSide },
    { path: "/history", label: "ประวัติ", icon: FaScroll },
    { path: "/management", label: "คณะผู้บริหาร", icon: FaUserTie },
    { path: "/vision", label: "วิสัยทัศน์ พันธกิจ", icon: FaBullseye },
    { path: "/donation", label: "สมทบทุน", icon: FaHandHoldingHeart },
    { path: "/organ", label: "บริจาคอวัยวะ", icon: FaHeartbeat },
    { path: "/settings", label: "ตั้งค่า", icon: FaCog },
];

type Props = {
    open?: boolean;
    onClose?: () => void;
};

export default function Sidebar({ open = false, onClose }: Props) {
    return (
        <>
            <button
                type="button"
                aria-label="ปิดเมนู"
                onClick={onClose}
                className={`fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
            />

            <aside
                className={`fixed left-0 top-0 z-40 flex h-screen w-72 flex-col border-r border-white/10 bg-slate-950 text-white shadow-lift transition-transform duration-300 ease-out lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}
            >
                <div className="relative overflow-hidden border-b border-white/10 p-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-500 text-white shadow-lg shadow-primary-950/30">
                            <FaHospital />
                        </div>
                        <div>
                            <div className="text-lg font-bold leading-tight">
                                Kohchang Hospital
                            </div>
                            <div className="text-xs font-medium text-primary-100">
                                Admin Control Center
                            </div>
                        </div>
                        <button
                            type="button"
                            aria-label="ปิดเมนู"
                            onClick={onClose}
                            className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-300 transition hover:bg-white/10 hover:text-white lg:hidden"
                        >
                            <FaTimes />
                        </button>
                    </div>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto p-4">
                    {menuItems.map((item) => {
                        const Icon = item.icon;

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                onClick={onClose}
                                className={({ isActive }) =>
                                    `group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition duration-200 ${isActive
                                        ? "bg-primary-500 text-white shadow-lg shadow-primary-950/30"
                                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                                    }`
                                }
                            >
                                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-base transition group-hover:bg-white/15">
                                    <Icon />
                                </span>
                                <span className="truncate">{item.label}</span>
                            </NavLink>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
}
