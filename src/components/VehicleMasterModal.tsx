import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FaCheck, FaGripVertical, FaPlus, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";
import { Icons } from "../icons/Icons";
import api from "../services/api";

export type MasterItem = { id: number; label: string };
type Kind = "driver" | "vehicle";
type Props = { kind: Kind; initialItems: MasterItem[]; loading?: boolean; onItemsChange: (items: MasterItem[]) => void; onClose: () => void };

const config = {
    driver: {
        title: "จัดการพนักงานขับรถ",
        placeholder: "เพิ่มพนักงานขับรถใหม่",
        endpoint: "/api/drivers",
        field: "name",
        addSuccess: "เพิ่มพนักงานขับรถเรียบร้อย",
        editSuccess: "แก้ไขพนักงานขับรถเรียบร้อย",
        deleteSuccess: "ลบพนักงานขับรถเรียบร้อย",
        deleteQuestion: "ต้องการลบพนักงานขับรถ",
    },
    vehicle: {
        title: "จัดการทะเบียนรถ",
        placeholder: "เพิ่มทะเบียนรถใหม่",
        endpoint: "/api/vehicles",
        field: "registration_number",
        addSuccess: "เพิ่มทะเบียนรถเรียบร้อย",
        editSuccess: "แก้ไขทะเบียนรถเรียบร้อย",
        deleteSuccess: "ลบทะเบียนรถเรียบร้อย",
        deleteQuestion: "ต้องการลบทะเบียนรถ",
    },
} as const;

function apiError(error: unknown) {
    if (!error || typeof error !== "object" || !("response" in error)) return null;
    const data = (error as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } }).response?.data;
    return Object.values(data?.errors ?? {})[0]?.[0] ?? data?.message ?? null;
}

