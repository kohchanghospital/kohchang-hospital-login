import { useRef, useState } from "react";
import api from "../services/api";

type AnnouncementType = {
    id: number;
    name: string;
};

type Announcement = {
    id: number;
    title: string;
    type_id: number;
    file_path?: string;
};

type AnnouncementModalProps = {
    types: AnnouncementType[];
    initialData?: Announcement;
    onClose: () => void;
    onSuccess: () => void;
};

export default function AnnouncementModal({ types, onClose, initialData, onSuccess }: AnnouncementModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState(initialData?.title || "");
    const [type, setType] = useState(initialData?.type_id?.toString() || "");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const isEdit = !!initialData;

    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const MAX_FILE_SIZE = 10 * 1024 * 1024;

    const previewUrl = file ? URL.createObjectURL(file) : null;
    const handleRemoveFile = () => {
        setFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title || !type) {
            setMessage("กรุณากรอกข้อมูลให้ครบ");
            return;
        }

        if (!isEdit && !file) {
            setMessage("กรุณาเลือกไฟล์ PDF");
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const formData = new FormData();
            formData.append("title", title);
            formData.append("type_id", type);

            if (file) {
                formData.append("file", file);
            }

            if (isEdit) {
                await api.post(`/announcements/${initialData!.id}?_method=PUT`, formData);
            } else {
                formData.append("file", file!);
                await api.post("/api/announcements", formData);
            }

            setMessage(isEdit ? "อัปเดตสำเร็จ 🎉" : "อัปโหลดสำเร็จ 🎉");

            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1000);
        } catch (err: any) {
            setMessage(err.response?.data?.message || "บันทึกไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    };


    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        if (selectedFile.size > MAX_FILE_SIZE) {
            setMessage("ไฟล์ต้องไม่เกิน 10MB");
            return;
        }

        if (selectedFile.type !== "application/pdf") {
            setMessage("รองรับเฉพาะ PDF");
            return;
        }

        setFile(selectedFile);
        setMessage("");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-400 hover:text-red-600"
                >
                    ✕
                </button>

                {/* <h3 className="text-lg font-bold mb-4">อัปโหลดประกาศ (PDF)</h3> */}
                <h3 className="text-lg font-bold mb-4">
                    {isEdit ? "แก้ไขประกาศ" : "อัปโหลดประกาศ (PDF)"}
                </h3>

                {message && <div className="mb-3 text-sm text-red-500">{message}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        placeholder="หัวข้อ"
                        className="w-full border rounded px-3 py-2"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />

                    <select
                        className="w-full border rounded px-3 py-2"
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

                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="application/pdf"
                            title="ขนาดไฟล์ไม่เกิน 10MB"
                            onChange={handleFileChange}
                        />

                        {initialData?.file_path && !file && (
                            <div className="text-sm mt-2 text-gray-500">
                                ไฟล์เดิม:
                                <a
                                    href={`http://localhost:8000/storage/${initialData.file_path}`}
                                    target="_blank"
                                    className="text-primary-600 ml-2 underline"
                                >
                                    ดูไฟล์
                                </a>
                            </div>
                        )}

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

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border rounded hover:bg-gray-100"
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
                        >
                            {loading ? "กำลังบันทึก..." : isEdit ? "บันทึกการแก้ไข" : "อัปโหลด"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
