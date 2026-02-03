import { useState, useEffect } from "react";
import { Editor } from "@tinymce/tinymce-react";
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
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSaving(true);
            await api.put("/api/contents/type/about", {
                lang: "th",
                contents: items,
            });
            alert("บันทึกเรียบร้อย");
        } catch (error) {
            alert("เกิดข้อผิดพลาดในการบันทึก");
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        setIsLoading(true);
        api.get("/api/contents/type/about?lang=th")
            .then(res => {
                setItems(res.data);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);

    return (
        <AdminLayout user={user} onLogout={onLogout}>
            <div className="bg-white rounded-xl shadow p-6">
                <div className="text-2xl font-bold">วิสัยทัศน์ พันธกิจ ค่านิยม</div>
                <form onSubmit={handleSubmit} className="mx-auto max-w-5xl">
                    {items.map((item, index) => (
                        <div key={item.content_id} className="mt-8">
                            <h3 className="text-xl font-bold pb-2">{item.title}</h3>
                            <Editor
                                apiKey="cnb5mdtyf8l00ctwv9buaks8gkm1n81d8og9f9fvzixzqu99"
                                value={item.body}
                                disabled={isSaving}
                                onEditorChange={(newValue) => {
                                    const newItems = [...items];
                                    newItems[index].body = newValue;
                                    setItems(newItems);
                                }}
                                init={{
                                    height: 300,
                                    menubar: false,
                                    invalid_elements: 'script,iframe,object,embed',
                                    plugins: [
                                        "advlist autolink lists link image charmap preview anchor",
                                        "searchreplace visualblocks code fullscreen",
                                        "insertdatetime media table help wordcount"
                                    ],
                                    toolbar:
                                        "undo redo | formatselect | bold italic underline | \
                                            alignleft aligncenter alignright alignjustify | \
                                            bullist numlist outdent indent | link image table | code preview",
                                    content_style:
                                        "body { font-family:Helvetica,Arial,sans-serif; font-size:17px }",
                                    formats: {
                                        alignleft: { selector: 'p,h1,h2,h3', styles: { 'text-align': 'left' } },
                                        aligncenter: { selector: 'p,h1,h2,h3', styles: { 'text-align': 'center' } },
                                        alignright: { selector: 'p,h1,h2,h3', styles: { 'text-align': 'right' } },
                                        alignjustify: { selector: 'p,h1,h2,h3', styles: { 'text-align': 'justify' } }
                                    },
                                    valid_styles: {
                                        '*': 'text-align,font-size,font-weight,font-style,text-decoration,color,background-color'
                                    },
                                }}
                            />
                        </div>
                    ))}

                    {isLoading && (
                        <div className="text-gray-500 text-center">กำลังโหลด...</div>
                    )}

                    <div className="flex justify-center">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className={`mt-8 mb-3 px-4 py-2 rounded text-white 
                                    ${isSaving
                                    ? "bg-gray-400 cursor-not-allowed"
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
