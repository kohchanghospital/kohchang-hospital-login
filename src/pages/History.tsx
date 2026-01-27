import { useState, useEffect } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import api from "../services/api";
import AdminLayout from "../layouts/Layout";


type User = { id: number; name: string; email: string };
type Props = { user: User; onLogout: () => void };

type ContentItem = {
    content_id: number;
    title: string;
    body: string;
};

export default function NewsForm({ user, onLogout }: Props) {

    const [items, setItems] = useState<ContentItem[]>([]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await api.put("/api/contents/type/history", {
            lang: "th",
            contents: items,
        });
        alert("บันทึกเรียบร้อย");
    };

    useEffect(() => {
        api.get("/api/contents/type/history?lang=th").then(res => {
            setItems(res.data);
        });
    }, []);

    return (
        <AdminLayout user={user} onLogout={onLogout}>
            <div className="bg-white rounded-xl shadow p-6">
                <div className="text-2xl font-bold">จัดการประวัติ</div>
                <div className="flex justify-center">
                    <form onSubmit={handleSubmit}>
                        {items.map((item, index) => (
                            <div key={item.content_id} className="mt-8 max-w-4xl">
                                <h3 className="text-xl font-bold pb-2">{item.title}</h3>
                                <CKEditor
                                    editor={ClassicEditor}
                                    data={item.body}
                                    onChange={(event, editor) => {
                                        const newItems = [...items];
                                        newItems[index].body = editor.getData();
                                        setItems(newItems);
                                    }}
                                />
                            </div>
                        ))}
                        <div className="flex justify-center">
                            <button className="mt-8 mb-3 bg-primary-600 text-white px-4 py-2 rounded">
                                บันทึก
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
