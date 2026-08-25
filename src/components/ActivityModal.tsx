import { type FormEvent, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { Icons } from "../icons/Icons";
import api from "../services/api";

export type ActivityDetail = { id: number; detail_text: string; sort_order: number };
export type ActivityRecord = {
    id: number;
    activity_date: string;
    start_time: string | null;
    end_time: string | null;
    title: string;
    details: ActivityDetail[];
    note: string | null;
    created_at: string;
    updated_at: string;
};

type Props = {
    initialData?: ActivityRecord;
    readOnly?: boolean;
    onClose: () => void;
    onSuccess?: () => void;
};
type FieldErrors = Partial<Record<"activity_date" | "title" | "end_time", string>>;

const apiErrorMessage = (error: unknown) => {
    if (!error || typeof error !== "object" || !("response" in error)) return undefined;
    const response = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response;
    return response?.data?.message ?? Object.values(response?.data?.errors ?? {})[0]?.[0];
};

export default function ActivityModal({ onClose, initialData, readOnly = false, onSuccess }: Props) {
    const [title, setTitle] = useState(initialData?.title ?? "");
    const [detailItems, setDetailItems] = useState<string[]>(() =>
        initialData?.details.length
            ? [...initialData.details].sort((a, b) => a.sort_order - b.sort_order).map((detail) => detail.detail_text)
            : [""]
    );
    const [note, setNote] = useState(initialData?.note ?? "");
    const [date, setDate] = useState(initialData?.activity_date?.slice(0, 10) ?? "");
    const [startTime, setStartTime] = useState(initialData?.start_time?.slice(0, 5) ?? "");
    const [endTime, setEndTime] = useState(initialData?.end_time?.slice(0, 5) ?? "");
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<FieldErrors>({});
    const isEdit = Boolean(initialData) && !readOnly;

    const validate = () => {
        const next: FieldErrors = {};
        if (!date) next.activity_date = "กรุณาเลือกวันที่";
        if (!title.trim()) next.title = "กรุณากรอกหัวข้อกิจกรรม";
        if (startTime && endTime && endTime < startTime) next.end_time = "เวลาสิ้นสุดต้องไม่น้อยกว่าเวลาเริ่มต้น";
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (!validate()) return;
        setSubmitting(true);
        const payload = {
            activity_date: date,
            start_time: startTime || null,
            end_time: endTime || null,
            title: title.trim(),
            details: detailItems.map((item) => item.trim()).filter(Boolean),
            note: note.trim() || null,
        };
        try {
            if (isEdit) await api.put(`/api/activities/${initialData!.id}`, payload);
            else await api.post("/api/activities", payload);
            toast.success(isEdit ? "แก้ไขกิจกรรมเรียบร้อย" : "เพิ่มกิจกรรมเรียบร้อย");
            onSuccess?.();
            onClose();
        } catch (error) {
            toast.error(apiErrorMessage(error) ?? "บันทึกกิจกรรมไม่สำเร็จ");
        } finally {
            setSubmitting(false);
        }
    };

    const errorText = (message?: string) => message ? <span className="text-sm text-red-600">{message}</span> : null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-3 py-4 backdrop-blur-sm sm:px-4" role="dialog" aria-modal="true" aria-labelledby="activity-modal-title">
            <div className="page-surface relative flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-7">
                    <h3 id="activity-modal-title" className="text-xl font-bold text-slate-950">{readOnly ? "รายละเอียดกิจกรรม" : isEdit ? "แก้ไขกิจกรรม" : "เพิ่มกิจกรรม"}</h3>
                    <button type="button" onClick={onClose} className="icon-button text-slate-400 hover:text-red-600" aria-label="ปิด"><Icons.Times /></button>
                </div>
                <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-7">
                        <label className="block space-y-1.5">
                            <span className="text-sm font-semibold text-slate-700">วันที่ <span className="text-red-500">*</span></span>
                            <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setErrors((old) => ({ ...old, activity_date: undefined })); }} className="w-full" disabled={readOnly} />
                            {errorText(errors.activity_date)}
                        </label>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="space-y-1.5"><span className="text-sm font-semibold text-slate-700">เวลาเริ่มต้น</span><input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full" disabled={readOnly} /></label>
                            <label className="space-y-1.5"><span className="text-sm font-semibold text-slate-700">เวลาสิ้นสุด</span><input type="time" value={endTime} onChange={(e) => { setEndTime(e.target.value); setErrors((old) => ({ ...old, end_time: undefined })); }} className="w-full" disabled={readOnly} />{errorText(errors.end_time)}</label>
                        </div>
                        <label className="block space-y-1.5">
                            <span className="text-sm font-semibold text-slate-700">หัวข้อ <span className="text-red-500">*</span></span>
                            <input type="text" placeholder="หัวข้อกิจกรรม" className="w-full" value={title} onChange={(e) => { setTitle(e.target.value); setErrors((old) => ({ ...old, title: undefined })); }} disabled={readOnly} />
                            {errorText(errors.title)}
                        </label>
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                            <div className="mb-3 flex items-start justify-between gap-3">
                                <div><h4 className="font-semibold text-slate-900">รายละเอียด</h4>{!readOnly && <p className="text-sm text-slate-500">เพิ่มรายละเอียดเป็นข้อ ๆ ระบบจะเก็บตามลำดับนี้</p>}</div>
                                {!readOnly && <button type="button" onClick={() => setDetailItems((items) => [...items, ""])} className="icon-button shrink-0 bg-primary-600 text-white hover:bg-primary-700" title="เพิ่มรายละเอียด" aria-label="เพิ่มรายละเอียด"><Icons.PlusCircle /></button>}
                            </div>
                            {readOnly && detailItems.every((item) => !item) ? <p className="text-sm text-slate-500">ไม่มีรายละเอียด</p> : (
                                <ol className="space-y-3">
                                    {detailItems.map((item, index) => (
                                        <li key={index} className="flex items-start gap-3">
                                            <span className="mt-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">{index + 1}</span>
                                            <textarea value={item} onChange={(e) => setDetailItems((items) => items.map((value, i) => i === index ? e.target.value : value))} placeholder={`รายละเอียดข้อที่ ${index + 1}`} className="min-h-12 flex-1 resize-y py-2" disabled={readOnly} />
                                            {!readOnly && <button type="button" onClick={() => setDetailItems((items) => items.length === 1 ? [""] : items.filter((_, i) => i !== index))} className="icon-button mt-1 shrink-0 text-red-500 hover:bg-red-50 hover:text-red-700" title="ลบรายละเอียด" aria-label={`ลบรายละเอียดข้อที่ ${index + 1}`}><Icons.Minus /></button>}
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </div>
                        <label className="block space-y-1.5"><span className="text-sm font-semibold text-slate-700">หมายเหตุ</span><textarea placeholder="หมายเหตุ" className="min-h-24 w-full resize-y py-2" value={note} onChange={(e) => setNote(e.target.value)} disabled={readOnly} /></label>
                    </div>
                    <div className="flex shrink-0 justify-end gap-2 border-t border-slate-100 bg-white px-5 py-4 sm:px-7">
                        <button type="button" onClick={onClose} className="btn-muted" disabled={submitting}>{readOnly ? "ปิด" : "ยกเลิก"}</button>
                        {!readOnly && <button type="submit" disabled={submitting} className="btn-primary">{submitting ? "กำลังบันทึก..." : isEdit ? "บันทึกการแก้ไข" : "เพิ่มกิจกรรม"}</button>}
                    </div>
                </form>
            </div>
        </div>, document.body
    );
}
