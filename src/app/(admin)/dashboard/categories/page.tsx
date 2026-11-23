"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, Grid3x3, GripVertical, Loader2, ChevronUp, ChevronDown, Save } from "lucide-react";
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
  nameAr: "", nameEn: "", slug: "", image: "", imagePublicId: "", description: "", sortOrder: 99, isActive: true, showOnHome: true,
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
  const [dragId, setDragId] = useState<string | null>(null);
  const [savedOrder, setSavedOrder] = useState<string[]>([]);
  const [orderSaving, setOrderSaving] = useState(false);
  const orderDirty = categories.map((cat) => cat.id).join(",") !== savedOrder.join(",");

  const fetchCategories = useCallback(async () => {
    if (USE_MOCK) { setLoading(false); loadedOnce.current = true; return; }
    if (loadedOnce.current) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch("/api/admin/categories?limit=50");
      const d = await res.json();
      if (d.success) {
        setCategories(d.data);
        setSavedOrder(d.data.map((cat: AdminCategory) => cat.id));
      }
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
      description: c.description ?? "", sortOrder: c.sortOrder, isActive: c.isActive, showOnHome: c.showOnHome !== false });
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

  const moveCategory = (id: string, direction: -1 | 1) => {
    setCategories((prev) => {
      const index = prev.findIndex((cat) => cat.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(index, 1);
      next.splice(target, 0, item);
      return next;
    });
  };

  const dropOn = (targetId: string) => {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      return;
    }
    setCategories((prev) => {
      const from = prev.findIndex((cat) => cat.id === dragId);
      const to = prev.findIndex((cat) => cat.id === targetId);
      if (from < 0 || to < 0) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
    setDragId(null);
  };

  const saveOrder = async () => {
    const ids = categories.map((cat) => cat.id);
    if (USE_MOCK) {
      setSavedOrder(ids);
      showToast("تم حفظ ترتيب التصنيفات", "success");
      return;
    }
    setOrderSaving(true);
    try {
      const res = await fetch("/api/admin/categories/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const d = await res.json();
      if (d.success) {
        setSavedOrder(ids);
        showToast("تم حفظ الترتيب — الترتيب الجديد ظاهر على الموقع", "success");
      } else showToast(d.error?.message ?? "فشل حفظ الترتيب", "error");
    } catch {
      showToast("خطأ في الاتصال", "error");
    } finally {
      setOrderSaving(false);
    }
  };

  if (loading) return <div className="py-12 text-center text-sm text-[var(--color-text-muted)] animate-pulse">جاري التحميل...</div>;

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[var(--color-text-muted)]">
          {refreshing && <><Loader2 className="h-3 w-3 animate-spin" /> تحديث</>}
          {!refreshing && orderDirty && "الترتيب متغيّر — احفظه عشان يظهر على الموقع"}
        </span>
        <div className="flex items-center gap-2">
          {orderDirty && (
            <button onClick={saveOrder} disabled={orderSaving}
              className="flex items-center gap-2 rounded-full border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] px-4 py-2.5 text-[12px] font-bold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary-border)]/30 disabled:opacity-60">
              {orderSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {orderSaving ? "جاري الحفظ..." : "حفظ الترتيب"}
            </button>
          )}
          <button onClick={openAdd} className="flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-[13px] font-bold text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-primary-hover)]">
            <Plus className="h-4 w-4" /> إضافة تصنيف
          </button>
        </div>
      </div>
      {categories.length === 0 ? (
        <EmptyState icon={Grid3x3} title="لا توجد تصنيفات" action={<button onClick={openAdd} className="rounded-full bg-[var(--color-primary)] px-4 py-2 text-[12px] font-bold text-[var(--color-on-primary)]">إضافة تصنيف</button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat, index) => (
            <div
              key={cat.id}
              draggable
              onDragStart={() => setDragId(cat.id)}
              onDragEnd={() => setDragId(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => dropOn(cat.id)}
              className={`group overflow-hidden rounded-[18px] border bg-[var(--color-surface)] transition-shadow ${
                dragId === cat.id
                  ? "border-[var(--color-primary)] opacity-60 ring-2 ring-[var(--color-primary-border)]"
                  : "border-[var(--color-border)]"
              }`}
            >
              <div className="relative h-32 bg-[var(--color-surface-secondary)]">
                {cat.image ? <Image src={cat.image} alt={cat.nameAr} fill className="object-cover opacity-90 transition-opacity group-hover:opacity-100" sizes="400px" /> : <div className="flex h-full items-center justify-center text-[var(--color-text-muted)]"><Grid3x3 className="h-8 w-8" strokeWidth={1.7} /></div>}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-text-primary)]/55 to-transparent" />
                <div className="absolute left-3 top-3 flex items-center gap-1.5">
                  <ActiveBadge active={cat.isActive} />
                  {cat.showOnHome === false && (
                    <span className="rounded-full bg-[#FBF3DF] px-2 py-0.5 text-[9.5px] font-bold text-[#8A6414]">مخفي من الرئيسية</span>
                  )}
                </div>
                <div className="absolute right-3 top-3 flex items-center gap-1">
                  <span className="flex h-7 w-7 cursor-grab items-center justify-center rounded-full bg-[var(--color-surface)]/90 text-[var(--color-text-secondary)] active:cursor-grabbing" title="اسحب الكارت لتغيير ترتيبه">
                    <GripVertical className="h-4 w-4" />
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveCategory(cat.id, -1)}
                      disabled={index === 0}
                      aria-label={`تحريك ${cat.nameAr} لأعلى`}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-surface)]/90 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)] disabled:opacity-30"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveCategory(cat.id, 1)}
                      disabled={index === categories.length - 1}
                      aria-label={`تحريك ${cat.nameAr} لأسفل`}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-surface)]/90 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)] disabled:opacity-30"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </div>
              </div>
              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-[13.5px] font-black text-[var(--color-text-primary)]">{cat.nameAr}</h3>
                    <p className="text-[11px] font-medium text-[var(--color-text-muted)]">{cat.nameEn}</p>
                    <p className="mt-0.5 text-[10px] font-bold text-[var(--color-primary)]">ترتيب #{index + 1}</p>
                  </div>
                  <span className="rounded-full bg-[var(--color-primary-soft)] px-2.5 py-0.5 text-[10.5px] font-bold text-[var(--color-primary)]">{cat.productCount} منتج</span>
                </div>
                <div className="flex items-center justify-between border-t border-[var(--color-border-subtle)] pt-2">
                  <button onClick={() => toggleActive(cat.id, cat.isActive)} className="text-[11.5px] font-bold text-[var(--color-primary)] transition-colors hover:text-[var(--color-text-primary)]">{cat.isActive ? "إيقاف" : "تفعيل"}</button>
                  <div className="flex gap-1.5">
                    <button onClick={() => openEdit(cat)} className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-primary)]"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => setDeleteId(cat.id)} className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] transition-colors hover:bg-[#FBE4E0] hover:text-[#C25B4F]"><Trash2 className="h-3.5 w-3.5" /></button>
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
              <label className="text-xs font-bold text-[var(--color-text-muted)]">{label}</label>
              <input type="text" value={(form as Record<string, unknown>)[key] as string} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} placeholder={ph}
                className="w-full rounded-[12px] border border-[var(--color-control-border)] bg-[var(--color-surface-soft)] px-4 py-2.5 text-[13px] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-primary-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-border)]/20" />
            </div>
          ))}
          <ImageUpload value={form.image}
            onChange={img => setForm(p => ({ ...p, image: img }))}
            onPublicIdChange={pid => setForm(p => ({ ...p, imagePublicId: pid }))}
            label="صورة التصنيف" folder="rozmaly/categories" />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--color-text-muted)]">ترتيب الظهور</label>
              <input type="number" min={1} value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: Number(e.target.value) }))}
                className="w-full rounded-[12px] border border-[var(--color-control-border)] bg-[var(--color-surface-soft)] px-4 py-2.5 text-[13px] text-[var(--color-text-primary)] focus:border-[var(--color-primary-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-border)]/20" />
              <p className="text-[10px] leading-relaxed text-[var(--color-text-muted)]">يفضّل ضبط الترتيب من الأسهم في كروت التصنيفات — الترتيب المحفوظ هو اللي بيظهر في كل الشاشات.</p>
            </div>
            <div className="space-y-2 pt-6">
              <label className="flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="h-4 w-4 rounded accent-[var(--color-primary)]" />
                <span className="text-[13px] font-medium text-[var(--color-text-secondary)]">تصنيف مفعّل</span>
              </label>
              <label className="flex cursor-pointer items-start gap-2">
                <input type="checkbox" checked={form.showOnHome !== false} onChange={e => setForm(p => ({ ...p, showOnHome: e.target.checked }))} className="mt-0.5 h-4 w-4 rounded accent-[var(--color-primary)]" />
                <span className="text-[13px] font-medium leading-snug text-[var(--color-text-secondary)]">عرض التصنيف ومنتجاته في الصفحة الرئيسية</span>
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 border-t border-[var(--color-border-subtle)] pt-2">
            <button onClick={() => setModalOpen(false)} className="rounded-full bg-[var(--color-border-subtle)] px-4 py-2.5 text-[12px] font-bold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-border)]">إلغاء</button>
            <button onClick={save} disabled={saving} className="rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-[12px] font-bold text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-70">
              {saving ? "جاري..." : editCat ? "حفظ" : "إضافة"}
            </button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { deleteCat(deleteId!); setDeleteId(null); }} message="هل أنت متأكد من حذف هذا التصنيف؟" confirmText="حذف التصنيف" />
    </div>
  );
}
