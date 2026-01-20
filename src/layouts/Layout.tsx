import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

type User = {
    id: number;
    name: string;
    email: string;
};

type Props = {
    user: User;
    onLogout: () => void;
    children: React.ReactNode;
};

export default function AdminLayout({
    user,
    onLogout,
    children,
}: Props) {
    return (
        <div className="min-h-screen bg-gray-50 flex">
            <Sidebar />

            <main className="flex-1 p-8">
                <Topbar user={user} onLogout={onLogout} />

                {/* 🔥 เนื้อหาแต่ละหน้า */}
                {children}
            </main>
        </div>
    );
}
