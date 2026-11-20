"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, Grid3x3, GripVertical, Loader2 } from "lucide-react";
import { ActiveBadge } from "@/components/admin/shared/StatusBadge";
import { Modal } from "@/components/admin/shared/Modal";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { EmptyState } from "@/components/admin/shared/EmptyState";
import ImageUpload from "@/components/admin/shared/ImageUpload";
import { useToast } from "@/components/admin/shared/Toast";
import type { AdminCategory } from "@/types/admin";

// Mock data — مفعّلة مؤقتاً للتيست (رجّع تعليقها وشغّل الـ API بعد الانتهاء)
import { MOCK_ADMIN_CATEGORIES } from "@/data/admin/categories";

const USE_MOCK = false; // الموك معطّل — الواجهة متصلة بالـ API

const EMPTY: Omit<AdminCategory, "id" | "productCount"> & { imagePublicId?: string } = {
  nameAr: "", nameEn: "", slug: "", image: "", imagePublicId: "", description: "", sortOrder: 99, isActive: true,
};

export default function CategoriesPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const loadedOnce = useRef(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCat, setEditCat] = useState<AdminCategory | null>(null);
  const [form, setForm] = useState<Omit<AdminCategory, "id" | "productCount"> & { imagePublicId?: string }>(EMPTY);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    if (USE_MOCK) { setLoading(false); loadedOnce.current = true; return; }
    if (loadedOnce.current) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch("/api/admin/categories?limit=50");
      const d = await res.json();
      if (d.success) setCategories(d.data);
      else showToast(d.error?.message ?? "فشل التحميل", "error");
    } catch { showToast("خطأ في الاتصال", "error"); }
    finally { loadedOnce.current = true; setLoading(false); setRefreshing(false); }
  }, [showToast]);

  useEffect(() => { queueMicrotask(() => { void fetchCategories(); }); }, [fetchCategories]);

  const openAdd = () => { setEditCat(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (c: AdminCategory) => {
    setEditCat(c);
    setForm({ nameAr: c.nameAr, nameEn: c.nameEn, slug: c.slug, image: c.image,
      imagePublicId: (c as AdminCategory & { imagePublicId?: string }).imagePublicId ?? "",
      description: c.description ?? "", sortOrder: c.sortOrder, isActive: c.isActive });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.nameAr.trim()) { showToast("اسم التصنيف مطلوب", "error"); return; }
    if (USE_MOCK) {
      if (editCat) {
        setCategories((prev) => prev.map((c) => c.id === editCat.id ? { ...c, ...form } : c));
        showToast("تم تحديث التصنيف", "success");
      } else {
        setCategories((prev) => [...prev, { ...(form as AdminCategory), id: `cat-${Date.now()}`, productCount: 0 }]);
        showToast("تمت الإضافة", "success");
      }
      setModalOpen(false);
      return;
    }
    setSaving(true);
    try {
      const url = editCat ? `/api/admin/categories/${editCat.id}` : "/api/admin/categories";
      const method = editCat ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await res.json();
      if (d.success) { showToast(editCat ? "تم تحديث التصنيف" : "تمت الإضافة", "success"); setModalOpen(false); fetchCategories(); }
      else showToast(d.error?.message ?? "فشل الحفظ", "error");
    } catch { showToast("خطأ", "error"); }
    finally { setSaving(false); }
  };

  const toggleActive = async (id: string, current: boolean) => {
    if (USE_MOCK) {
      setCategories((prev) => prev.map((c) => c.id === id ? { ...c, isActive: !current } : c));
      return;
    }
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "PATCH",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !current }) });
      const d = await res.json();
      if (d.success) fetchCategories();
    } catch { showToast("خطأ", "error"); }
  };

  const deleteCat = async (id: string) => {
    if (USE_MOCK) {
      setCategories((prev) => prev.filter((c) => c.id !== id));
      showToast("تم الحذف", "warning");
      return;
    }
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      const d = await res.json();
      if (d.success) { showToast("تم الحذف", "warning"); fetchCategories(); }
      else showToast(d.error?.message ?? "فشل", "error");
    } catch { showToast("خطأ", "error"); }
  };

  if (loading) return <div className="py-12 text-center text-sm text-[#5a4f45] animate-pulse">جاري التحميل...</div>;

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#9A9C90]">
          {refreshing && <><Loader2 className="h-3 w-3 animate-spin" /> تحديث</>}
        </span>
        <button onClick={openAdd} className="flex items-center gap-2 rounded-full bg-[#50604D] px-5 py-2.5 text-[13px] font-bold text-[#fff] transition-colors hover:bg-[#435241]">
          <Plus className="h-4 w-4" /> إضافة تصنيف
        </button>
      </div>
      {categories.length === 0 ? (
        <EmptyState icon={Grid3x3} title="لا توجد تصنيفات" action={<button onClick={openAdd} className="rounded-full bg-[#50604D] px-4 py-2 text-[12px] font-bold text-[#fff]">إضافة تصنيف</button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div key={cat.id} className="group overflow-hidden rounded-[18px] border border-[#EDE9E0] bg-[#FBF9F6]">
              <div className="relative h-32 bg-[#F1EEE7]">
                {cat.image ? <Image src={cat.image} alt={cat.nameAr} fill className="object-cover opacity-90 transition-opacity group-hover:opacity-100" sizes="400px" /> : <div className="flex h-full items-center justify-center text-[#B5B2A8]"><Grid3x3 className="h-8 w-8" strokeWidth={1.7} /></div>}
                <div className="absolute inset-0 bg-gradient-to-t from-[#26352B]/55 to-transparent" />
                <div className="absolute left-3 top-3"><ActiveBadge active={cat.isActive} /></div>
                <div className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-[#FBF9F6]/90 text-[#6B7264]"><GripVertical className="h-4 w-4" /></div>
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-[13.5px] font-black text-[#333B2E]">{cat.nameAr}</h3>
                    <p className="text-[11px] font-medium text-[#9A9C90]">{cat.nameEn}</p>
                  </div>
                  <span className="rounded-full bg-[#DEE3D5] px-2.5 py-0.5 text-[10.5px] font-bold text-[#50604D]">{cat.productCount} منتج</span>
                </div>
                <div className="flex items-center justify-between border-t border-[#F0EDE5] pt-2">
                  <button onClick={() => toggleActive(cat.id, cat.isActive)} className="text-[11.5px] font-bold text-[#50604D] transition-colors hover:text-[#333B2E]">{cat.isActive ? "إيقاف" : "تفعيل"}</button>
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(cat)} className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F4F2EE] text-[#6B7264] transition-colors hover:bg-[#EDEAE1] hover:text-[#50604D]"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDeleteId(cat.id)} className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F4F2EE] text-[#6B7264] transition-colors hover:bg-[#FBE4E0] hover:text-[#C25B4F]"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editCat ? "تعديل التصنيف" : "إضافة تصنيف"} size="sm">
        <div className="space-y-4">
          {[{ label: "الاسم بالعربية *", key: "nameAr", ph: "بيتزا" }, { label: "الاسم بالإنجليزية", key: "nameEn", ph: "Pizza" }, { label: "الـ Slug", key: "slug", ph: "pizza" }, { label: "وصف مختصر", key: "description", ph: "" }].map(({ label, key, ph }) => (
            <div key={key} className="space-y-1.5">
              <label className="text-xs font-bold text-[#8F9186]">{label}</label>
              <input type="text" value={(form as Record<string, unknown>)[key] as string} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} placeholder={ph}
                className="w-full rounded-[12px] border border-[#E9E5DA] bg-[#F7F4EE] px-4 py-2.5 text-[13px] text-[#333B2E] placeholder-[#B0B1A6] focus:border-[#B9C4AF] focus:outline-none focus:ring-2 focus:ring-[#96A78F]/20" />
            </div>
          ))}
          <ImageUpload value={form.image}
            onChange={img => setForm(p => ({ ...p, image: img }))}
            onPublicIdChange={pid => setForm(p => ({ ...p, imagePublicId: pid }))}
            label="صورة التصنيف" folder="rozmaly/categories" />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#8F9186]">ترتيب الظهور</label>
              <input type="number" min={1} value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: Number(e.target.value) }))}
                className="w-full rounded-[12px] border border-[#E9E5DA] bg-[#F7F4EE] px-4 py-2.5 text-[13px] text-[#333B2E] focus:border-[#B9C4AF] focus:outline-none focus:ring-2 focus:ring-[#96A78F]/20" />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="h-4 w-4 rounded accent-[#50604D]" />
                <span className="text-[13px] font-medium text-[#6B7264]">تصنيف مفعّل</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-[#F0EDE5] pt-2">
            <button onClick={() => setModalOpen(false)} className="rounded-full bg-[#F0EDE5] px-4 py-2.5 text-[12px] font-bold text-[#50604D] transition-colors hover:bg-[#E7E3D8]">إلغاء</button>
            <button onClick={save} disabled={saving} className="rounded-full bg-[#50604D] px-5 py-2.5 text-[12px] font-bold text-[#fff] transition-colors hover:bg-[#435241] disabled:opacity-70">
              {saving ? "جاري..." : editCat ? "حفظ" : "إضافة"}
            </button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { deleteCat(deleteId!); setDeleteId(null); }} message="هل أنت متأكد من حذف هذا التصنيف؟" confirmText="حذف التصنيف" />
    </div>
  );
}
