import { type FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { FaCog } from "react-icons/fa";
import { Icons } from "../icons/Icons";
import api from "../services/api";
import VehicleMasterModal, { type MasterItem } from "./VehicleMasterModal";

export type Driver = { id: number; name: string; sort_order?: number; is_active?: boolean };
export type Vehicle = { id: number; registration_number: string; sort_order?: number; is_active?: boolean };
export type VehicleScheduleDetail = { id: number; detail_text: string; sort_order: number };
export type VehicleScheduleRecord = {
    id: number;
    schedule_date: string;
    start_time: string | null;
    end_time: string | null;
    driver_id: number;
    vehicle_id: number;
    driver: Driver;
    vehicle: Vehicle;
    title: string;
    details: VehicleScheduleDetail[];
    note: string | null;
    created_at: string;
    updated_at: string;
};

type Props = { initialData?: VehicleScheduleRecord; readOnly?: boolean; onClose: () => void; onSuccess?: () => void };
type FieldErrors = Partial<Record<"schedule_date" | "driver_id" | "vehicle_id" | "title" | "end_time", string>>;

const apiError = (error: unknown) => {
    if (!error || typeof error !== "object" || !("response" in error)) return undefined;
    const data = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response?.data;
    return Object.values(data?.errors ?? {})[0]?.[0] ?? data?.message;
};

export default function CarModal({ initialData, readOnly = false, onClose, onSuccess }: Props) {
    const [date, setDate] = useState(initialData?.schedule_date.slice(0, 10) ?? "");
    const [startTime, setStartTime] = useState(initialData?.start_time?.slice(0, 5) ?? "");
    const [endTime, setEndTime] = useState(initialData?.end_time?.slice(0, 5) ?? "");
    const [driverId, setDriverId] = useState(initialData ? String(initialData.driver_id) : "");
    const [vehicleId, setVehicleId] = useState(initialData ? String(initialData.vehicle_id) : "");
    const [title, setTitle] = useState(initialData?.title ?? "");
    const [details, setDetails] = useState(() => initialData?.details.length ? [...initialData.details].sort((a, b) => a.sort_order - b.sort_order).map((item) => item.detail_text) : [""]);
    const [note, setNote] = useState(initialData?.note ?? "");
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [mastersLoading, setMastersLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState<FieldErrors>({});
    const [manager, setManager] = useState<"driver" | "vehicle" | null>(null);
    const isEdit = Boolean(initialData) && !readOnly;

    useEffect(() => {
        let active = true;
        Promise.all([api.get("/api/drivers"), api.get("/api/vehicles")])
            .then(([driverResponse, vehicleResponse]) => {
                if (!active) return;
                setDrivers(driverResponse.data.data ?? []);
                setVehicles(vehicleResponse.data.data ?? []);
            })
            .catch(() => { if (active) toast.error("โหลดข้อมูลพนักงานขับรถและทะเบียนรถไม่สำเร็จ"); })
            .finally(() => { if (active) setMastersLoading(false); });
        return () => { active = false; };
    }, []);

    const validate = () => {
        const next: FieldErrors = {};
        if (!date) next.schedule_date = "กรุณาเลือกวันที่";
        if (!driverId) next.driver_id = "กรุณาเลือกพนักงานขับรถ";
        if (!vehicleId) next.vehicle_id = "กรุณาเลือกทะเบียนรถ";
        if (!title.trim()) next.title = "กรุณากรอกหัวข้อ";
        if (startTime && endTime && endTime < startTime) next.end_time = "เวลาสิ้นสุดต้องไม่น้อยกว่าเวลาเริ่มต้น";
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        if (!validate()) return;
        setSubmitting(true);
        const payload = { schedule_date: date, start_time: startTime || null, end_time: endTime || null, driver_id: Number(driverId), vehicle_id: Number(vehicleId), title: title.trim(), details: details.map((item) => item.trim()).filter(Boolean), note: note.trim() || null };
        try {
            if (isEdit) await api.put(`/api/vehicle-schedules/${initialData!.id}`, payload);
            else await api.post("/api/vehicle-schedules", payload);
            toast.success(isEdit ? "แก้ไขรายการใช้รถเรียบร้อย" : "เพิ่มรายการใช้รถเรียบร้อย");
            onSuccess?.();
            onClose();
        } catch (error) { toast.error(apiError(error) ?? "บันทึกรายการใช้รถไม่สำเร็จ"); }
        finally { setSubmitting(false); }
    };

    const errorText = (message?: string) => message ? <span className="text-sm text-red-600">{message}</span> : null;

    return createPortal(
        <>
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-3 py-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="car-modal-title">
            <div className="page-surface flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-7"><h3 id="car-modal-title" className="text-xl font-bold text-slate-950">{readOnly ? "รายละเอียดการใช้รถยนต์" : isEdit ? "แก้ไขแผนการใช้รถยนต์" : "เพิ่มแผนการใช้รถยนต์"}</h3><button type="button" onClick={onClose} className="icon-button text-slate-400 hover:text-red-600" aria-label="ปิด"><Icons.Times /></button></div>
                <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
                    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-7">
                        <label className="block space-y-1.5"><span className="text-sm font-semibold text-slate-700">วันที่ <span className="text-red-500">*</span></span><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full" disabled={readOnly} />{errorText(errors.schedule_date)}</label>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="space-y-1.5"><span className="text-sm font-semibold text-slate-700">เวลาเริ่มต้น</span><input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full" disabled={readOnly} /></label>
                            <label className="space-y-1.5"><span className="text-sm font-semibold text-slate-700">เวลาสิ้นสุด</span><input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full" disabled={readOnly} />{errorText(errors.end_time)}</label>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <label className="space-y-1.5">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-semibold text-slate-700">พนักงานขับรถ <span className="text-red-500">*</span></span>
                                    {!readOnly && <button
                                        type="button"
                                        onClick={() => setManager("driver")}
                                        className="icon-button cursor-pointer text-slate-500 hover:bg-primary-50 hover:text-primary-700"
                                        aria-label="จัดการพนักงานขับรถ"
                                    >
                                        <FaCog />
                                    </button>}
                                </div>
                                <select value={driverId} onChange={(e) => setDriverId(e.target.value)} className="w-full" disabled={readOnly || mastersLoading}>
                                    <option value="">{mastersLoading ? "กำลังโหลด..." : drivers.length ? "เลือกพนักงานขับรถ" : "ไม่มีข้อมูลพนักงานขับรถ"}</option>
                                    {drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.name}</option>)}
                                </select>
                                {errorText(errors.driver_id)}
                            </label>
                            <label className="space-y-1.5">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm font-semibold text-slate-700">ทะเบียนรถ <span className="text-red-500">*</span></span>
                                    {!readOnly && <button
                                        type="button"
                                        onClick={() => setManager("vehicle")}
                                        className="icon-button cursor-pointer text-slate-500 hover:bg-primary-50 hover:text-primary-700"
                                        aria-label="จัดการทะเบียนรถ"
                                    >
                                        <FaCog />
                                    </button>}
                                </div>
                                <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} className="w-full" disabled={readOnly || mastersLoading}>
                                    <option value="">{mastersLoading ? "กำลังโหลด..." : vehicles.length ? "เลือกทะเบียนรถ" : "ไม่มีข้อมูลทะเบียนรถ"}</option>
                                    {vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.registration_number}</option>)}
                                </select>
                                {errorText(errors.vehicle_id)}
                            </label>
                        </div>
                        <label className="block space-y-1.5">
                            <span className="text-sm font-semibold text-slate-700">หัวข้อ <span className="text-red-500">*</span></span>
                            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full" placeholder="หัวข้อการใช้รถยนต์" disabled={readOnly} />
                            {errorText(errors.title)}
                        </label>
                        <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                            <div className="mb-3 flex items-start justify-between gap-3">
                                <div>
                                    <h4 className="font-semibold text-slate-900">รายละเอียด</h4>
                                    {!readOnly && (
                                        <p className="text-sm text-slate-500">
                                            เพิ่มรายละเอียดเป็นข้อ ๆ ระบบจะเก็บตามลำดับนี้
                                        </p>
                                    )}
                                </div>
                                {!readOnly && (
                                    <button
                                        type="button"
                                        onClick={() => setDetails((items) => [...items, ""])}
                                        className="icon-button bg-primary-600 text-white"
                                        aria-label="เพิ่มรายละเอียด"
                                    >
                                        <Icons.PlusCircle />
                                    </button>
                                )}
                            </div>
                            {readOnly && details.every((item) => !item) ? <p className="text-sm text-slate-500">ไม่มีรายละเอียด</p> : <ol className="space-y-3">{details.map((item, index) => <li key={index} className="flex items-start gap-3"><span className="mt-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">{index + 1}</span><textarea value={item} onChange={(e) => setDetails((items) => items.map((value, i) => i === index ? e.target.value : value))} className="min-h-12 flex-1 resize-y py-2" placeholder={`รายละเอียดข้อที่ ${index + 1}`} disabled={readOnly} />{!readOnly && <button type="button" onClick={() => setDetails((items) => items.length === 1 ? [""] : items.filter((_, i) => i !== index))} className="icon-button mt-1 text-red-500 hover:bg-red-50" aria-label={`ลบรายละเอียดข้อที่ ${index + 1}`}><Icons.Minus /></button>}</li>)}</ol>}
                        </div>
                        <label className="block space-y-1.5"><span className="text-sm font-semibold text-slate-700">หมายเหตุ</span><textarea value={note} onChange={(e) => setNote(e.target.value)} className="min-h-24 w-full resize-y" placeholder="หมายเหตุ" disabled={readOnly} /></label>
                    </div>
                    <div className="flex justify-end gap-2 border-t border-slate-100 bg-white px-5 py-4 sm:px-7"><button type="button" onClick={onClose} className="btn-muted" disabled={submitting}>{readOnly ? "ปิด" : "ยกเลิก"}</button>{!readOnly && <button type="submit" className="btn-primary" disabled={submitting || mastersLoading}>{submitting ? "กำลังบันทึก..." : isEdit ? "บันทึกการแก้ไข" : "เพิ่มรายการ"}</button>}</div>
                </form>
            </div>
        </div>
        {manager === "driver" && (
            <VehicleMasterModal
                kind="driver"
                loading={mastersLoading}
                initialItems={drivers.map((driver) => ({ id: driver.id, label: driver.name }))}
                onItemsChange={(items: MasterItem[]) => {
                    setDrivers(items.map((item, index) => ({ id: item.id, name: item.label, sort_order: index + 1, is_active: true })));
                    if (driverId && !items.some((item) => String(item.id) === driverId)) setDriverId("");
                }}
                onClose={() => setManager(null)}
            />
        )}
        {manager === "vehicle" && (
            <VehicleMasterModal
                kind="vehicle"
                loading={mastersLoading}
                initialItems={vehicles.map((vehicle) => ({ id: vehicle.id, label: vehicle.registration_number }))}
                onItemsChange={(items: MasterItem[]) => {
                    setVehicles(items.map((item, index) => ({ id: item.id, registration_number: item.label, sort_order: index + 1, is_active: true })));
                    if (vehicleId && !items.some((item) => String(item.id) === vehicleId)) setVehicleId("");
                }}
                onClose={() => setManager(null)}
            />
        )}
        </>, document.body
    );
}
