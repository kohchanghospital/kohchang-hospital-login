import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FaArrowDown, FaArrowUp, FaExternalLinkAlt, FaPlus, FaSave, FaTrash } from "react-icons/fa";
import AdminLayout from "../layouts/Layout";
import { EditorPageSkeleton } from "../components/SkeletonScreens";
import api from "../services/api";

type User = { id: number; name: string; email: string };
type Props = { user: User; onLogout: () => void };

type OrganItem = { id?: number; key: string; title: string; sort_order: number; is_active: boolean };
type QualificationItem = { id?: number; key: string; content: string; sort_order: number; is_active: boolean };

type OrganDonationData = {
    id: number;
    eyebrow_text: string;
    page_title: string;
    headline: string;
    subheadline: string;
    importance_title: string;
    importance_content: string;
    qualification_title: string;
    contact_title: string | null;
    contact_description: string | null;
    phone: string | null;
    external_url: string | null;
    external_url_label: string | null;
    organs: OrganItem[];
    qualifications: QualificationItem[];
};

const publicSiteUrl = (import.meta.env.VITE_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
const createKey = () => crypto.randomUUID();

function hydrate(data: OrganDonationData): OrganDonationData {
    return {
        ...data,
        organs: data.organs.map((item) => ({ ...item, key: createKey() })),
        qualifications: data.qualifications.map((item) => ({ ...item, key: createKey() })),
    };
}

function apiErrorMessage(error: unknown) {
    if (!error || typeof error !== "object" || !("response" in error)) return null;
    return (error as { response?: { data?: { message?: string } } }).response?.data?.message ?? null;
}

export default function OrganDonation({ user, onLogout }: Props) {
    const [data, setData] = useState<OrganDonationData | null>(null);
    const [savedData, setSavedData] = useState<OrganDonationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const dirty = useMemo(() => JSON.stringify(data) !== JSON.stringify(savedData), [data, savedData]);

    useEffect(() => {
        const load = async () => {
            try {
                const response = await api.get("/api/admin/organ-donation");
                const hydrated = hydrate(response.data.data);
                setData(hydrated);
                setSavedData(hydrated);
            } catch (error) {
                toast.error(apiErrorMessage(error) || "โหลดข้อมูลบริจาคอวัยวะไม่สำเร็จ");
            } finally {
                setLoading(false);
            }
        };
        void load();
    }, []);

    useEffect(() => {
        const warn = (event: BeforeUnloadEvent) => {
            if (!dirty) return;
            event.preventDefault();
        };
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [dirty]);

    const setField = <K extends keyof OrganDonationData>(field: K, value: OrganDonationData[K]) => {
        setData((current) => current ? { ...current, [field]: value } : current);
    };

    const updateOrgan = (key: string, patch: Partial<OrganItem>) => {
        setData((current) => current ? { ...current, organs: current.organs.map((item) => item.key === key ? { ...item, ...patch } : item) } : current);
    };

    const updateQualification = (key: string, patch: Partial<QualificationItem>) => {
        setData((current) => current ? { ...current, qualifications: current.qualifications.map((item) => item.key === key ? { ...item, ...patch } : item) } : current);
    };

    const move = (type: "organs" | "qualifications", index: number, offset: number) => {
        setData((current) => {
            if (!current) return current;
            const target = index + offset;
            if (target < 0 || target >= current[type].length) return current;
            const items = [...current[type]];
            [items[index], items[target]] = [items[target], items[index]];
            return { ...current, [type]: items.map((item, itemIndex) => ({ ...item, sort_order: itemIndex + 1 })) };
        });
    };

    const remove = (type: "organs" | "qualifications", key: string, label: string) => {
        if (!window.confirm(`ยืนยันการลบ “${label || "รายการนี้"}” หรือไม่?`)) return;
        setData((current) => current ? {
            ...current,
            [type]: current[type].filter((item) => item.key !== key).map((item, index) => ({ ...item, sort_order: index + 1 })),
        } : current);
    };

    const save = async () => {
        if (!data) return;
        if (!data.eyebrow_text.trim() || !data.page_title.trim() || !data.headline.trim() || !data.importance_title.trim() || !data.importance_content.trim() || !data.qualification_title.trim()) {
            toast.error("กรุณากรอกข้อมูลหัวข้อและเนื้อหาที่จำเป็นให้ครบถ้วน");
            return;
        }
        if (data.organs.some((item) => !item.title.trim()) || data.qualifications.some((item) => !item.content.trim())) {
            toast.error("กรุณากรอกรายการอวัยวะและคุณสมบัติให้ครบถ้วน");
            return;
        }

        try {
            setSaving(true);
            const payload = {
                ...data,
                organs: data.organs.map(({ id, title, is_active }, index) => ({ id, title: title.trim(), sort_order: index + 1, is_active })),
                qualifications: data.qualifications.map(({ id, content, is_active }, index) => ({ id, content: content.trim(), sort_order: index + 1, is_active })),
            };
            const response = await api.put("/api/admin/organ-donation", payload);
            const hydrated = hydrate(response.data.data);
            setData(hydrated);
            setSavedData(hydrated);
            toast.success("บันทึกข้อมูลบริจาคอวัยวะเรียบร้อย");
        } catch (error) {
            toast.error(apiErrorMessage(error) || "บันทึกข้อมูลบริจาคอวัยวะไม่สำเร็จ");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <AdminLayout user={user} onLogout={onLogout}><EditorPageSkeleton sections={5} variant="form" /></AdminLayout>;

    if (!data) {
        return <AdminLayout user={user} onLogout={onLogout}><div className="page-surface page-pad text-center text-slate-500">ไม่สามารถโหลดข้อมูลบริจาคอวัยวะได้</div></AdminLayout>;
    }

    return (
        <AdminLayout user={user} onLogout={onLogout}>
            <div className="page-surface page-pad">
                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">จัดการข้อมูลบริจาคอวัยวะ</h2>
                        <p className="mt-1 text-sm text-slate-500">จัดการเนื้อหาที่แสดงในหน้าบริจาคอวัยวะของเว็บไซต์</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <a href={`${publicSiteUrl}/th/donation/organ`} target="_blank" rel="noreferrer" className="btn-muted"><FaExternalLinkAlt />ดูหน้าเว็บไซต์</a>
                        <button type="button" onClick={() => void save()} disabled={saving || !dirty} className="btn-primary"><FaSave />{saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}</button>
                    </div>
                </div>

                <div className="space-y-6">
                    <Section title="Hero / Header">
                        <Field label="ข้อความเหนือหัวข้อ"><input className="w-full" value={data.eyebrow_text} onChange={(e) => setField("eyebrow_text", e.target.value)} /></Field>
                        <Field label="ชื่อหน้า"><input className="w-full" value={data.page_title} onChange={(e) => setField("page_title", e.target.value)} /></Field>
                        <Field label="ข้อความหลัก" full><input className="w-full" value={data.headline} onChange={(e) => setField("headline", e.target.value)} /></Field>
                        <Field label="ข้อความรอง" full><input className="w-full" value={data.subheadline} onChange={(e) => setField("subheadline", e.target.value)} /></Field>
                    </Section>

                    <Section title="ความสำคัญของการบริจาคอวัยวะ">
                        <Field label="หัวข้อ" full><input className="w-full" value={data.importance_title} onChange={(e) => setField("importance_title", e.target.value)} /></Field>
                        <Field label="เนื้อหา" full><textarea rows={7} className="w-full resize-y py-2" value={data.importance_content} onChange={(e) => setField("importance_content", e.target.value)} /></Field>
                    </Section>

                    <RepeatableSection title="อวัยวะที่สามารถบริจาคได้" onAdd={() => setData({ ...data, organs: [...data.organs, { key: createKey(), title: "", sort_order: data.organs.length + 1, is_active: true }] })}>
                        {data.organs.length === 0 && <EmptyItems />}
                        {data.organs.map((item, index) => (
                            <RepeatableRow key={item.key} index={index} total={data.organs.length} active={item.is_active} onActive={(value) => updateOrgan(item.key, { is_active: value })} onUp={() => move("organs", index, -1)} onDown={() => move("organs", index, 1)} onDelete={() => remove("organs", item.key, item.title)}>
                                <input className="w-full" value={item.title} placeholder="ชื่ออวัยวะ" onChange={(e) => updateOrgan(item.key, { title: e.target.value })} />
                            </RepeatableRow>
                        ))}
                    </RepeatableSection>

                    <Section title="คุณสมบัติผู้บริจาคอวัยวะ">
                        <Field label="หัวข้อ" full><input className="w-full" value={data.qualification_title} onChange={(e) => setField("qualification_title", e.target.value)} /></Field>
                        <div className="md:col-span-2">
                            <div className="mb-3 flex justify-end"><button type="button" className="btn-muted" onClick={() => setData({ ...data, qualifications: [...data.qualifications, { key: createKey(), content: "", sort_order: data.qualifications.length + 1, is_active: true }] })}><FaPlus />เพิ่มคุณสมบัติ</button></div>
                            <div className="space-y-3">
                                {data.qualifications.length === 0 && <EmptyItems />}
                                {data.qualifications.map((item, index) => (
                                    <RepeatableRow key={item.key} index={index} total={data.qualifications.length} active={item.is_active} onActive={(value) => updateQualification(item.key, { is_active: value })} onUp={() => move("qualifications", index, -1)} onDown={() => move("qualifications", index, 1)} onDelete={() => remove("qualifications", item.key, item.content)}>
                                        <textarea rows={2} className="w-full resize-y py-2" value={item.content} placeholder="รายละเอียดคุณสมบัติ" onChange={(e) => updateQualification(item.key, { content: e.target.value })} />
                                    </RepeatableRow>
                                ))}
                            </div>
                        </div>
                    </Section>

                    <Section title="ข้อมูลติดต่อ / ข้อมูลเพิ่มเติม">
                        <Field label="หัวข้อ"><input className="w-full" value={data.contact_title || ""} onChange={(e) => setField("contact_title", e.target.value || null)} /></Field>
                        <Field label="โทรศัพท์"><input className="w-full" value={data.phone || ""} onChange={(e) => setField("phone", e.target.value || null)} /></Field>
                        <Field label="คำอธิบาย" full><textarea rows={3} className="w-full resize-y py-2" value={data.contact_description || ""} onChange={(e) => setField("contact_description", e.target.value || null)} /></Field>
                        <Field label="ลิงก์ภายนอก"><input type="url" className="w-full" value={data.external_url || ""} onChange={(e) => setField("external_url", e.target.value || null)} /></Field>
                        <Field label="ข้อความบนปุ่ม"><input className="w-full" value={data.external_url_label || ""} onChange={(e) => setField("external_url_label", e.target.value || null)} /></Field>
                    </Section>
                </div>
            </div>
        </AdminLayout>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5"><h3 className="mb-4 text-lg font-bold text-slate-800">{title}</h3><div className="grid gap-4 md:grid-cols-2">{children}</div></section>;
}

function Field({ label, children, full = false }: { label: string; children: React.ReactNode; full?: boolean }) {
    return <label className={`block space-y-1.5 ${full ? "md:col-span-2" : ""}`}><span className="text-sm font-semibold text-slate-700">{label}</span>{children}</label>;
}

function RepeatableSection({ title, onAdd, children }: { title: string; onAdd: () => void; children: React.ReactNode }) {
    return <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-3"><h3 className="text-lg font-bold text-slate-800">{title}</h3><button type="button" className="btn-muted" onClick={onAdd}><FaPlus />เพิ่มรายการ</button></div><div className="space-y-3">{children}</div></section>;
}

function RepeatableRow({ index, total, active, onActive, onUp, onDown, onDelete, children }: { index: number; total: number; active: boolean; onActive: (value: boolean) => void; onUp: () => void; onDown: () => void; onDelete: () => void; children: React.ReactNode }) {
    return <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3"><div className="flex flex-col gap-3 sm:flex-row sm:items-start"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 font-bold text-primary-700">{index + 1}</span><div className="min-w-0 flex-1">{children}</div><div className="flex shrink-0 items-center gap-1"><label className="mr-2 inline-flex min-h-9 cursor-pointer items-center gap-2 text-sm font-medium text-slate-600"><input type="checkbox" className="h-4 min-h-0 w-4" checked={active} onChange={(e) => onActive(e.target.checked)} />แสดง</label><button type="button" className="icon-button text-slate-500" disabled={index === 0} onClick={onUp} title="เลื่อนขึ้น"><FaArrowUp /></button><button type="button" className="icon-button text-slate-500" disabled={index === total - 1} onClick={onDown} title="เลื่อนลง"><FaArrowDown /></button><button type="button" className="icon-button text-red-600 hover:bg-red-50" onClick={onDelete} title="ลบ"><FaTrash /></button></div></div></div>;
}

function EmptyItems() {
    return <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">ยังไม่มีรายการ</p>;
}
