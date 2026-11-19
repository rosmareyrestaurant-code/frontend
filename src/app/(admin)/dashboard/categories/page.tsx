"use client";

import { useState } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, Grid3x3, GripVertical } from "lucide-react";
import { ActiveBadge } from "@/components/admin/shared/StatusBadge";
import { Modal } from "@/components/admin/shared/Modal";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { EmptyState } from "@/components/admin/shared/EmptyState";
import ImageUpload from "@/components/admin/shared/ImageUpload";
import { useToast } from "@/components/admin/shared/Toast";
import { MOCK_ADMIN_CATEGORIES } from "@/data/admin/categories";
import { AdminCategory } from "@/types/admin";

const EMPTY: Omit<AdminCategory, "id" | "productCount"> = {
  nameAr: "", nameEn: "", slug: "", image: "", description: "", sortOrder: 99, isActive: true,
};

export default function CategoriesPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<AdminCategory[]>(MOCK_ADMIN_CATEGORIES);
  const [modalOpen, setModalOpen] = useState(false);
  const [editCat, setEditCat] = useState<AdminCategory | null>(null);
  const [form, setForm] = useState<Omit<AdminCategory, "id" | "productCount">>(EMPTY);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openAdd = () => { setEditCat(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (c: AdminCategory) => {
    setEditCat(c);
    setForm({ nameAr: c.nameAr, nameEn: c.nameEn, slug: c.slug, image: c.image, description: c.description ?? "", sortOrder: c.sortOrder, isActive: c.isActive });
    setModalOpen(true);
  };

  const save = () => {
    if (!form.nameAr.trim()) { showToast("اسم التصنيف مطلوب", "error"); return; }
    if (editCat) {
      setCategories((prev) => prev.map((c) => c.id === editCat.id ? { ...c, ...form } : c));
      showToast("تم تحديث التصنيف", "success");
    } else {
      setCategories((prev) => [...prev, { ...form, id: `cat-${Date.now()}`, productCount: 0 }]);
      showToast("تمت إضافة التصنيف", "success");
    }
    setModalOpen(false);
  };

  const toggleActive = (id: string) => {
    setCategories((prev) => prev.map((c) => c.id === id ? { ...c, isActive: !c.isActive } : c));
    showToast("تم تحديث حالة التصنيف", "success");
  };

  const deleteCat = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    showToast("تم حذف التصنيف", "warning");
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <button onClick={openAdd} className="flex items-center gap-2 rounded-xl bg-[#ff7a00] hover:bg-[#e66e00] px-4 py-2.5 text-sm font-bold text-white transition-colors">
          <Plus className="h-4 w-4" /> إضافة تصنيف
        </button>
      </div>

      {categories.length === 0 ? (
        <EmptyState icon={Grid3x3} title="لا توجد تصنيفات" action={<button onClick={openAdd} className="rounded-xl bg-[#ff7a00] px-4 py-2 text-sm font-bold text-white">إضافة تصنيف</button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <div key={cat.id} className="rounded-2xl bg-[#141210] border border-[#26201a] overflow-hidden group">
              <div className="relative h-32 bg-[#1a1512]">
                {cat.image ? (
                  <Image src={cat.image} alt={cat.nameAr} fill unoptimized={cat.image.startsWith("data:")} className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" sizes="400px" />
                ) : (
                  <div className="flex h-full items-center justify-center text-[#5a4f45]"><Grid3x3 className="h-8 w-8" /></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute top-3 left-3"><ActiveBadge active={cat.isActive} /></div>
                <div className="absolute top-3 right-3 flex h-7 w-7 items-center justify-center rounded-lg bg-black/40 text-[#8a8076] cursor-grab">
                  <GripVertical className="h-4 w-4" />
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">{cat.nameAr}</h3>
                    <p className="text-xs text-[#5a4f45]">{cat.nameEn}</p>
                  </div>
                  <span className="rounded-full bg-[#ff7a00]/15 text-[#ff7a00] border border-[#ff7a00]/25 px-2 py-0.5 text-[11px] font-bold">
                    {cat.productCount} منتج
                  </span>
                </div>
                {cat.description && <p className="text-xs text-[#8a8076] line-clamp-2">{cat.description}</p>}
                <div className="flex items-center justify-between pt-2 border-t border-[#1e1914]">
                  <button onClick={() => toggleActive(cat.id)} className="text-xs text-[#8a8076] hover:text-[#ff7a00] transition-colors">
                    {cat.isActive ? "إيقاف" : "تفعيل"}
                  </button>
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(cat)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1f1915] border border-[#2a231d] text-[#8a8076] hover:text-[#ff7a00] transition-colors">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setDeleteId(cat.id)} className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#1f1915] border border-[#2a231d] text-[#8a8076] hover:text-red-400 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editCat ? "تعديل التصنيف" : "إضافة تصنيف جديد"} size="sm">
        <div className="space-y-4">
          {[
            { label: "الاسم بالعربية *", key: "nameAr", placeholder: "مثال: بيتزا" },
            { label: "الاسم بالإنجليزية", key: "nameEn", placeholder: "Pizza" },
            { label: "وصف مختصر", key: "description", placeholder: "وصف التصنيف..." },
          ].map(({ label, key, placeholder }) => (
            <div key={key} className="space-y-1.5">
              <label className="text-xs font-bold text-[#a89f94]">{label}</label>
              <input type="text" value={(form as Record<string, unknown>)[key] as string}
                onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                className="w-full rounded-xl bg-[#1a1512] border border-[#2a231d] px-4 py-2.5 text-sm text-white placeholder-[#5a4f45] focus:border-[#ff7a00] focus:outline-none" />
            </div>
          ))}
          <ImageUpload
            value={form.image}
            onChange={(image) => setForm((p) => ({ ...p, image }))}
            label="صورة التصنيف"
            hint="ارفع صورة التصنيف كملف من جهازك"
          />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#a89f94]">ترتيب الظهور</label>
              <input type="number" min={1} value={form.sortOrder}
                onChange={(e) => setForm((p) => ({ ...p, sortOrder: Number(e.target.value) }))}
                className="w-full rounded-xl bg-[#1a1512] border border-[#2a231d] px-4 py-2.5 text-sm text-white focus:border-[#ff7a00] focus:outline-none" />
            </div>
            <div className="space-y-1.5 flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} className="h-4 w-4 rounded accent-[#ff7a00]" />
                <span className="text-sm text-[#c4b9ad]">تصنيف مفعّل</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t border-[#231d17]">
            <button onClick={() => setModalOpen(false)} className="rounded-xl bg-[#1c1613] border border-[#2a231d] px-4 py-2.5 text-sm font-bold text-[#a89f94] hover:text-white">إلغاء</button>
            <button onClick={save} className="rounded-xl bg-[#ff7a00] hover:bg-[#e66e00] px-5 py-2.5 text-sm font-bold text-white">{editCat ? "حفظ" : "إضافة"}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteCat(deleteId!)}
        message="هل أنت متأكد من حذف هذا التصنيف؟" confirmText="حذف التصنيف" />
    </div>
  );
}