export default function VehicleMasterModal({ kind, initialItems, loading = false, onItemsChange, onClose }: Props) {
    const settings = config[kind];
    const [items, setItems] = useState(initialItems);
    const [newValue, setNewValue] = useState("");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingValue, setEditingValue] = useState("");
    const [deletingItem, setDeletingItem] = useState<MasterItem | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

    useEffect(() => setItems(initialItems), [initialItems]);

    const publish = (next: MasterItem[]) => {
        setItems(next);
        onItemsChange(next);
    };

    const add = async (event: FormEvent) => {
        event.preventDefault();
        const value = newValue.trim();
        if (!value) {
            toast.error(kind === "driver" ? "กรุณากรอกชื่อพนักงานขับรถ" : "กรุณากรอกทะเบียนรถ");
            return;
        }
        try {
            setSubmitting(true);
            const response = await api.post(settings.endpoint, { [settings.field]: value });
            const created = response.data.data;
            publish([...items, { id: created.id, label: created[settings.field] }]);
            setNewValue("");
            toast.success(settings.addSuccess);
        } catch (error) {
            toast.error(apiError(error) || "เพิ่มข้อมูลไม่สำเร็จ");
        } finally {
            setSubmitting(false);
        }
    };

    const saveEdit = async () => {
        if (editingId === null) return;
        const value = editingValue.trim();
        if (!value) {
            toast.error(kind === "driver" ? "กรุณากรอกชื่อพนักงานขับรถ" : "กรุณากรอกทะเบียนรถ");
            return;
        }
        try {
            setSubmitting(true);
            const response = await api.put(`${settings.endpoint}/${editingId}`, { [settings.field]: value });
            const updated = response.data.data;
            publish(items.map((item) => item.id === editingId ? { id: item.id, label: updated[settings.field] } : item));
            setEditingId(null);
            setEditingValue("");
            toast.success(settings.editSuccess);
        } catch (error) {
            toast.error(apiError(error) || "แก้ไขข้อมูลไม่สำเร็จ");
        } finally {
            setSubmitting(false);
        }
    };

    const editKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === "Enter") {
            event.preventDefault();
            void saveEdit();
        }
        if (event.key === "Escape") {
            setEditingId(null);
            setEditingValue("");
        }
    };

    const remove = async () => {
        if (!deletingItem) return;
        try {
            setSubmitting(true);
            await api.delete(`${settings.endpoint}/${deletingItem.id}`);
            publish(items.filter((item) => item.id !== deletingItem.id));
            setDeletingItem(null);
            toast.success(settings.deleteSuccess);
        } catch (error) {
            toast.error(apiError(error) || "ลบข้อมูลไม่สำเร็จ");
        } finally {
            setSubmitting(false);
        }
    };

    const reorder = async ({ active, over }: DragEndEvent) => {
        if (!over || active.id === over.id) return;
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        if (oldIndex < 0 || newIndex < 0) return;
        const previous = items;
        const next = arrayMove(items, oldIndex, newIndex);
        publish(next);
        try {
            const response = await api.post(`${settings.endpoint}/reorder`, { ids: next.map((item) => item.id) });
            const ordered = response.data.data.map((item: Record<string, unknown>) => ({ id: Number(item.id), label: String(item[settings.field]) }));
            publish(ordered);
        } catch (error) {
            publish(previous);
            toast.error(apiError(error) || "จัดลำดับข้อมูลไม่สำเร็จ");
        }
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/55 px-3 py-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby={`${kind}-manager-title`}>
            <div className="page-surface flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col overflow-hidden shadow-2xl">
                <div className="border-b border-slate-100 px-5 py-4 sm:px-6"><h2 id={`${kind}-manager-title`} className="text-xl font-bold text-slate-950">{settings.title}</h2></div>
                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
                    <form onSubmit={add} className="mb-4 flex gap-2">
                        <input value={newValue} onChange={(event) => setNewValue(event.target.value)} className="min-w-0 flex-1" placeholder={settings.placeholder} disabled={submitting} autoFocus />
                        <button type="submit" className="btn-primary px-3" disabled={submitting} aria-label={settings.placeholder}><FaPlus /></button>
                    </form>

                    {loading ? <div className="space-y-2" role="status" aria-live="polite" aria-busy="true"><span className="sr-only">กำลังโหลดข้อมูล</span>{Array.from({ length: 5 }).map((_, index) => <div key={index} className="flex min-h-12 items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3"><div className="h-5 w-5 animate-pulse rounded bg-slate-200" /><div className={`h-4 animate-pulse rounded bg-slate-200 ${index % 2 ? "w-2/3" : "w-4/5"}`} /><div className="ml-auto h-8 w-16 animate-pulse rounded-lg bg-slate-200" /></div>)}</div> : items.length === 0 ? <p className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-500">{kind === "driver" ? "ไม่มีข้อมูลพนักงานขับรถ" : "ไม่มีข้อมูลทะเบียนรถ"}</p> : (
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(event) => void reorder(event)}>
                            <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-2">
                                    {items.map((item) => (
                                        <SortableMasterRow key={item.id} item={item} disabled={submitting} editing={editingId === item.id} editingValue={editingValue} onEditingValue={setEditingValue} onEditKeyDown={editKeyDown} onStartEdit={() => { setEditingId(item.id); setEditingValue(item.label); }} onSaveEdit={() => void saveEdit()} onCancelEdit={() => { setEditingId(null); setEditingValue(""); }} onDelete={() => setDeletingItem(item)} />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    )}
                </div>
                <div className="flex justify-end border-t border-slate-100 bg-white px-5 py-4 sm:px-6"><button type="button" onClick={onClose} className="btn-muted" disabled={submitting}>ปิด</button></div>
            </div>

            {deletingItem && (
                <div className="fixed inset-0 z-[10010] flex items-center justify-center bg-black/50 px-4">
                    <div className="page-surface w-full max-w-sm p-6 shadow-2xl" role="alertdialog" aria-modal="true">
                        <h3 className="text-lg font-bold text-slate-950">ยืนยันการลบ</h3>
                        <p className="mt-3 text-slate-600">{settings.deleteQuestion} “{deletingItem.label}” หรือไม่?</p>
                        <div className="mt-5 flex justify-end gap-2"><button type="button" className="btn-muted" onClick={() => setDeletingItem(null)} disabled={submitting}>ยกเลิก</button><button type="button" className="inline-flex min-h-10 items-center justify-center rounded-xl bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50" onClick={() => void remove()} disabled={submitting}>{submitting ? "กำลังลบ..." : "ลบ"}</button></div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SortableMasterRow({ item, disabled, editing, editingValue, onEditingValue, onEditKeyDown, onStartEdit, onSaveEdit, onCancelEdit, onDelete }: { item: MasterItem; disabled: boolean; editing: boolean; editingValue: string; onEditingValue: (value: string) => void; onEditKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void; onStartEdit: () => void; onSaveEdit: () => void; onCancelEdit: () => void; onDelete: () => void }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id, disabled: disabled || editing });
    const style = { transform: CSS.Transform.toString(transform), transition };
    return (
        <div ref={setNodeRef} style={style} className={`flex items-center gap-2 rounded-xl border border-slate-100 bg-white p-2 shadow-sm ${isDragging ? "z-10 opacity-70 shadow-lg" : ""}`}>
            <DragHandle attributes={attributes} listeners={listeners} disabled={disabled || editing} />
            {editing ? <input value={editingValue} onChange={(event) => onEditingValue(event.target.value)} onKeyDown={onEditKeyDown} className="min-w-0 flex-1" autoFocus disabled={disabled} /> : <span className="min-w-0 flex-1 break-words px-1 text-slate-700">{item.label}</span>}
            <div className="flex shrink-0 items-center">
                {editing ? <><button type="button" className="icon-button text-green-600" onClick={onSaveEdit} disabled={disabled} aria-label="บันทึกการแก้ไข"><FaCheck /></button><button type="button" className="icon-button text-slate-500" onClick={onCancelEdit} disabled={disabled} aria-label="ยกเลิกการแก้ไข"><FaTimes /></button></> : <button type="button" className="icon-button text-amber-500 hover:bg-amber-50" onClick={onStartEdit} disabled={disabled} aria-label={`แก้ไข ${item.label}`}><Icons.Edit /></button>}
                <span className="mx-1 h-6 w-px bg-slate-200" />
                <button type="button" className="icon-button text-red-600 hover:bg-red-50" onClick={onDelete} disabled={disabled} aria-label={`ลบ ${item.label}`}><Icons.TrashAlt /></button>
            </div>
        </div>
    );
}

function DragHandle({ attributes, listeners, disabled }: { attributes: ReturnType<typeof useSortable>["attributes"]; listeners?: ReturnType<typeof useSortable>["listeners"]; disabled: boolean }) {
    return <button type="button" {...attributes} {...listeners} disabled={disabled} className="icon-button shrink-0 cursor-grab touch-none text-slate-400 active:cursor-grabbing" aria-label="ลากเพื่อจัดลำดับ"><FaGripVertical /></button>;
}
