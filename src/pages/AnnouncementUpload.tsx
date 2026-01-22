import { useEffect, useRef, useState } from "react";
import api, { fetchAnnouncementTypes } from "../services/api";
import AdminLayout from "../layouts/Layout";

type User = { id: number; name: string; email: string };
type Props = { user: User; onLogout: () => void };

type AnnouncementType = {
    id: number;
    name: string;
};

export default function AnnouncementUpload({ user, onLogout }: Props) {
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState("");
    const [type, setType] = useState(""); // 🔥 ใช้ type_id
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [types, setTypes] = useState<AnnouncementType[]>([]);

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file) {
            setMessage("กรุณาเลือกไฟล์ PDF");
            return;
        }

        if (!type) {
            setMessage("กรุณาเลือกประเภทประกาศ");
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const formData = new FormData();
            formData.append("title", title);
            formData.append("type_id", type); // 🔥 ส่ง type_id ให้ตรง backend
            formData.append("file", file);

            await api.post("/api/announcements", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            setMessage("อัปโหลดสำเร็จ 🎉");
            setFile(null);
            setTitle("");
            setType("");

            // เคลียร์ input file
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } catch (err: any) {
            setMessage(err.response?.data?.message || "อัปโหลดไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    };

    // 🔥 โหลดประเภท dropdown
    useEffect(() => {
        fetchAnnouncementTypes()
            .then((res) => setTypes(res.data.data))
            .catch((err) => console.error("โหลดประเภทไม่สำเร็จ", err));
    }, []);

    // 🔥 สร้าง preview URL
    const previewUrl = file ? URL.createObjectURL(file) : null;

    const handleRemoveFile = () => {
        setFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];

        if (!selectedFile) return;

        // 🔥 เช็กขนาดไฟล์
        if (selectedFile.size > MAX_FILE_SIZE) {
            setMessage("ไฟล์ต้องมีขนาดไม่เกิน 10MB");
            setFile(null);

            // เคลียร์ input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            return;
        }

        // 🔥 เช็กชนิดไฟล์ (PDF เท่านั้น)
        if (selectedFile.type !== "application/pdf") {
            setMessage("รองรับเฉพาะไฟล์ PDF เท่านั้น");
            setFile(null);

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            return;
        }

        setMessage("");
        setFile(selectedFile);
    };

    return (
        <AdminLayout user={user} onLogout={onLogout}>
            <div className="bg-white rounded-xl shadow p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                    อัปโหลดประกาศ (PDF)
                </h2>

                {message && <div className="mb-4 text-sm">{message}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* หัวข้อ */}
                    <div>
                        <label className="block text-sm mb-1">หัวข้อ</label>
                        <input
                            type="text"
                            className="w-full border rounded-lg px-3 py-2"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    {/* ประเภท */}
                    <div>
                        <label className="block text-sm mb-1">ประเภท</label>
                        <select
                            className="w-full border rounded-lg px-3 py-2"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            required
                        >
                            <option value="">-- เลือกประเภท --</option>
                            {types.map((t) => (
                                <option key={t.id} value={t.id}>
                                    {t.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* ไฟล์ PDF */}
                    <div>
                        <label className="block text-sm mb-1">ไฟล์ PDF</label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="application/pdf"
                            title="ขนาดไฟล์ไม่เกิน 10MB"
                            onChange={handleFileChange}
                        />

                        {file && (
                            <div className="mt-2 flex items-center gap-3">
                                <div className="text-sm text-gray-500 mt-1">
                                    ไฟล์ที่เลือก: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                </div>

                                {/* 🔍 ปุ่มดูไฟล์ */}
                                {previewUrl && (
                                    <a
                                        href={previewUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary-600 hover:underline text-sm"
                                    >
                                        ดูไฟล์
                                    </a>
                                )}

                                {/* ❌ ปุ่มลบไฟล์ */}
                                <button
                                    type="button"
                                    onClick={handleRemoveFile}
                                    className="text-red-600 hover:underline text-sm"
                                >
                                    ลบไฟล์
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ปุ่ม submit */}
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
                        >
                            {loading ? "กำลังอัปโหลด..." : "อัปโหลด"}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
