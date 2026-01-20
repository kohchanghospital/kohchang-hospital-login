import Card from "../components/Card";
import AdminLayout from "../layouts/Layout";

type User = {
    id: number;
    name: string;
    email: string;
};

type Props = {
    user: User;
    onLogout: () => void;
};

export default function Dashboard({ user, onLogout }: Props) {
    return (
        <AdminLayout user={user} onLogout={onLogout}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card title="ผู้ใช้งานทั้งหมด" value="128" />
                <Card title="ข่าวสารวันนี้" value="5" />
                <Card title="กิจกรรมวันนี้" value="3" />
            </div>
        </AdminLayout>
    );
}
