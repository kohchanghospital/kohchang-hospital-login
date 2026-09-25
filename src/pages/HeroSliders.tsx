import { useEffect, useRef, useState, type FormEvent } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import AdminLayout from '../layouts/Layout';
import api from '../services/api';

type Slide = {
  id: number; title: string | null; subtitle: string | null; alt_text: string | null;
  desktop_image: string; mobile_image: string | null; button_text: string | null; button_url: string | null;
  text_alignment: 'left' | 'center' | 'right'; overlay_enabled: boolean; display_order: number; is_active: boolean; updated_at: string;
};
type Props = { user: { id: number; name: string; email: string }; onLogout: () => void };
const endpoint = '/api/admin/hero-sliders';
const imageUrl = (path: string) => `${api.defaults.baseURL}/storage/${path}`;
const errorText = (error: unknown) => axios.isAxiosError(error)
  ? Object.values(error.response?.data?.errors || {}).flat().join(' ') || error.response?.data?.message || 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้'
  : 'ไม่สามารถบันทึกข้อมูลได้';

export default function HeroSliders(props: Props) {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<Slide | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Slide | null>(null);
  async function load() {
    setLoading(true); setError('');
    try { setSlides((await api.get(endpoint)).data.data); }
    catch (e) { setError(errorText(e)); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  async function mutate(action: () => Promise<unknown>) {
    setBusy(true);
    try { await action(); toast.success('บันทึกเรียบร้อย'); await load(); }
    catch (e) { toast.error(errorText(e)); }
    finally { setBusy(false); }
  }
  function move(index: number, delta: number) {
    const next = [...slides];
    [next[index], next[index + delta]] = [next[index + delta], next[index]];
    void mutate(() => api.post(`${endpoint}/reorder`, { ids: next.map(s => s.id) }));
  }
  return <AdminLayout {...props}>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div><p className="text-sm font-semibold text-primary-700">จัดการเว็บไซต์</p><h1 className="mt-1 text-2xl font-bold">Hero Slider</h1><p className="mt-2 text-sm text-slate-500">จัดการภาพและข้อความต้อนรับบนหน้าแรก เรียงลำดับจากบนลงล่าง</p></div>
      <button className="btn-primary" onClick={() => setEditing('new')}>＋ เพิ่มสไลด์</button>
    </div>
    {error && <div role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-red-800">{error} <button className="underline" onClick={load}>ลองอีกครั้ง</button></div>}
    <section className="page-surface page-pad" aria-busy={loading || busy}>
      {loading ? <p role="status">กำลังโหลดสไลด์…</p> : slides.length === 0 ? <div className="py-12 text-center"><h2 className="text-lg font-semibold">ยังไม่มีสไลด์</h2><p className="mt-2 text-slate-500">หน้าเว็บจะแสดงภาพต้อนรับเดิมจนกว่าจะเปิดใช้งานสไลด์</p></div> :
        <div className="space-y-4">{slides.map((slide, i) => <article key={slide.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 p-4 xl:flex-row xl:items-center">
          <img src={imageUrl(slide.desktop_image)} alt={slide.alt_text || ''} className="aspect-[16/7] w-full rounded-xl object-cover sm:w-48" loading="lazy" />
          <div className="min-w-0 flex-1"><h2 className="break-words font-semibold">{slide.title || 'สไลด์ไม่มีชื่อ'}</h2>
            <p className="mt-1 text-sm text-slate-500">ลำดับ {slide.display_order} · อัปเดต {new Date(slide.updated_at).toLocaleString('th-TH')}</p>
            <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${slide.is_active ? 'bg-primary-50 text-primary-700' : 'bg-slate-100 text-slate-600'}`}>{slide.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-muted" disabled={busy || i === 0} aria-label={`เลื่อน ${slide.title || 'สไลด์'} ขึ้น`} onClick={() => move(i, -1)}>↑</button>
            <button className="btn-muted" disabled={busy || i === slides.length - 1} aria-label={`เลื่อน ${slide.title || 'สไลด์'} ลง`} onClick={() => move(i, 1)}>↓</button>
            <button className="btn-muted" disabled={busy} onClick={() => setEditing(slide)}>แก้ไข</button>
            <button className="btn-muted" disabled={busy} onClick={() => mutate(() => api.put(`${endpoint}/${slide.id}`, { is_active: !slide.is_active }))}>{slide.is_active ? 'ปิด' : 'เปิด'}ใช้งาน</button>
            <button className="btn-muted text-red-700" disabled={busy} onClick={() => setDeleting(slide)}>ลบ</button>
          </div>
        </article>)}</div>}
    </section>
    {editing && <SlideEditor slide={editing === 'new' ? null : editing} nextOrder={Math.max(-1, ...slides.map(s => s.display_order)) + 1} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); void load(); }} />}
    {deleting && <ConfirmDelete slide={deleting} busy={busy} onClose={() => setDeleting(null)} onDelete={() => mutate(async () => { await api.delete(`${endpoint}/${deleting.id}`); setDeleting(null); })} />}
  </AdminLayout>;
}

function useDialog() {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; dialog?.showModal(); return () => dialog?.close(); }, []);
  return ref;
}
function ConfirmDelete({ slide, busy, onClose, onDelete }: { slide: Slide; busy: boolean; onClose: () => void; onDelete: () => void }) {
  const ref = useDialog();
  return <dialog ref={ref} className="hero-dialog rounded-2xl p-6" aria-labelledby="delete-title" onCancel={e => { e.preventDefault(); if (!busy) onClose(); }}>
    <h2 id="delete-title" className="text-xl font-bold">ลบสไลด์นี้หรือไม่?</h2><p className="my-4">{slide.title || 'สไลด์ไม่มีชื่อ'} — รูปภาพที่ไม่ได้ใช้จะถูกลบด้วย</p>
    <div className="flex justify-end gap-2"><button className="btn-muted" disabled={busy} onClick={onClose}>ยกเลิก</button><button className="btn-primary !bg-red-700" disabled={busy} onClick={onDelete}>ยืนยันลบ</button></div>
  </dialog>;
}
function SlideEditor({ slide, nextOrder, onClose, onSaved }: { slide: Slide | null; nextOrder: number; onClose: () => void; onSaved: () => void }) {
  const ref = useDialog();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError('');
    const data = new FormData(e.currentTarget);
    for (const key of ['desktop_image', 'mobile_image']) { const file = data.get(key); if (file instanceof File && !file.size) data.delete(key); }
    for (const key of ['overlay_enabled', 'is_active', 'remove_mobile_image']) data.set(key, data.has(key) ? '1' : '0');
    const url = String(data.get('button_url') || '').trim();
    if (url && (/[\\\s]/.test(url) || !(url.startsWith('/') && !url.startsWith('//') || /^https?:\/\//i.test(url)))) {
      setError('ลิงก์ต้องเริ่มด้วย http://, https:// หรือ / และไม่มีช่องว่าง'); return;
    }
    data.set('button_url', url);
    if (slide) data.set('_method', 'PUT');
    setBusy(true);
    try {
      for (const key of ['desktop_image', 'mobile_image']) {
        const file = data.get(key);
        if (file instanceof File && file.size) data.set(key, await optimizeImage(file, key === 'desktop_image' ? 1920 : 960));
      }
      await api.post(slide ? `${endpoint}/${slide.id}` : endpoint, data); toast.success('บันทึกสไลด์เรียบร้อย'); onSaved(); }
    catch (e) { setError(errorText(e)); }
    finally { setBusy(false); }
  }
  return <dialog ref={ref} className="hero-dialog hero-editor rounded-2xl p-0" aria-labelledby="editor-title" onCancel={e => { e.preventDefault(); if (!busy) onClose(); }}>
    <form onSubmit={save}>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white p-5"><h2 id="editor-title" className="text-xl font-bold">{slide ? 'แก้ไขสไลด์' : 'เพิ่มสไลด์'}</h2><button type="button" className="btn-muted" disabled={busy} onClick={onClose} aria-label="ปิด">×</button></div>
      <fieldset disabled={busy} className="space-y-5 p-5">
        {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-800">{error}</p>}
        <p className="text-sm text-slate-500">JPG, JPEG, PNG, WebP ไม่เกิน 5 MB / ภาพ แนะนำ WebP ขนาด 1920 × 800 และมือถือ 750 × 1000 พิกเซล</p>
        <div className="grid gap-4 sm:grid-cols-2"><ImageField name="desktop_image" label="ภาพเดสก์ท็อป *" path={slide?.desktop_image} required={!slide} /><ImageField name="mobile_image" label="ภาพมือถือ (ไม่บังคับ)" path={slide?.mobile_image} /></div>
        {slide?.mobile_image && <label className="flex items-center gap-2"><input type="checkbox" name="remove_mobile_image" />นำภาพมือถือเดิมออก</label>}
        <label className="block">ข้อความอธิบายภาพ (Alt text)<input className="mt-1 w-full" name="alt_text" maxLength={255} defaultValue={slide?.alt_text || ''} /><span className="text-xs text-slate-500">เว้นว่างสำหรับภาพตกแต่งที่ไม่มีข้อมูลเพิ่มเติม</span></label>
        <label className="block">หัวข้อ<input className="mt-1 w-full" name="title" maxLength={255} defaultValue={slide?.title || ''} /></label>
        <label className="block">คำอธิบาย<textarea className="mt-1 w-full py-2" name="subtitle" rows={3} maxLength={2000} defaultValue={slide?.subtitle || ''} /></label>
        <div className="grid gap-4 sm:grid-cols-2"><label>ข้อความปุ่ม<input className="mt-1 w-full" name="button_text" maxLength={100} defaultValue={slide?.button_text || ''} /></label><label>ลิงก์ปุ่ม<input className="mt-1 w-full" name="button_url" maxLength={2048} placeholder="/th/about หรือ https://…" defaultValue={slide?.button_url || ''} /></label></div>
        <div className="grid gap-4 sm:grid-cols-2"><label>ตำแหน่งข้อความ<select className="mt-1 w-full" name="text_alignment" defaultValue={slide?.text_alignment || 'left'}><option value="left">ซ้าย</option><option value="center">กลาง</option><option value="right">ขวา</option></select></label><label>ลำดับ<input className="mt-1 w-full" name="display_order" type="number" min={0} max={100000} required defaultValue={slide?.display_order ?? nextOrder} /></label></div>
        <div className="flex flex-wrap gap-5"><label className="flex items-center gap-2"><input name="overlay_enabled" type="checkbox" defaultChecked={slide?.overlay_enabled ?? true} />เปิดไล่สีทับภาพ</label><label className="flex items-center gap-2"><input name="is_active" type="checkbox" defaultChecked={slide?.is_active ?? true} />เปิดใช้งาน</label></div>
      </fieldset>
      <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-white p-5"><button type="button" className="btn-muted" disabled={busy} onClick={onClose}>ยกเลิก</button><button className="btn-primary" disabled={busy}>{busy ? 'กำลังบันทึก…' : 'บันทึกสไลด์'}</button></div>
    </form>
  </dialog>;
}
function ImageField({ name, label, path, required }: { name: string; label: string; path?: string | null; required?: boolean }) {
  const [preview, setPreview] = useState('');
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  return <label className="block">{label}<input className="mt-2 w-full py-2 text-sm" type="file" name={name} accept="image/jpeg,image/png,image/webp" required={required} onChange={e => {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.setCustomValidity('');
    if (file && (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)) {
      e.currentTarget.setCustomValidity('กรุณาใช้ JPG, PNG หรือ WebP ไม่เกิน 5 MB'); e.currentTarget.reportValidity(); setPreview(''); return;
    }
    setPreview(file ? URL.createObjectURL(file) : '');
  }} />{(preview || path) && <img src={preview || imageUrl(path!)} alt="ตัวอย่างภาพก่อนบันทึก" className="mt-3 h-36 w-full rounded-xl bg-slate-50 object-contain" />}</label>;
}

// Resize uploaded banners before transmission; no image library is added to the bundle.
async function optimizeImage(file: File, maxWidth: number): Promise<File> {
  if (file.size > 5 * 1024 * 1024) throw new Error('Image exceeds 5 MB');
  const bitmap = await createImageBitmap(file);
  try {
    if (bitmap.width > 8000 || bitmap.height > 8000) throw new Error('Image exceeds 8000 pixels');
    const ratio = Math.min(1, maxWidth / bitmap.width, 2400 / bitmap.height);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * ratio); canvas.height = Math.round(bitmap.height * ratio);
    const context = canvas.getContext('2d');
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', .84));
    return blob && blob.type === 'image/webp' && (blob.size < file.size || ratio < 1)
      ? new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' }) : file;
  } finally { bitmap.close(); }
}
