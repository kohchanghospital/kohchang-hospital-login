import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";
import AdminLayout from "../layouts/Layout";
import api from "../services/api";
import { EditorPageSkeleton } from "../components/SkeletonScreens";

type User = { id: number; name: string; email: string };
type Props = { user: User; onLogout: () => void };

const donationSchema = z.object({
    bank_name: z.string().min(1, "กรุณากรอกชื่อธนาคาร"),
    account_name: z.string().min(1, "กรุณากรอกชื่อบัญชี"),
    account_number: z.string().min(1, "กรุณากรอกเลขบัญชี"),
    email: z.string().email("รูปแบบอีเมลไม่ถูกต้อง"),
    phone: z.string().min(1, "กรุณากรอกเบอร์โทรศัพท์"),
    fax: z.string().min(1, "กรุณากรอกแฟกซ์"),
    facebook: z.string().url("กรุณากรอก URL Facebook ให้ถูกต้อง"),
    organization_name: z.string().min(1, "กรุณากรอกชื่อหน่วยงาน"),
    description: z.string().min(1, "กรุณากรอกรายละเอียด"),
    address: z.string().min(1, "กรุณากรอกที่อยู่"),
    google_map_embed_url: z.string().url("กรุณากรอก Google Map Embed URL ให้ถูกต้อง"),
    latitude: z.coerce.number().min(-90, "ละติจูดต้องอยู่ระหว่าง -90 ถึง 90").max(90, "ละติจูดต้องอยู่ระหว่าง -90 ถึง 90"),
    longitude: z.coerce.number().min(-180, "ลองจิจูดต้องอยู่ระหว่าง -180 ถึง 180").max(180, "ลองจิจูดต้องอยู่ระหว่าง -180 ถึง 180"),
    qr_code_image: z
        .custom<FileList>()
        .optional()
        .refine((files) => !files || files.length === 0 || files[0].size <= 5 * 1024 * 1024, "รูปภาพต้องไม่เกิน 5MB")
        .refine(
            (files) => !files || files.length === 0 || ["image/jpeg", "image/png", "image/webp"].includes(files[0].type),
            "รองรับเฉพาะ JPG, PNG หรือ WEBP"
        ),
});

type DonationInput = z.input<typeof donationSchema>;
type DonationForm = z.output<typeof donationSchema>;

type DonationResponse = Omit<DonationForm, "qr_code_image"> & {
    id: number;
    qr_code_image: string | null;
    qr_code_image_url: string | null;
};

const emptyValues: DonationInput = {
    bank_name: "",
    account_name: "",
    account_number: "",
    email: "",
    phone: "",
    fax: "",
    facebook: "",
    organization_name: "",
    description: "",
    address: "",
    google_map_embed_url: "",
    latitude: 0,
    longitude: 0,
    qr_code_image: undefined,
};

