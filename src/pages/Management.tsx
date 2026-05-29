import { useState, useEffect, useRef } from "react";
import api from "../services/api";
import { Icons } from "../icons/Icons";
import AdminLayout from "../layouts/Layout";
import toast from "react-hot-toast";
import { DndContext, closestCenter, } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable, } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ManagementPageSkeleton } from "../components/SkeletonScreens";

type User = { id: number; name: string; email: string };
type Props = { user: User; onLogout: () => void };

type Executive = {
    id?: number;
    name_th: string;
    position_th: string;
    department?: { id: number; name_th: string };
    department_id: string;
    order_no: number;
    image?: File | null;
    image_path: string;
    is_active: boolean;
};

type Department = {
    id: number;
    name_th: string;
    order_no?: number;
};

type DepartmentGroup = {
    id: string;
    departmentId: number | null;
    name: string;
    items: Executive[];
    sortable: boolean;
};

function SortableItem({ id, children }: any) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            {children(listeners)} {/* 🔥 ส่ง listeners ออกไป */}
        </div>
    );
}

function SortableDepartmentSection({ id, disabled, children }: any) {
    const {
        attributes,
        listeners,
        setActivatorNodeRef,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id, disabled });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <tbody ref={setNodeRef} style={style}>
            {children({ attributes, listeners, setActivatorNodeRef })}
        </tbody>
    );
}

function SortableExecutiveRow({ id, children }: any) {
    const {
        attributes,
        listeners,
        setActivatorNodeRef,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <tr ref={setNodeRef} style={style} className="border-b bg-white">
            {children({ attributes, listeners, setActivatorNodeRef })}
        </tr>
    );
}

