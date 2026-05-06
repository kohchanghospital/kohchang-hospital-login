import React, { useState, useEffect, useRef } from "react";
import api from "../services/api";
import { Icons } from "../icons/Icons";
import AdminLayout from "../layouts/Layout";
import toast from "react-hot-toast";
import { DndContext, closestCenter, } from "@dnd-kit/core";
import { arrayMove, SortableContext, verticalListSortingStrategy, useSortable, } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
    const [departments, setDepartments] = useState<any[]>([]);
    const [newDept, setNewDept] = useState("");
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingValue, setEditingValue] = useState("");
    const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

    // โหลดข้อมูล
    const fetchData = async () => {
        const res = await api.get("/api/executives");
        setList(res.data);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const fetchDepartments = async () => {
        const res = await api.get("/api/departments");
        setDepartments(res.data);
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    const grouped = list.reduce((acc: any, item) => {
        const dept = item.department?.name_th || "ไม่มีฝ่าย";

        if (!acc[dept]) acc[dept] = [];
        acc[dept].push(item);

        return acc;
    }, {});

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

    const fileRef = useRef(null);

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

    const handleDelete = async (id: number) => {
        if (!confirm("ลบรายการนี้?")) return;

        const loading = toast.loading("กำลังลบ...");

        try {
            await api.delete(`/api/executives/${id}`);

            toast.success("ลบสำเร็จ 🗑️", { id: loading });

            // ✅ อัปเดต UI ทันที
            setList((prev) => prev.filter((item) => item.id !== id));

        } catch (err) {
            toast.error("ลบไม่สำเร็จ ❌", { id: loading });
        }
    };

    const handleDragEnd = async (event: any) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            const oldIndex = departments.findIndex(d => d.id === active.id);
            const newIndex = departments.findIndex(d => d.id === over.id);

            const newData = arrayMove(departments, oldIndex, newIndex);

            setDepartments(newData);

            // 🔥 ส่งไป backend
            await api.post("/api/departments/reorder", {
                departments: newData.map((d, index) => ({
                    id: d.id,
                    order_no: index + 1,
                })),
            });

            toast.success("จัดลำดับสำเร็จ 🔥");
        }
    };

    return (
        <AdminLayout user={user} onLogout={onLogout}>
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-4">คณะผู้บริหาร</h1>

                {/* FORM */}
                <form
                    onSubmit={handleSubmit}
                    className="bg-white p-6 rounded-2xl shadow mb-6 grid grid-cols-2 gap-4"
                >
                    <div>
                        <label className="block mb-1 font-bold">ชื่อ</label>
                        <input
                            name="name_th"
                            value={form.name_th}
                            onChange={handleChange}
                            placeholder="ชื่อ"
                            className="border p-2 rounded w-full"
                        />
                    </div>

                    <div>
                        <label className="block mb-1 font-bold">ตำแหน่ง</label>
                        <input
                            name="position_th"
                            value={form.position_th}
                            onChange={handleChange}
                            placeholder="ตำแหน่ง"
                            className="border p-2 rounded w-full"
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
                            className="border p-2 rounded w-full"
                        >
                            <option value="">กรุณาเลือกฝ่าย</option>

                            {departments.map((d) => (
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
                        <button className="bg-purple-600 text-white px-4 py-2 rounded">
                            {editingId ? "อัปเดต" : "เพิ่ม"}
                        </button>

                        {editingId && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="bg-gray-400 text-white px-4 py-2 rounded"
                            >
                                ยกเลิก
                            </button>
                        )}
                    </div>
                </form>

                {/* TABLE */}
                <div className="bg-white rounded-2xl shadow p-4">
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

                        <tbody>
                            {Object.entries(grouped).map(([dept, items]: any) => (
                                <React.Fragment key={dept}>
                                    {/* 🔥 หัวข้อฝ่าย */}
                                    <tr>
                                        <td colSpan={6} className="font-bold bg-gray-100 text-left px-5 py-2">
                                            {dept}
                                        </td>
                                    </tr>

                                    {/* 🔥 รายการในฝ่าย */}
                                    {items.map((item: any) => (
                                        <tr key={item.id} className="border-b">
                                            <td className="text-center">
                                                <img
                                                    src={`http://localhost:8000/storage/${item.image_path}`}
                                                    className="w-16 h-20 object-cover mx-auto rounded"
                                                />
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
                                                        onClick={() => handleDelete(item.id!)}
                                                        className="text-red-600"
                                                    >
                                                        <Icons.TrashAlt />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-96">
                        <h2 className="text-lg font-bold mb-4">จัดการฝ่าย</h2>

                        {/* เพิ่ม */}
                        <div className="flex gap-2 mb-4">
                            <input
                                value={newDept}
                                onChange={(e) => setNewDept(e.target.value)}
                                className="border p-2 rounded w-full"
                                placeholder="เพิ่มฝ่ายใหม่"
                            />
                            <button
                                onClick={handleAddDept}
                                className="bg-green-500 text-white px-3 rounded"
                            >
                                <Icons.PlusCircle />
                            </button>
                        </div>

                        {/* list */}
                        <DndContext
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={departments.map((d) => d.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-2 max-h-60 overflow-auto">
                                    {departments.map((d, i) => (
                                        <SortableItem key={d.id} id={d.id}>
                                            {(listeners: any) => (
                                                <div key={i} className="flex justify-between items-center border p-2 rounded gap-2">
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
                                                            className="border p-1 rounded w-full"
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
                                                                        const updated = [...departments];
                                                                        updated[i].name_th = editingValue;
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
                                className="bg-gray-500 text-white px-4 py-2 rounded"
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
                        <div className="bg-white p-6 rounded-lg w-80">
                            <h2 className="text-lg font-bold mb-4">ยืนยันการลบ</h2>

                            <p className="mb-4">
                                ต้องการลบ "{departments[deleteIndex].name_th}" ใช่ไหม?
                            </p>

                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setDeleteIndex(null)}
                                    className="bg-gray-400 text-white px-4 py-2 rounded"
                                >
                                    ยกเลิก
                                </button>

                                <button
                                    onClick={async () => {
                                        const dept = departments[deleteIndex!];

                                        if (form.department_id == dept.id) {
                                            toast.error("ไม่สามารถลบฝ่ายที่กำลังใช้งานอยู่ได้ ❌");
                                            return;
                                        }

                                        // 🔥 loading toast
                                        const loading = toast.loading("กำลังลบ...");

                                        try {
                                            await api.delete(`/api/departments/${dept.id}`);

                                            // ✅ success
                                            toast.success("ลบสำเร็จ 🗑️", { id: loading });

                                            // อัปเดต UI ทันที (ลบออกจาก list)
                                            setDepartments((prev) =>
                                                prev.filter((d) => d.id !== dept.id)
                                            );

                                        } catch (err) {
                                            // ❌ error
                                            toast.error("ลบไม่สำเร็จ ❌", { id: loading });
                                        }
                                        setDeleteIndex(null);
                                    }}
                                    className="bg-red-500 text-white px-4 py-2 rounded"
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