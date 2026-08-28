import { useEffect, useMemo, useState } from "react";
import { Editor } from "@tinymce/tinymce-react";
import toast from "react-hot-toast";
import { FaCheckCircle, FaDesktop, FaEdit, FaExternalLinkAlt, FaFileAlt, FaSave, FaTimes } from "react-icons/fa";
import AdminLayout from "../layouts/Layout";
import { EditorPageSkeleton } from "../components/SkeletonScreens";
import api from "../services/api";

type User = { id: number; name: string; email: string };
type Props = { user: User; onLogout: () => void };
type PolicyType = "privacy_policy" | "cookie_policy" | "terms_of_service";
type Policy = {
    id: number;
    policy_type: PolicyType;
    title_th: string;
    title_en: string | null;
    content_th: string | null;
    content_en: string | null;
    is_active: boolean;
    updated_at: string;
    updater: { id: number; name: string; email: string } | null;
};
type SiteSettings = { show_mourning_ribbon: boolean };
type SettingsTab = "policies" | "display";

const publicSiteUrl = (import.meta.env.VITE_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
const policySlugs: Record<PolicyType, string> = {
    privacy_policy: "privacy-policy",
    cookie_policy: "cookie-policy",
    terms_of_service: "terms-of-service",
};
const editorConfig = {
    height: 360,
    menubar: false,
    invalid_elements: "script,iframe,object,embed,form,input,button,style",
    plugins: "advlist autolink lists link charmap preview searchreplace visualblocks fullscreen wordcount",
    toolbar: "undo redo | blocks | bold italic underline | bullist numlist outdent indent | link | removeformat preview fullscreen",
    content_style: "body { font-family: 'Noto Sans Thai', Arial, sans-serif; font-size: 17px; line-height: 1.75; padding: 12px; }",
    link_target_list: false,
};

function apiMessage(error: unknown) {
    if (!error || typeof error !== "object" || !("response" in error)) return null;
    return (error as { response?: { data?: { message?: string } } }).response?.data?.message || null;
}

function thaiDate(value: string) {
    return new Intl.DateTimeFormat("th-TH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function Setting({ user, onLogout }: Props) {
    const [activeTab, setActiveTab] = useState<SettingsTab>("policies");
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
    const [editing, setEditing] = useState<Policy | null>(null);
    const [savedPolicy, setSavedPolicy] = useState<Policy | null>(null);
    const [language, setLanguage] = useState<"th" | "en">("th");
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [settingsLoadError, setSettingsLoadError] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savingSetting, setSavingSetting] = useState(false);
    const dirty = useMemo(() => Boolean(editing && savedPolicy && JSON.stringify(editing) !== JSON.stringify(savedPolicy)), [editing, savedPolicy]);

    const loadPolicies = async () => {
        setLoadError(false);
        try {
            const response = await api.get("/api/admin/policies");
            setPolicies(response.data.data);
        } catch {
            setLoadError(true);
            toast.error("โหลดข้อมูลนโยบายไม่สำเร็จ");
        }
    };

    const loadSiteSettings = async () => {
        setSettingsLoadError(false);
        try {
            const response = await api.get("/api/admin/site-settings");
            setSiteSettings(response.data.data);
        } catch {
            setSettingsLoadError(true);
            toast.error("โหลดการตั้งค่าการแสดงผลไม่สำเร็จ");
        }
    };

    useEffect(() => {
        const loadPage = async () => {
            setLoading(true);
            await Promise.all([loadPolicies(), loadSiteSettings()]);
            setLoading(false);
        };
        void loadPage();
    }, []);
    useEffect(() => {
        const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [dirty]);

    const startEditing = (policy: Policy) => {
        if (dirty && !window.confirm("มีข้อมูลที่ยังไม่ได้บันทึก ต้องการออกจากแบบฟอร์มหรือไม่?")) return;
        setEditing({ ...policy });
        setSavedPolicy({ ...policy });
        setLanguage("th");
    };

    const closeEditor = () => {
        if (dirty && !window.confirm("มีข้อมูลที่ยังไม่ได้บันทึก ต้องการปิดแบบฟอร์มหรือไม่?")) return;
        setEditing(null);
        setSavedPolicy(null);
    };

    const save = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!editing || saving) return;
        if (!editing.title_th.trim()) return void toast.error("กรุณากรอกชื่อภาษาไทย");
        setSaving(true);
        try {
            const response = await api.put(`/api/admin/policies/${editing.policy_type}`, {
                title_th: editing.title_th,
                title_en: editing.title_en || null,
                content_th: editing.content_th || null,
                content_en: editing.content_en || null,
                is_active: editing.is_active,
            });
            const updated: Policy = response.data.data;
            setPolicies((current) => current.map((item) => item.id === updated.id ? updated : item));
            setEditing(updated);
            setSavedPolicy(updated);
            toast.success("บันทึกนโยบายสำเร็จ");
        } catch (error) {
            toast.error(apiMessage(error) || "บันทึกนโยบายไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
        } finally {
            setSaving(false);
        }
    };

    const toggleMourningRibbon = async () => {
        if (!siteSettings || savingSetting) return;
        const previous = siteSettings;
        const nextValue = !previous.show_mourning_ribbon;
        setSiteSettings({ ...previous, show_mourning_ribbon: nextValue });
        setSavingSetting(true);
        try {
            const response = await api.put("/api/admin/site-settings", {
                show_mourning_ribbon: nextValue,
            });
            setSiteSettings(response.data.data);
            toast.success(nextValue ? "เปิดใช้งานโบว์ดำแล้ว" : "ปิดใช้งานโบว์ดำแล้ว");
        } catch (error) {
            setSiteSettings(previous);
            toast.error(apiMessage(error) || "บันทึกการตั้งค่าการแสดงผลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
        } finally {
            setSavingSetting(false);
        }
    };

    if (loading) return <AdminLayout user={user} onLogout={onLogout}><EditorPageSkeleton variant="settings" /></AdminLayout>;

    return (
        <AdminLayout user={user} onLogout={onLogout}>
            <div className="space-y-5">
                <header className="page-surface page-pad">
                    <p className="text-sm font-semibold text-primary-700">การตั้งค่าระบบ</p>
                    <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">ตั้งค่า</h1>
                    <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">จัดการข้อมูลและการตั้งค่าของเว็บไซต์โรงพยาบาลเกาะช้าง</p>
                    <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="หมวดการตั้งค่า">
                        <button type="button" className="btn-muted" disabled title="เตรียมไว้สำหรับการตั้งค่าเว็บไซต์ในอนาคต">ข้อมูลทั่วไป</button>
                        <button type="button" className={activeTab === "policies" ? "btn-primary" : "btn-muted"} role="tab" aria-selected={activeTab === "policies"} onClick={() => setActiveTab("policies")}><FaFileAlt /> นโยบายเว็บไซต์</button>
                        <button type="button" className={activeTab === "display" ? "btn-primary" : "btn-muted"} role="tab" aria-selected={activeTab === "display"} onClick={() => setActiveTab("display")}><FaDesktop /> การแสดงผลเว็บไซต์</button>
                    </div>
                </header>
                {activeTab === "display" ? (
                    settingsLoadError || !siteSettings
                        ? <SettingsLoadError onRetry={() => void loadSiteSettings()} />
                        : <DisplaySettings settings={siteSettings} saving={savingSetting} onToggle={() => void toggleMourningRibbon()} />
                ) : loadError ? <LoadError onRetry={() => void loadPolicies()} /> : editing ? (
                    <PolicyEditor policy={editing} language={language} saving={saving} dirty={dirty} onLanguage={setLanguage} onChange={setEditing} onClose={closeEditor} onSave={save} />
                ) : <PolicyList policies={policies} onEdit={startEditing} />}
            </div>
        </AdminLayout>
    );
}

function SettingsLoadError({ onRetry }: { onRetry: () => void }) {
    return (
        <div className="page-surface page-pad text-center">
            <h2 className="font-bold text-slate-900">ไม่สามารถโหลดการตั้งค่าการแสดงผลได้</h2>
            <p className="mt-2 text-sm text-slate-600">กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่อีกครั้ง</p>
            <button type="button" className="btn-primary mt-5" onClick={onRetry}>ลองใหม่</button>
        </div>
    );
}

function DisplaySettings({ settings, saving, onToggle }: { settings: SiteSettings; saving: boolean; onToggle: () => void }) {
    const enabled = settings.show_mourning_ribbon;
    return (
        <section className="page-surface page-pad" aria-labelledby="display-settings-heading">
            <div className="mb-5">
                <h2 id="display-settings-heading" className="text-xl font-bold text-slate-950">การแสดงผลเว็บไซต์</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">จัดการองค์ประกอบที่แสดงร่วมกันในทุกหน้าของเว็บไซต์สาธารณะ</p>
            </div>
            <div className="flex flex-col gap-5 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <h3 className="font-bold text-slate-900">โบว์ดำไว้อาลัย</h3>
                    <p id="mourning-ribbon-description" className="mt-1 text-sm leading-6 text-slate-600">แสดงสัญลักษณ์โบว์ดำบริเวณมุมขวาบนของเว็บไซต์</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                    <span className={`text-sm font-bold ${enabled ? "text-emerald-700" : "text-slate-500"}`} aria-hidden="true">
                        {saving ? "กำลังบันทึก..." : enabled ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                    </span>
                    <button
                        type="button"
                        role="switch"
                        aria-checked={enabled}
                        aria-describedby="mourning-ribbon-description"
                        aria-label="แสดงโบว์ดำไว้อาลัย"
                        disabled={saving}
                        onClick={onToggle}
                        className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-70 ${enabled ? "bg-emerald-600" : "bg-slate-300"}`}
                    >
                        <span className={`inline-block h-6 w-6 rounded-full bg-white shadow transition-transform ${enabled ? "translate-x-6" : "translate-x-0"}`} />
                    </button>
                    <span className="w-7 text-xs font-extrabold text-slate-500" aria-hidden="true">{enabled ? "ON" : "OFF"}</span>
                </div>
            </div>
        </section>
    );
}

function LoadError({ onRetry }: { onRetry: () => void }) {
    return (
        <div className="page-surface page-pad text-center">
            <h2 className="font-bold text-slate-900">ไม่สามารถโหลดนโยบายเว็บไซต์ได้</h2>
            <p className="mt-2 text-sm text-slate-600">กรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่อีกครั้ง</p>
            <button type="button" className="btn-primary mt-5" onClick={onRetry}>ลองใหม่</button>
        </div>
    );
}

function PolicyList({ policies, onEdit }: { policies: Policy[]; onEdit: (policy: Policy) => void }) {
    return (
        <section className="page-surface page-pad" aria-labelledby="policy-heading">
            <div className="mb-5">
                <h2 id="policy-heading" className="text-xl font-bold text-slate-950">จัดการนโยบายเว็บไซต์</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">แก้ไขเนื้อหา เปิดหรือปิดการเผยแพร่ และดูหน้าที่แสดงบนเว็บไซต์</p>
            </div>
            <div className="grid gap-4 xl:grid-cols-3">
                {policies.map((policy) => (
                    <article key={policy.id} className="flex min-w-0 flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700"><FaFileAlt /></span>
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${policy.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                                {policy.is_active && <FaCheckCircle />} {policy.is_active ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                            </span>
                        </div>
                        <h3 className="mt-4 text-lg font-bold leading-7 text-slate-900">{policy.title_th}</h3>
                        <p className="mt-1 break-all font-mono text-xs text-slate-400">{policy.policy_type}</p>
                        <dl className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm">
                            <div className="flex flex-wrap justify-between gap-2"><dt className="text-slate-500">แก้ไขล่าสุด</dt><dd className="font-medium text-slate-700">{thaiDate(policy.updated_at)}</dd></div>
                            <div className="flex flex-wrap justify-between gap-2"><dt className="text-slate-500">ผู้แก้ไข</dt><dd className="font-medium text-slate-700">{policy.updater?.name || "—"}</dd></div>
                        </dl>
                        <div className="mt-auto flex flex-wrap gap-2 pt-5">
                            {policy.is_active && <a className="btn-muted flex-1" href={`${publicSiteUrl}/th/${policySlugs[policy.policy_type]}`} target="_blank" rel="noopener noreferrer"><FaExternalLinkAlt /> ดูตัวอย่าง</a>}
                            <button type="button" className="btn-primary flex-1" onClick={() => onEdit(policy)}><FaEdit /> แก้ไข</button>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
}

function PolicyEditor({ policy, language, saving, dirty, onLanguage, onChange, onClose, onSave }: {
    policy: Policy;
    language: "th" | "en";
    saving: boolean;
    dirty: boolean;
    onLanguage: (language: "th" | "en") => void;
    onChange: (policy: Policy) => void;
    onClose: () => void;
    onSave: (event: React.FormEvent) => void;
}) {
    const setField = <K extends keyof Policy>(field: K, value: Policy[K]) => onChange({ ...policy, [field]: value });
    return (
        <form className="page-surface page-pad" onSubmit={onSave}>
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <p className="text-sm font-semibold text-primary-700">แก้ไขนโยบาย</p>
                    <h2 className="mt-1 text-xl font-bold text-slate-950 sm:text-2xl">{policy.title_th}</h2>
                    <p className="mt-1 font-mono text-xs text-slate-400">{policy.policy_type}</p>
                </div>
                <button type="button" className="btn-muted shrink-0" onClick={onClose} disabled={saving}><FaTimes /> ปิด</button>
            </div>
            <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="ภาษาของเนื้อหา">
                <button type="button" role="tab" aria-selected={language === "th"} className={language === "th" ? "btn-primary" : "btn-muted"} onClick={() => onLanguage("th")}>ภาษาไทย</button>
                <button type="button" role="tab" aria-selected={language === "en"} className={language === "en" ? "btn-primary" : "btn-muted"} onClick={() => onLanguage("en")}>English</button>
            </div>
            <div className="mt-5 space-y-5">
                {language === "th" ? (
                    <>
                        <label className="block space-y-1.5"><span className="text-sm font-semibold text-slate-700">ชื่อภาษาไทย <span className="text-red-500">*</span></span><input className="w-full" value={policy.title_th} onChange={(event) => setField("title_th", event.target.value)} disabled={saving} required /></label>
                        <Editor apiKey="cnb5mdtyf8l00ctwv9buaks8gkm1n81d8og9f9fvzixzqu99" value={policy.content_th || ""} disabled={saving} onEditorChange={(value) => setField("content_th", value || null)} init={editorConfig} />
                    </>
                ) : (
                    <>
                        <label className="block space-y-1.5"><span className="text-sm font-semibold text-slate-700">ชื่อภาษาอังกฤษ</span><input className="w-full" value={policy.title_en || ""} onChange={(event) => setField("title_en", event.target.value || null)} disabled={saving} /></label>
                        <Editor apiKey="cnb5mdtyf8l00ctwv9buaks8gkm1n81d8og9f9fvzixzqu99" value={policy.content_en || ""} disabled={saving} onEditorChange={(value) => setField("content_en", value || null)} init={editorConfig} />
                    </>
                )}
            </div>
            <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <input type="checkbox" className="mt-0.5 h-5 min-h-0 w-5" checked={policy.is_active} onChange={(event) => setField("is_active", event.target.checked)} disabled={saving} />
                <span><span className="block font-bold text-slate-800">เปิดใช้งานและแสดงผลบนเว็บไซต์</span><span className="mt-1 block text-sm leading-6 text-slate-500">เมื่อปิดใช้งาน หน้านโยบายและลิงก์ในส่วนท้ายเว็บไซต์จะไม่แสดงต่อสาธารณะ</span></span>
            </label>
            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-slate-500">{dirty ? "มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก" : "บันทึกข้อมูลล่าสุดแล้ว"}</span>
                <div className="flex flex-wrap gap-2">
                    <a className="btn-muted" href={`${publicSiteUrl}/th/${policySlugs[policy.policy_type]}`} target="_blank" rel="noopener noreferrer"><FaExternalLinkAlt /> ดูตัวอย่าง</a>
                    <button type="submit" className="btn-primary" disabled={saving || !dirty}><FaSave /> {saving ? "กำลังบันทึก..." : "บันทึกนโยบาย"}</button>
                </div>
            </div>
        </form>
    );
}