export default function Donation({ user, onLogout }: Props) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<DonationResponse | null>(null);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<DonationInput, unknown, DonationForm>({
        resolver: zodResolver(donationSchema),
        defaultValues: emptyValues,
    });

    const selectedPreviewUrl = useMemo(() => {
        if (!selectedImage) return null;
        return URL.createObjectURL(selectedImage);
    }, [selectedImage]);

    useEffect(() => {
        return () => {
            if (selectedPreviewUrl) URL.revokeObjectURL(selectedPreviewUrl);
        };
    }, [selectedPreviewUrl]);

    const applySettings = (data: DonationResponse) => {
        setSettings(data);
        reset({
            bank_name: data.bank_name,
            account_name: data.account_name,
            account_number: data.account_number,
            email: data.email,
            phone: data.phone,
            fax: data.fax,
            facebook: data.facebook,
            organization_name: data.organization_name,
            description: data.description,
            address: data.address,
            google_map_embed_url: data.google_map_embed_url,
            latitude: Number(data.latitude),
            longitude: Number(data.longitude),
            qr_code_image: undefined,
        });
        setSelectedImage(null);
    };

    const loadSettings = async () => {
        try {
            setLoading(true);
            const res = await api.get("/api/donation/settings");
            applySettings(res.data.data);
        } catch (error) {
            console.error("Load donation settings failed", error);
            toast.error("โหลดข้อมูลสมทบทุนไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    const onSubmit = async (values: DonationForm) => {
        try {
            setSaving(true);

            const formData = new FormData();
            formData.append("_method", "PUT");
            formData.append("bank_name", values.bank_name);
            formData.append("account_name", values.account_name);
            formData.append("account_number", values.account_number);
            formData.append("email", values.email);
            formData.append("phone", values.phone);
            formData.append("fax", values.fax);
            formData.append("facebook", values.facebook);
            formData.append("organization_name", values.organization_name);
            formData.append("description", values.description);
            formData.append("address", values.address);
            formData.append("google_map_embed_url", values.google_map_embed_url);
            formData.append("latitude", String(values.latitude));
            formData.append("longitude", String(values.longitude));

            if (values.qr_code_image?.[0]) {
                formData.append("qr_code_image", values.qr_code_image[0]);
            }

            const res = await api.post("/api/donation/settings", formData);
            applySettings(res.data.data);
            toast.success("บันทึกข้อมูลสมทบทุนเรียบร้อย");
        } catch (error: unknown) {
            const message = error && typeof error === "object" && "response" in error
                ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                : undefined;

            toast.error(message || "บันทึกข้อมูลไม่สำเร็จ");
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        if (settings) {
            applySettings(settings);
            toast.success("คืนค่าข้อมูลล่าสุดแล้ว");
        }
    };

    const imagePreview = selectedPreviewUrl || settings?.qr_code_image_url;

    if (loading) {
        return (
            <AdminLayout user={user} onLogout={onLogout}>
                <EditorPageSkeleton sections={5} variant="form" />
            </AdminLayout>
        );
    }

    return (
        <AdminLayout user={user} onLogout={onLogout}>
            <div className="page-surface page-pad">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-slate-900">จัดการข้อมูลสมทบทุน</h2>
                    <p className="mt-1 text-sm text-slate-500">แก้ไขข้อมูลบัญชี QR Code ช่องทางติดต่อ และแผนที่สำหรับหน้า Donation Cash</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-5xl space-y-6">
                    <Section title="ข้อมูลธนาคาร">
                        <Field label="ชื่อธนาคาร" error={errors.bank_name?.message}>
                            <input className="w-full" {...register("bank_name")} />
                        </Field>
                        <Field label="ชื่อบัญชี" error={errors.account_name?.message}>
                            <input className="w-full" {...register("account_name")} />
                        </Field>
                        <Field label="เลขบัญชี" error={errors.account_number?.message}>
                            <input className="w-full" {...register("account_number")} />
                        </Field>
                    </Section>

                    <Section title="QR Code">
                        <div className="grid gap-4 md:col-span-2 lg:grid-cols-[minmax(0,1fr)_220px]">
                            <Field label="อัปโหลดรูป QR Code" error={errors.qr_code_image?.message}>
                                <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    className="w-full"
                                    {...register("qr_code_image", {
                                        onChange: (event) => setSelectedImage(event.target.files?.[0] || null),
                                    })}
                                />
                            </Field>
                            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                                <div className="mb-2 text-sm font-semibold text-slate-700">ตัวอย่างรูปภาพ</div>
                                {imagePreview ? (
                                    <img src={imagePreview} alt="QR Code preview" className="h-48 w-full rounded-lg bg-white object-contain" />
                                ) : (
                                    <div className="flex h-48 items-center justify-center rounded-lg bg-white text-sm text-slate-400">
                                        ยังไม่มีรูปภาพ
                                    </div>
                                )}
                            </div>
                        </div>
                    </Section>

                    <Section title="ข้อมูลติดต่อ">
                        <Field label="อีเมล" error={errors.email?.message}>
                            <input type="email" className="w-full" {...register("email")} />
                        </Field>
                        <Field label="โทรศัพท์" error={errors.phone?.message}>
                            <input className="w-full" {...register("phone")} />
                        </Field>
                        <Field label="แฟกซ์" error={errors.fax?.message}>
                            <input className="w-full" {...register("fax")} />
                        </Field>
                        <Field label="Facebook URL" error={errors.facebook?.message}>
                            <input className="w-full" {...register("facebook")} />
                        </Field>
                    </Section>

                    <Section title="ข้อมูลองค์กร">
                        <Field label="ชื่อหน่วยงาน" error={errors.organization_name?.message}>
                            <input className="w-full" {...register("organization_name")} />
                        </Field>
                        <Field label="รายละเอียด" error={errors.description?.message} full>
                            <textarea rows={4} className="w-full" {...register("description")} />
                        </Field>
                        <Field label="ที่อยู่" error={errors.address?.message} full>
                            <textarea rows={3} className="w-full" {...register("address")} />
                        </Field>
                    </Section>

                    <Section title="ข้อมูลแผนที่">
                        <Field label="Google Map Embed URL" error={errors.google_map_embed_url?.message} full>
                            <textarea rows={3} className="w-full" {...register("google_map_embed_url")} />
                        </Field>
                        <Field label="Latitude" error={errors.latitude?.message}>
                            <input type="number" step="0.0000001" className="w-full" {...register("latitude")} />
                        </Field>
                        <Field label="Longitude" error={errors.longitude?.message}>
                            <input type="number" step="0.0000001" className="w-full" {...register("longitude")} />
                        </Field>
                    </Section>

                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <button type="button" onClick={handleReset} disabled={saving} className="btn-muted">
                            รีเซ็ต
                        </button>
                        <button type="submit" disabled={saving} className="btn-primary">
                            {saving ? "กำลังบันทึก..." : "บันทึก"}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-slate-800">{title}</h3>
            <div className="grid gap-4 md:grid-cols-2">{children}</div>
        </section>
    );
}

function Field({ label, error, children, full = false }: { label: string; error?: string; children: React.ReactNode; full?: boolean }) {
    return (
        <label className={`block ${full ? "md:col-span-2" : ""}`}>
            <span className="mb-1 block text-sm font-semibold text-slate-700">{label}</span>
            {children}
            {error && <span className="mt-1 block text-sm text-red-600">{error}</span>}
        </label>
    );
}
