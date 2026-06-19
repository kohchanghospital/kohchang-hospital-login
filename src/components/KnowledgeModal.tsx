import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import api from "../services/api";


type Knowledge = {
    id: number;
    title: string;
    file_path?: string;
};

type KnowledgeModalProps = {
    initialData?: Knowledge;
    onClose: () => void;
    onSuccess: () => void;
};

export default function KnowledgeModal({ onClose, initialData, onSuccess }: KnowledgeModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState(initialData?.title || "");
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

        if (!isEdit && !file) {
            setMessage("กรุณาเลือกไฟล์ PDF");
            return;
        }

        setLoading(true);
        setMessage("");

        try {
            const formData = new FormData();
            formData.append("title", title);

            if (file) {
                formData.append("file", file);
            }

            if (isEdit) {
                await api.post(`/api/knowledges/${initialData!.id}?_method=PUT`, formData);
            } else {
                formData.append("file", file!);
                await api.post("/api/knowledges", formData);
            }

            setMessage(isEdit ? "อัปเดตสำเร็จ 🎉" : "อัปโหลดสำเร็จ 🎉");

            setTimeout(() => {
                onSuccess();
                onClose();
            }, 1000);
        } catch (err: unknown) {
            const message = err && typeof err === "object" && "response" in err
                ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                : undefined;

            setMessage(message || "บันทึกไม่สำเร็จ ‼️");
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

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
            <div className="page-surface relative max-h-[90vh] w-full max-w-2xl overflow-y-auto p-5 sm:p-6">
                <button
                    onClick={onClose}
                    className="icon-button absolute right-3 top-3 text-slate-400 hover:text-red-600"
                >
                    ✕
                </button>

                <div className="mb-5 border-b border-slate-100 pb-4 pr-10">
                    <h3 className="mt-1 text-xl font-bold text-slate-950">
                        {isEdit ? "แก้ไขสาระความรู้" : "อัปโหลดสาระความรู้ (PDF)"}
                    </h3>
                </div>

                {message && <div className="mb-3 rounded-2xl bg-red-50 p-3 text-sm text-red-600">{message}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        placeholder="หัวข้อ"
                        className="w-full"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />

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
                            className="btn-muted"
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary"
                        >
                            {loading ? "กำลังบันทึก..." : isEdit ? "บันทึกการแก้ไข" : "อัปโหลด"}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
