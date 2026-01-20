import { Link, useLocation } from "react-router-dom";

const routeNameMap: Record<string, string> = {
    dashboard: "Dashboard",
    news: "ข่าวสาร",
    upload: "อัปโหลด",
    announcements: "ประกาศ",
    calendar: "ปฏิทินกิจกรรม",
    cars: "แผนการใช้รถ",
    settings: "ตั้งค่า",
};

export default function Breadcrumb() {
    const location = useLocation();
    const paths = location.pathname
        .split("/")
        .filter(Boolean);

    return (
        <nav className="text-base text-gray-500 mb-4">
            <ol className="flex items-center space-x-2">
                <li>
                    <Link
                        to="/dashboard"
                        className="hover:text-primary-600 transition"
                    >
                        Home
                    </Link>
                </li>

                {paths.map((path, index) => {
                    const to = "/" + paths.slice(0, index + 1).join("/");
                    const isLast = index === paths.length - 1;
                    const label =
                        routeNameMap[path] ||
                        decodeURIComponent(path);

                    return (
                        <li
                            key={to}
                            className="flex items-center space-x-2"
                        >
                            <span>/</span>

                            {isLast ? (
                                <span className="text-gray-700 font-medium">
                                    {label}
                                </span>
                            ) : (
                                <Link
                                    to={to}
                                    className="hover:text-primary-600 transition"
                                >
                                    {label}
                                </Link>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}
