import { type FormEvent, useState } from "react";
import { createPortal } from "react-dom";
import { Icons } from "../icons/Icons";
import api from "../services/api";

type Car = {
    id: number;
    date: Date | string;
    startTime: Date | string;
    endTime: Date | string;
    driver: string;
    licensePlate: string;
    title: string;
    description: string[] | string;
    note: string;
};

type CarModalProps = {
    initialData?: Car;
    onClose: () => void;
    onSuccess?: () => void;
};

const getInitialDetails = (description?: string[] | string) => {
    if (!description) return [""];

    const values = Array.isArray(description) ? description : [description];
    const details = values.flatMap((item) =>
        item
            .split(";")
            .map((detail) => detail.trim())
            .filter(Boolean)
    );

    return details.length ? details : [""];
};

const formatDateInput = (value?: Date | string) => {
    if (!value) return "";
    if (typeof value === "string") return value.slice(0, 10);

    return value.toISOString().slice(0, 10);
};

const formatTimeInput = (value?: Date | string) => {
    if (!value) return "";
    if (typeof value === "string") return value.slice(0, 5);

    return value.toTimeString().slice(0, 5);
};

export default function CarModal({ onClose, initialData, onSuccess }: CarModalProps) {
    const [title, setTitle] = useState(initialData?.title || "");
    const [descriptionItems, setDescriptionItems] = useState<string[]>(() =>
        getInitialDetails(initialData?.description)
    );
    const [note, setNote] = useState(initialData?.note || "");
    const [date, setDate] = useState(formatDateInput(initialData?.date));
    const [startTime, setStartTime] = useState(formatTimeInput(initialData?.startTime));
    const [endTime, setEndTime] = useState(formatTimeInput(initialData?.endTime));
    const [driver, setDriver] = useState(initialData?.driver || "");
    const [licensePlate, setLicensePlate] = useState(initialData?.licensePlate || "");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const isEdit = !!initialData;
    const normalizedDescription = descriptionItems
        .map((item) => item.trim())
        .filter(Boolean);

    const addDescriptionItem = () => {
        setDescriptionItems((items) => [...items, ""]);
    };

    const removeDescriptionItem = (index: number) => {
        setDescriptionItems((items) => {
            if (items.length === 1) return [""];
            return items.filter((_, itemIndex) => itemIndex !== index);
        });
    };

    const updateDescriptionItem = (index: number, value: string) => {
        setDescriptionItems((items) =>
            items.map((item, itemIndex) => (itemIndex === index ? value : item))
        );
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage("");

        try {
            const formData = new FormData();
            formData.append("title", title);
            formData.append("description", normalizedDescription.join(";"));
            formData.append("note", note);
            formData.append("date", date);
            formData.append("startTime", startTime);
            formData.append("endTime", endTime);
            formData.append("driver", driver);
            formData.append("licensePlate", licensePlate);
            if (isEdit) {
                await api.post(`/api/activities/${initialData!.id}?_method=PUT`, formData);
            } else {
                await api.post("/api/activities", formData);
            }

            setMessage(isEdit ? "อัปเดตสำเร็จ" : "อัปโหลดสำเร็จ");
            setTimeout(() => {
                onSuccess?.();
                onClose();
            }, 1000);
        } catch (err: unknown) {
            const errorMessage = err && typeof err === "object" && "response" in err
                ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
                : undefined;

            setMessage(errorMessage || "บันทึกไม่สำเร็จ");
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
            <div className="page-surface relative max-h-[90vh] w-full max-w-3xl overflow-y-auto p-5 sm:p-7">
                <button
                    type="button"
                    onClick={onClose}
                    className="icon-button absolute right-3 top-3 text-slate-400 hover:text-red-600"
                    aria-label="Close"
                >
                    <Icons.Times />
                </button>

                <div className="mb-5 border-b border-slate-100 pb-4 pr-10">
                    <h3 className="mt-1 text-xl font-bold text-slate-950">
                        {isEdit ? "แก้ไขกิจกรรม" : "เพิ่มกิจกรรม"}
                    </h3>
                </div>

                {message && (
                    <div className="mb-3 rounded-2xl bg-red-50 p-3 text-sm text-red-600">
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                        <label className="space-y-1.5">
                            <span className="text-sm font-semibold text-slate-700">วันที่</span>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full"
                                required
                            />
                        </label>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="space-y-1.5">
                            <span className="text-sm font-semibold text-slate-700">เวลา</span>
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="w-full"
                                required
                            />
                        </label>

                        <label className="space-y-1.5">
                            <span className="text-sm font-semibold text-slate-700">เวลาสิ้นสุด</span>
                            <input
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="w-full"
                                required
                            />
                        </label>
                    </div>
                    <label className="block space-y-1.5">
                        <span className="text-sm font-semibold text-slate-700">พนักงานขับรถ</span>
                        <select
                            className="w-full"
                            value={driver}
                            onChange={(e) => setDriver(e.target.value)}
                            required
                        >
                            <option value="">เลือกพนักงานขับรถ</option>
                            <option value="driver1">พนักงานขับรถ 1</option>
                            <option value="driver2">พนักงานขับรถ 2</option>
                        </select>
                    </label>

                    <label className="block space-y-1.5">
                        <span className="text-sm font-semibold text-slate-700">ทะเบียนรถ</span>
                        <select
                            className="w-full"
                            value={licensePlate}
                            onChange={(e) => setLicensePlate(e.target.value)}
                            required
                        >
                            <option value="">เลือกทะเบียนรถ</option>
                            <option value="plate1">ทะเบียนรถ 1</option>
                            <option value="plate2">ทะเบียนรถ 2</option>
                        </select>
                    </label>

                    <label className="block space-y-1.5">
                        <span className="text-sm font-semibold text-slate-700">หัวข้อ</span>
                        <input
                            type="text"
                            placeholder="หัวข้อกิจกรรม"
                            className="w-full"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </label>

                    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                        <div className="mb-3 flex items-start justify-between gap-3">
                            <div>
                                <h4 className="font-semibold text-slate-900">รายละเอียด</h4>
                                <p className="text-sm text-slate-500">
                                    เพิ่มรายละเอียดเป็นข้อ ๆ เพื่อให้อ่านง่าย
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={addDescriptionItem}
                                className="icon-button shrink-0 bg-primary-600 text-white hover:bg-primary-700"
                                title="เพิ่มรายละเอียด"
                                aria-label="เพิ่มรายละเอียด"
                            >
                                <Icons.PlusCircle />
                            </button>
                        </div>

                        <ul className="space-y-3">
                            {descriptionItems.map((item, index) => (
                                <li key={index} className="flex items-start gap-3">
                                    <span className="mt-4 h-2 w-2 shrink-0 rounded-full bg-primary-500" />
                                    <textarea
                                        value={item}
                                        onChange={(e) => updateDescriptionItem(index, e.target.value)}
                                        placeholder={`รายละเอียดข้อที่ ${index + 1}`}
                                        className="min-h-12 flex-1 resize-y py-2"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => removeDescriptionItem(index)}
                                        className="icon-button mt-1 shrink-0 text-red-500 hover:bg-red-50 hover:text-red-700"
                                        title="ลบรายละเอียด"
                                        aria-label="ลบรายละเอียด"
                                    >
                                        <Icons.Minus />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <label className="block space-y-1.5">
                        <span className="text-sm font-semibold text-slate-700">หมายเหตุ</span>
                        <textarea
                            placeholder="หมายเหตุ"
                            className="min-h-24 w-full resize-y py-2"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                        />
                    </label>

                    <div className="flex justify-end gap-2 pt-2">
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
                            {loading ? "กำลังบันทึก..." : isEdit ? "บันทึกการแก้ไข" : "เพิ่ม"}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
