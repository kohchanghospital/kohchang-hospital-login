import { Link, useLocation } from "react-router-dom";

const routeNameMap: Record<string, string> = {
    admin: "Admin",
    dashboard: "Dashboard",
    news: "ข่าวสาร",
    upload: "อัปโหลด",
    announcements: "ประกาศ",
    activity: "กิจกรรม",
    knowledges: "สาระความรู้",
    calendar: "ปฏิทินกิจกรรม",
    cars: "แผนการใช้รถ",
    settings: "ตั้งค่า",
    policies: "นโยบายเว็บไซต์",
    history: "ประวัติ",
    management: "คณะผู้บริหาร",
    vision: "วิสัยทัศน์ พันธกิจ",
    donation: "สมทบทุน",
    organ: "บริจากอวัยวะ",
};

export default function Breadcrumb() {
    const location = useLocation();
    const paths = location.pathname
        .split("/")
        .filter(Boolean);

    return (
        <nav className="text-sm text-slate-500">
            <ol className="flex min-w-0 flex-wrap items-center gap-2">
                <li>
                    <Link
                        to="/dashboard"
                        className="font-semibold text-slate-700 transition hover:text-primary-700"
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
                            className="flex min-w-0 items-center gap-2"
                        >
                            <span className="text-slate-300">/</span>

                            {isLast ? (
                                <span className="truncate font-semibold text-primary-800">
                                    {label}
                                </span>
                            ) : (
                                <Link
                                    to={to}
                                    className="truncate transition hover:text-primary-700"
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
