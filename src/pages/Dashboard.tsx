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
            <div className="mb-6 rounded-3xl bg-slate-950 p-6 text-white shadow-lift sm:p-8">
                <div className="max-w-2xl">
                    <div className="text-sm font-semibold uppercase tracking-wide text-primary-200">
                        Kohchang Hospital
                    </div>
                    <h1 className="mt-3 text-2xl font-bold sm:text-4xl">
                        ยินดีต้อนรับ, {user.name}
                    </h1>
                    <p className="mt-3 text-sm leading-7 text-slate-300">
                        ภาพรวมการจัดการเว็บไซต์และข้อมูลสำคัญของโรงพยาบาล
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
                <Card title="ผู้ใช้งานทั้งหมด" value="128" />
                <Card title="ข่าวสารวันนี้" value="5" />
                <Card title="กิจกรรมวันนี้" value="3" />
            </div>
        </AdminLayout>
    );
}
