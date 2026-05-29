import { useState, type ReactNode } from "react";
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
    children: ReactNode;
};

export default function AdminLayout({
    user,
    onLogout,
    children,
}: Props) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen">
            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className="min-h-screen p-4 transition-all duration-300 ease-out lg:ml-72 lg:p-8">
                <Topbar
                    user={user}
                    onLogout={onLogout}
                    onMenuClick={() => setSidebarOpen(true)}
                />

                <div className="animate-fade-up">
                    {children}
                </div>
            </main>
        </div>
    );
}
