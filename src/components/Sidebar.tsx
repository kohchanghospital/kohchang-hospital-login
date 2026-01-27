import { NavLink } from "react-router-dom";

const menuItems = [
    { path: "/dashboard", label: "Dashboard", icon: "🏠" },
    { path: "/calendar", label: "ปฏิทินกิจกรรม", icon: "📅" },
    { path: "/announcements", label: "ประกาศ", icon: "📢" },
    { path: "/cars", label: "แผนการใช้รถ", icon: "🚗" },
    { path: "/settings", label: "ตั้งค่า", icon: "⚙️" },
    { path: "/history", label: "ประวัติ", icon: "📜" },
];

export default function Sidebar() {
    return (
        <aside className="w-64 bg-primary-700 text-white flex flex-col">
            <div className="p-6 text-xl font-bold border-b border-primary-600">
                Kohchang Hospital
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {menuItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            `w-full flex items-center gap-3 px-4 py-2 rounded-lg transition ${isActive
                                ? "bg-primary-600 text-white"
                                : "text-primary-100 hover:bg-primary-600 hover:text-white"
                            }`
                        }
                    >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}