export default function ManagementForm({ user, onLogout }: Props) {
    const [form, setForm] = useState<Executive>({
        name_th: "",
        position_th: "",
        department_id: "",
        order_no: 1,
        image: null,
        image_path: "",
        is_active: true,
    });

    const [preview, setPreview] = useState<string | null>(null);
    const [list, setList] = useState<Executive[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);

    const [showModal, setShowModal] = useState(false);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [newDept, setNewDept] = useState("");
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingValue, setEditingValue] = useState("");
    const [deleteIndex, setDeleteIndex] = useState<number | null>(null);
    const [deleteExecutiveId, setDeleteExecutiveId] = useState<number | null>(null);
    const [executivesLoaded, setExecutivesLoaded] = useState(false);
    const [departmentsLoaded, setDepartmentsLoaded] = useState(false);

    // โหลดข้อมูล
    const fetchData = async (markLoaded = false) => {
        try {
            const res = await api.get("/api/executives");
            setList(res.data);
        } catch (err) {
            console.error("Load executives failed", err);
        } finally {
            if (markLoaded) setExecutivesLoaded(true);
        }
    };

    useEffect(() => {
        fetchData(true);
    }, []);

    const fetchDepartments = async (markLoaded = false) => {
        try {
            const res = await api.get("/api/departments");
            setDepartments(res.data);
        } catch (err) {
            console.error("Load departments failed", err);
        } finally {
            if (markLoaded) setDepartmentsLoaded(true);
        }
    };

    useEffect(() => {
        fetchDepartments(true);
    }, []);

    const sortedDepartments = [...departments].sort((a, b) => {
        const aOrder = a.order_no ?? departments.indexOf(a) + 1;
        const bOrder = b.order_no ?? departments.indexOf(b) + 1;

        return aOrder - bOrder;
    });

    const grouped: DepartmentGroup[] = (() => {
        const byDepartment = new Map<string, Executive[]>();

        [...list]
            .sort((a, b) => (a.order_no ?? 0) - (b.order_no ?? 0))
            .forEach((item) => {
                const departmentKey = String(item.department?.id ?? item.department_id ?? "none");
                const items = byDepartment.get(departmentKey) ?? [];

                items.push(item);
                byDepartment.set(departmentKey, items);
            });

        const departmentGroups = sortedDepartments.map((department) => {
            const key = String(department.id);
            const items = byDepartment.get(key) ?? [];

            byDepartment.delete(key);

            return {
                id: `department-${department.id}`,
                departmentId: department.id,
                name: department.name_th,
                items,
                sortable: true,
            };
        });

        const extraGroups = Array.from(byDepartment.entries()).map(([key, items]) => ({
            id: `department-extra-${key}`,
            departmentId: null,
            name: items[0]?.department?.name_th || "ไม่มีฝ่าย",
            items,
            sortable: false,
        }));

        return [...departmentGroups, ...extraGroups].filter((group) => group.items.length > 0 || group.sortable);
    })();

    const handleAddDept = async () => {
        if (!newDept.trim()) {
            toast.error("กรุณากรอกชื่อฝ่าย ❌");
            return;
        }

        // 🔥 loading toast
        const loading = toast.loading("กำลังเพิ่ม...");

        try {
            const res = await api.post("/api/departments", {
                name_th: newDept,
            });

            // ✅ เพิ่มเข้า UI ทันที (optimistic-ish จาก response)
            setDepartments((prev) => [...prev, res.data]);

            setNewDept("");

            toast.success("เพิ่มสำเร็จ 🎉", { id: loading });

        } catch (err) {
            toast.error("เพิ่มไม่สำเร็จ ❌", { id: loading });
        }
    };

    // handle change
    const handleChange = (e: any) => {
        const { name, value, type, checked } = e.target;
        setForm({
            ...form,
            [name]: type === "checkbox" ? checked : value,
        });
    };

    // handle image
    const handleImage = (e: any) => {
        const file = e.target.files[0];
        if (file) {
            setForm({ ...form, image: file });
            setPreview(URL.createObjectURL(file));

            toast.success("เลือกรูปแล้ว 📸");
        }
    };

    const fileRef = useRef<HTMLInputElement | null>(null);

    // submit
    const handleSubmit = async (e: any) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append("name_th", form.name_th);
        formData.append("position_th", form.position_th);
        formData.append("department_id", form.department_id);
        formData.append("is_active", form.is_active ? "1" : "0");

        if (form.image) {
            formData.append("image", form.image);
        }

        // 🔥 loading toast
        const loading = toast.loading(
            editingId ? "กำลังอัปเดต..." : "กำลังเพิ่ม..."
        );

        try {
            if (editingId) {
                await api.post(`/api/executives/${editingId}?_method=PUT`, formData);
                toast.success("อัปเดตสำเร็จ 🎉", { id: loading });
            } else {
                await api.post("/api/executives", formData);
                toast.success("เพิ่มสำเร็จ 🎉", { id: loading });
            }
            if (fileRef.current) {
                fileRef.current.value = "";
            }

            resetForm();
            fetchData();

        } catch (err) {
            toast.error("บันทึกไม่สำเร็จ ❌", { id: loading });
        }
    };

    const resetForm = () => {
        setForm({
            name_th: "",
            position_th: "",
            department_id: "",
            order_no: 1,
            image: null,
            image_path: "",
            is_active: true,
        });
        setPreview(null);
        setEditingId(null);
    };

    const handleEdit = (item: Executive) => {
        setForm({
            ...item,
            image: null,
        });
        setPreview(
            item.image_path
                ? `http://localhost:8000/storage/${item.image_path}`
                : null
        );
        setEditingId(item.id!);
    };

    const deletingExecutive = deleteExecutiveId
        ? list.find((item) => item.id === deleteExecutiveId)
        : null;

    const handleDelete = async (id: number) => {

        const loading = toast.loading("กำลังลบ...");

        try {
            const res = await api.delete(`/api/executives/${id}`);
            const reorderedItems: Executive[] = res.data.executives ?? [];
            const reorderedIds = new Set(reorderedItems.map((item) => item.id));

            toast.success("ลบสำเร็จ 🗑️", { id: loading });

            // ✅ อัปเดต UI ทันที
            setList((prev) => [
                ...prev.filter((item) => item.id !== id && !reorderedIds.has(item.id)),
                ...reorderedItems,
            ]);
            if (editingId === id) {
                resetForm();
            }

        } catch (err) {
            toast.error("ลบไม่สำเร็จ ❌", { id: loading });
        } finally {
            setDeleteExecutiveId(null);
        }
    };

    const handleDepartmentDragEnd = async (event: any) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const activeId = String(active.id).replace("department-", "");
        const overId = String(over.id).replace("department-", "");
        const oldIndex = sortedDepartments.findIndex(d => String(d.id) === activeId);
        const newIndex = sortedDepartments.findIndex(d => String(d.id) === overId);

        if (oldIndex === -1 || newIndex === -1) return;

        const previousDepartments = departments;
        const newData = arrayMove(sortedDepartments, oldIndex, newIndex).map((department, index) => ({
            ...department,
            order_no: index + 1,
        }));

        setDepartments(newData);

        try {
            await api.post("/api/departments/reorder", {
                departments: newData.map((d, index) => ({
                    id: d.id,
                    order_no: index + 1,
                })),
            });

            toast.success("จัดลำดับสำเร็จ 🔥");
        } catch (err) {
            setDepartments(previousDepartments);
            toast.error("จัดลำดับไม่สำเร็จ ❌");
        }
    };

    const handleDeleteDepartment = async () => {
        if (deleteIndex === null) return;

        const dept = sortedDepartments[deleteIndex];
        const deptItems = list.filter((item) => Number(item.department?.id ?? item.department_id) === dept.id);
        const loading = toast.loading("กำลังลบ...");

        try {
            await api.delete(`/api/departments/${dept.id}`);

            toast.success("ลบสำเร็จ 🗑️", { id: loading });

            setDepartments((prev) =>
                prev.filter((d) => d.id !== dept.id)
            );
            setList((prev) =>
                prev.filter((item) => Number(item.department?.id ?? item.department_id) !== dept.id)
            );

            if (Number(form.department_id) === dept.id || deptItems.some((item) => item.id === editingId)) {
                resetForm();
            }
        } catch (err) {
            toast.error("ลบไม่สำเร็จ ❌", { id: loading });
        }

        setDeleteIndex(null);
    };

    const openDeleteDepartment = (departmentId: number) => {
        const index = sortedDepartments.findIndex((department) => department.id === departmentId);

        if (index !== -1) {
            setDeleteIndex(index);
        }
    };

    const handleExecutiveDragEnd = async (event: any, group: DepartmentGroup) => {
        const { active, over } = event;

        if (!over || active.id === over.id) return;

        const activeId = Number(String(active.id).replace("executive-", ""));
        const overId = Number(String(over.id).replace("executive-", ""));
        const oldIndex = group.items.findIndex((item) => item.id === activeId);
        const newIndex = group.items.findIndex((item) => item.id === overId);

        if (oldIndex === -1 || newIndex === -1) return;

        const previousList = list;
        const reorderedItems = arrayMove(group.items, oldIndex, newIndex).map((item, index) => ({
            ...item,
            order_no: index + 1,
        }));
        const reorderedIds = new Set(reorderedItems.map((item) => item.id));

        setList((prev) => {
            const remainingItems = prev.filter((item) => !reorderedIds.has(item.id));

            return [...remainingItems, ...reorderedItems];
        });

        try {
            await api.post("/api/executives/reorder", {
                executives: reorderedItems.map((item, index) => ({
                    id: item.id,
                    department_id: group.departmentId,
                    order_no: index + 1,
                })),
            });

            toast.success("จัดลำดับสำเร็จ 🔥");
        } catch (err) {
            setList(previousList);
            toast.error("จัดลำดับไม่สำเร็จ ❌");
        }
    };

    if (!executivesLoaded || !departmentsLoaded) {
        return (
            <AdminLayout user={user} onLogout={onLogout}>
                <ManagementPageSkeleton />
            </AdminLayout>
        );
    }

    return (
        <AdminLayout user={user} onLogout={onLogout}>
            <div>
                <h1 className="mb-4 text-2xl font-bold text-slate-900">คณะผู้บริหาร</h1>

                {/* FORM */}
                <form
                    onSubmit={handleSubmit}
                    className="page-surface mb-6 grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-6"
                >
                    <div>
                        <label className="block mb-1 font-bold">ชื่อ</label>
                        <input
                            name="name_th"
                            value={form.name_th}
                            onChange={handleChange}
                            placeholder="ชื่อ"
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block mb-1 font-bold">ตำแหน่ง</label>
                        <input
                            name="position_th"
                            value={form.position_th}
                            onChange={handleChange}
                            placeholder="ตำแหน่ง"
                            className="w-full"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="font-bold">ฝ่าย</label>
                            <button
                                type="button"
                                onClick={() => setShowModal(true)}
                                className="text-xl"
                            >
                                ⚙️
                            </button>
                        </div>
                        <select
                            name="department_id"
                            value={form.department_id}
                            onChange={handleChange}
                            className="w-full"
                        >
                            <option value="">กรุณาเลือกฝ่าย</option>

                            {sortedDepartments.map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.name_th}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2 pt-7 pl-3">
                        <label className="flex gap-2">
                            <input
                                type="checkbox"
                                name="is_active"
                                checked={form.is_active}
                                onChange={handleChange}
                            />
                            แสดงผล
                        </label>
                    </div>

                    <div>
                        <label className="block mb-1 font-bold">รูปภาพ</label>
                        <input
                            type="file"
                            ref={fileRef}   // 🔥 ต้องมีอันนี้
                            onChange={handleImage}
                        />
                    </div>

                    {preview && (
                        <img
                            src={preview}
                            className="w-32 h-40 object-cover rounded"
                        />
                    )}

                    <div className="col-span-2 flex gap-2">
                        <button className="btn-primary">
                            {editingId ? "อัปเดต" : "เพิ่ม"}
                        </button>

                        {editingId && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="btn-muted"
                            >
                                ยกเลิก
                            </button>
                        )}
                    </div>
                </form>

                {/* TABLE */}
                <div className="page-surface p-3 sm:p-4">
                    <div className="table-wrap">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b">
                                <th className="text-center py-2 w-40">รูป</th>
                                <th className="text-left py-2">ชื่อ</th>
                                <th className="text-left py-2">ตำแหน่ง</th>
                                <th className="text-center py-2">ฝ่าย</th>
                                <th className="text-center py-2">ลำดับ</th>
                                <th className="text-center py-2 w-24">จัดการ</th>
                            </tr>
                        </thead>

                        <DndContext
                            collisionDetection={closestCenter}
                            onDragEnd={handleDepartmentDragEnd}
                        >
                            <SortableContext
                                items={grouped.map((group) => group.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {grouped.map((group) => (
                                    <SortableDepartmentSection
                                        key={group.id}
                                        id={group.id}
                                        disabled={!group.sortable}
                                    >
                                        {({ attributes, listeners, setActivatorNodeRef }: any) => (
                                            <>
                                                {/* 🔥 หัวข้อฝ่าย */}
                                                <tr>
                                                    <td colSpan={6} className="font-bold bg-gray-100 text-left px-5 py-2">
                                                        <div className="flex items-center gap-3">
                                                            {group.sortable && (
                                                                <button
                                                                    type="button"
                                                                    ref={setActivatorNodeRef}
                                                                    {...attributes}
                                                                    {...listeners}
                                                                    className="cursor-grab active:cursor-grabbing text-gray-500"
                                                                    title="ลากเพื่อจัดลำดับฝ่าย"
                                                                >
                                                                    ☰
                                                                </button>
                                                            )}
                                                            <span className="flex-1">{group.name}</span>
                                                            {group.departmentId && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openDeleteDepartment(group.departmentId!)}
                                                                    className="ml-auto text-red-600 transition hover:text-red-700"
                                                                    title="ลบฝ่ายและรายการทั้งหมด"
                                                                >
                                                                    <Icons.TrashAlt />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* 🔥 รายการในฝ่าย */}
                                                <DndContext
                                                    collisionDetection={closestCenter}
                                                    onDragEnd={(event) => handleExecutiveDragEnd(event, group)}
                                                >
                                                    <SortableContext
                                                        items={group.items.map((item) => `executive-${item.id}`)}
                                                        strategy={verticalListSortingStrategy}
                                                    >
                                                        {group.items.map((item: any) => (
                                                            <SortableExecutiveRow key={item.id} id={`executive-${item.id}`}>
                                                                {({ attributes, listeners, setActivatorNodeRef }: any) => (
                                                                    <>
                                                                        <td className="text-center">
                                                                            <div className="flex items-center justify-center gap-3">
                                                                                <button
                                                                                    type="button"
                                                                                    ref={setActivatorNodeRef}
                                                                                    {...attributes}
                                                                                    {...listeners}
                                                                                    className="cursor-grab active:cursor-grabbing text-gray-400"
                                                                                    title="ลากเพื่อจัดลำดับรายการ"
                                                                                >
                                                                                    ☰
                                                                                </button>
                                                                                <img
                                                                                    src={`http://localhost:8000/storage/${item.image_path}`}
                                                                                    className="w-16 h-20 object-cover rounded"
                                                                                />
                                                                            </div>
                                                                        </td>
                                                                        <td className="text-left">{item.name_th}</td>
                                                                        <td className="text-left">{item.position_th}</td>
                                                                        <td className="text-center">{item.department?.name_th}</td>
                                                                        <td className="text-center">{item.order_no}</td>
                                                                        <td className="align-middle">
                                                                            <div className="flex items-center justify-center gap-2">
                                                                                <button
                                                                                    onClick={() => handleEdit(item)}
                                                                                    className="text-yellow-500"
                                                                                >
                                                                                    <Icons.Edit />
                                                                                </button>
                                                                                <span>|</span>
                                                                                <button
                                                                                    onClick={() => setDeleteExecutiveId(item.id!)}
                                                                                    className="text-red-600"
                                                                                >
                                                                                    <Icons.TrashAlt />
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                    </>
                                                                )}
                                                            </SortableExecutiveRow>
                                                        ))}
                                                    </SortableContext>
                                                </DndContext>
                                            </>
                                        )}
                                    </SortableDepartmentSection>
                                ))}
                            </SortableContext>
                        </DndContext>
                    </table>
                    </div>
                </div>
            </div>
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="page-surface max-h-[90vh] w-[calc(100%-2rem)] max-w-md overflow-y-auto p-5 sm:p-6">
                        <h2 className="text-lg font-bold mb-4">จัดการฝ่าย</h2>

                        {/* เพิ่ม */}
                        <div className="flex gap-2 mb-4">
                            <input
                                value={newDept}
                                onChange={(e) => setNewDept(e.target.value)}
                                className="w-full"
                                placeholder="เพิ่มฝ่ายใหม่"
                            />
                            <button
                                onClick={handleAddDept}
                                className="btn-primary px-3"
                            >
                                <Icons.PlusCircle />
                            </button>
                        </div>

                        {/* list */}
                        <DndContext
                            collisionDetection={closestCenter}
                            onDragEnd={handleDepartmentDragEnd}
                        >
                            <SortableContext
                                items={sortedDepartments.map((d) => d.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-2 max-h-60 overflow-auto">
                                    {sortedDepartments.map((d, i) => (
                                        <SortableItem key={d.id} id={d.id}>
                                            {(listeners: any) => (
                                                <div key={i} className="flex items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-white p-2 shadow-sm">
                                                    {/* 🔥 drag handle */}
                                                    <div
                                                        {...listeners}
                                                        className="cursor-grab active:cursor-grabbing text-gray-400"
                                                        title="ลากเพื่อจัดลำดับ"
                                                    >
                                                        ☰
                                                    </div>
                                                    {/* ถ้าอยู่ในโหมดแก้ไข */}
                                                    {editingIndex === i ? (
                                                        <input
                                                            value={editingValue}
                                                            onChange={(e) => setEditingValue(e.target.value)}
                                                            className="w-full"
                                                        />
                                                    ) : (
                                                        <span>{d.name_th}</span>
                                                    )}

                                                    <div className="flex gap-2 items-center">
                                                        {editingIndex === i ? (
                                                            <>
                                                                {/* ปุ่มบันทึก */}
                                                                <button
                                                                    onClick={async () => {
                                                                        // ✅ optimistic update
                                                                        const updated = departments.map((department) =>
                                                                            department.id === d.id
                                                                                ? { ...department, name_th: editingValue }
                                                                                : department
                                                                        );
                                                                        setDepartments(updated);

                                                                        setEditingIndex(null);
                                                                        setEditingValue("");

                                                                        const loading = toast.loading("กำลังบันทึก...");

                                                                        try {
                                                                            await api.put(`/api/departments/${d.id}`, {
                                                                                name_th: editingValue,
                                                                            });

                                                                            // ✅ success toast
                                                                            toast.success("บันทึกสำเร็จ 🎉", { id: loading });

                                                                        } catch (err) {
                                                                            // ❌ error toast
                                                                            toast.error("บันทึกไม่สำเร็จ ❌", { id: loading });

                                                                            // rollback
                                                                            fetchDepartments();
                                                                        }
                                                                    }}
                                                                    className="text-green-600"
                                                                >
                                                                    บันทึก
                                                                </button>
                                                                |{" "}
                                                                {/* ✅ ปุ่มยกเลิก */}
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingIndex(null);
                                                                        setEditingValue("");
                                                                    }}
                                                                    className="text-gray-500 text-bold text-xl"
                                                                >
                                                                    <Icons.Close />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                {/* ปุ่มแก้ไข */}
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingIndex(i);
                                                                        setEditingValue(d.name_th);
                                                                    }}
                                                                    className="text-yellow-500"
                                                                >
                                                                    <Icons.Edit />
                                                                </button>
                                                                |{" "}
                                                                {/* ปุ่มลบ */}
                                                                <button
                                                                    onClick={() => setDeleteIndex(i)}
                                                                    className="text-red-500"
                                                                >
                                                                    <Icons.TrashAlt />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </SortableItem>
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                        {/* ปิด */}
                        <div className="text-right mt-4">
                            <button
                                onClick={() => setShowModal(false)}
                                className="btn-muted"
                            >
                                ปิด
                            </button>
                        </div>
                    </div>
                </div>
            )
            }
            {
                deleteIndex !== null && (
                    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[60]">
                        <div className="page-surface w-[calc(100%-2rem)] max-w-sm p-6">
                            <h2 className="text-lg font-bold mb-4">ยืนยันการลบ</h2>

                            <p className="mb-4">
                                ต้องการลบ "{sortedDepartments[deleteIndex].name_th}" และรายการทั้งหมดในฝ่ายนี้ใช่ไหม?
                            </p>
                            <p className="mb-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700">
                                รายการย่อยที่จะถูกลบ: {list.filter((item) => Number(item.department?.id ?? item.department_id) === sortedDepartments[deleteIndex].id).length} รายการ
                            </p>

                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setDeleteIndex(null)}
                                    className="btn-muted"
                                >
                                    ยกเลิก
                                </button>

                                <button
                                    onClick={handleDeleteDepartment}
                                    className="inline-flex min-h-10 items-center justify-center rounded-xl bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700"
                                >
                                    ลบ
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            {
                deletingExecutive && (
                    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[60]">
                        <div className="page-surface w-[calc(100%-2rem)] max-w-sm p-6">
                            <h2 className="text-lg font-bold mb-4">ยืนยันการลบ</h2>

                            <p className="mb-4">
                                ต้องการลบ "{deletingExecutive.name_th}" ใช่ไหม?
                            </p>
                            <div className="mb-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700">
                                <div>ตำแหน่ง: {deletingExecutive.position_th}</div>
                                <div>ฝ่าย: {deletingExecutive.department?.name_th || "ไม่มีฝ่าย"}</div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setDeleteExecutiveId(null)}
                                    className="btn-muted"
                                >
                                    ยกเลิก
                                </button>

                                <button
                                    onClick={() => handleDelete(deletingExecutive.id!)}
                                    className="inline-flex min-h-10 items-center justify-center rounded-xl bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700"
                                >
                                    ลบ
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </AdminLayout >
    );
}
