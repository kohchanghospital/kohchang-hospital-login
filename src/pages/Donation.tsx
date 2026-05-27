import { useState, useEffect } from "react";
import { Editor } from "@tinymce/tinymce-react";
import api from "../services/api";
import AdminLayout from "../layouts/Layout";
import { EditorPageSkeleton } from "../components/SkeletonScreens";

type User = { id: number; name: string; email: string };
type Props = { user: User; onLogout: () => void };

type ContentItem = {
    content_id: number;
    title: string;
    body: string;
};

export default function Donation({ user, onLogout }: Props) {

    const [items, setItems] = useState<ContentItem[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setIsSaving(true);

            await api.put("/api/contents/type/donation", {
                lang: "th",
                contents: items,
            });

            alert("บันทึกเรียบร้อย");
        } catch {
            alert("เกิดข้อผิดพลาด");
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        setIsLoading(true);

        api.get("/api/contents/type/donation?lang=th")
            .then(res => setItems(res.data))
            .catch(error => {
                console.error("Load donation content failed", error);
            })
            .finally(() => setIsLoading(false));

    }, []);

    if (isLoading) {
        return (
            <AdminLayout user={user} onLogout={onLogout}>
                <EditorPageSkeleton />
            </AdminLayout>
        );
    }

    return (
        <AdminLayout user={user} onLogout={onLogout}>
            <div className="bg-white rounded-xl shadow p-6">

                <div className="text-2xl font-bold">
                    จัดการหน้าสมทบทุน
                </div>

                <form onSubmit={handleSubmit} className="mx-auto max-w-5xl">

                    {items.map((item, index) => (
                        <div key={item.content_id} className="mt-8">

                            <h3 className="text-xl font-bold pb-2">
                                {item.title}
                            </h3>

                            <Editor
                                apiKey="your_api_key"
                                value={item.body}
                                disabled={isSaving}
                                onEditorChange={(value) => {
                                    const newItems = [...items];
                                    newItems[index].body = value;
                                    setItems(newItems);
                                }}
                                init={{
                                    height: 250,
                                    menubar: false,
                                    invalid_elements: 'script,iframe,object,embed',
                                    plugins: [
                                        "advlist autolink lists link image charmap preview anchor",
                                        "searchreplace visualblocks code fullscreen",
                                        "insertdatetime media table help wordcount"
                                    ],
                                    toolbar:
                                        "undo redo | bold italic underline | alignleft aligncenter alignright | bullist numlist | link image | code",
                                    content_style:
                                        "body { font-family:Helvetica,Arial,sans-serif; font-size:16px }",
                                }}
                            />

                        </div>
                    ))}

                    <div className="flex justify-center">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className={`mt-8 px-6 py-2 rounded text-white 
                            ${isSaving
                                    ? "bg-gray-400"
                                    : "bg-primary-600 hover:bg-primary-700"}`}
                        >
                            {isSaving ? "กำลังบันทึก..." : "บันทึก"}
                        </button>
                    </div>

                </form>
            </div>
        </AdminLayout>
    );
}
