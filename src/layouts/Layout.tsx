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
        <div className="min-h-screen bg-gray-50">
            <Sidebar />

            <main className="ml-64 min-h-screen p-8">
                <Topbar user={user} onLogout={onLogout} />

                {children}
            </main>
        </div>
    );
}