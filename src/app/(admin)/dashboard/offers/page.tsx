"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, Flame, Clock, Eye, EyeOff, Percent } from "lucide-react";
import { ActiveBadge } from "@/components/admin/shared/StatusBadge";
import { Modal } from "@/components/admin/shared/Modal";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { EmptyState } from "@/components/admin/shared/EmptyState";
import ImageUpload from "@/components/admin/shared/ImageUpload";
import { useToast } from "@/components/admin/shared/Toast";
import type { AdminOffer } from "@/types/admin";

// Mock data — مفعّلة مؤقتاً للتيست (رجّع تعليقها وشغّل الـ API بعد الانتهاء)
import { MOCK_ADMIN_OFFERS } from "@/data/admin/offers";

const USE_MOCK = false; // الموك معطّل — الواجهة متصلة بالـ API

const EMPTY: Omit<AdminOffer, "id"> & { imagePublicId?: string } = {
  title: "", subtitle: "", image: "", imagePublicId: "", price: 0, originalPrice: 0, durationMinutes: 180, sortOrder: 1, isActive: true,
};

export default function OffersAdminPage() {
  const { showToast } = useToast();
  const [offers, setOffers] = useState<AdminOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editOffer, setEditOffer] = useState<AdminOffer | null>(null);
  const [form, setForm] = useState<Omit<AdminOffer, "id"> & { imagePublicId?: string }>(EMPTY);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchOffers = useCallback(async () => {
    if (USE_MOCK) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/offers?limit=50");
      const d = await res.json();
      if (d.success) setOffers(d.data.offers);
      else showToast(d.error?.message ?? "فشل", "error");
    } catch { showToast("خطأ", "error"); }
    finally { setLoading(false); }
  }, [showToast]);

  useEffect(() => { queueMicrotask(() => { void fetchOffers(); }); }, [fetchOffers]);

  const openAdd = () => { setEditOffer(null); setForm({ ...EMPTY, sortOrder: offers.length + 1 }); setModalOpen(true); };
  const openEdit = (o: AdminOffer) => { setEditOffer(o); setForm({ title: o.title, subtitle: o.subtitle, image: o.image, imagePublicId: (o as AdminOffer & { imagePublicId?: string }).imagePublicId ?? "", price: o.price, originalPrice: o.originalPrice, durationMinutes: o.durationMinutes, sortOrder: o.sortOrder, isActive: o.isActive }); setModalOpen(true); };

  const save = async () => {
    if (!form.title.trim()) { showToast("العنوان مطلوب", "error"); return; }
    if (!form.price || form.price <= 0) { showToast("السعر مطلوب", "error"); return; }
    if (!form.image.trim()) { showToast("الصورة مطلوبة", "error"); return; }
    if (USE_MOCK) {
      if (editOffer) {
        setOffers((prev) => prev.map((o) => o.id === editOffer.id ? { ...o, ...form } : o));
        showToast("تم التحديث", "success");
      } else {
        setOffers((prev) => [...prev, { ...(form as AdminOffer), id: `ofr-${Date.now()}` }]);
        showToast("تمت الإضافة", "success");
      }
      setModalOpen(false);
      return;
    }
    setSaving(true);
    try {
      const url = editOffer ? `/api/admin/offers/${editOffer.id}` : "/api/admin/offers";
      const method = editOffer ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await res.json();
      if (d.success) { showToast(editOffer ? "تم التحديث" : "تمت الإضافة", "success"); setModalOpen(false); fetchOffers(); }
      else showToast(d.error?.message ?? "فشل", "error");
    } catch { showToast("خطأ", "error"); }
    finally { setSaving(false); }
  };

  const toggleActive = async (id: string, cur: boolean) => {
    if (USE_MOCK) {
      setOffers((prev) => prev.map((o) => o.id === id ? { ...o, isActive: !cur } : o));
      return;
    }
    await fetch(`/api/admin/offers/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !cur }) });
    fetchOffers();
  };

  const deleteOffer = async (id: string) => {
    if (USE_MOCK) {
      setOffers((prev) => prev.filter((o) => o.id !== id));
      showToast("تم الحذف", "warning");
      setDeleteId(null);
      return;
    }
    const res = await fetch(`/api/admin/offers/${id}`, { method: "DELETE" });
    const d = await res.json();
    if (d.success) { showToast("تم الحذف", "warning"); fetchOffers(); }
    setDeleteId(null);
  };

  const calcDiscount = (price: number, original: number) => original && original > price ? Math.round(((original - price) / original) * 100) : null;

  if (loading) return <div className="py-12 text-center text-sm text-[#5a4f45] animate-pulse">جاري التحميل...</div>;

  return (
    <div className="select-none space-y-4 sm:space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[18px] font-black text-[#333B2E] sm:text-[20px]">إدارة عروض التوفير والكومبو</h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#DEE3D5] px-2.5 py-0.5 text-[11px] font-bold text-[#50604D]">
              <Flame className="h-3 w-3" strokeWidth={2} /> صفحة العروض
            </span>
          </div>
          <p className="mt-1 text-[12px] font-semibold text-[#9A9C90]">عروض الكومبو التي تظهر في /offers</p>
        </div>
        <button onClick={openAdd} className="flex items-center justify-center gap-2 rounded-full bg-[#50604D] px-5 py-2.5 text-[13px] font-bold text-[#fff] transition-colors hover:bg-[#435241]">
          <Plus className="h-4 w-4" /> إضافة عرض جديد
        </button>
      </div>

      {offers.length === 0 ? (
        <EmptyState icon={Flame} title="لا توجد عروض" description="أضف عرضاً جديداً" />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {offers.map(offer => {
            const discount = calcDiscount(offer.price, offer.originalPrice);
            return (
              <div key={offer.id} className="group relative flex flex-col justify-between overflow-hidden rounded-[18px] border border-[#EDE9E0] bg-[#FBF9F6] transition-all hover:border-[#D6DCCF] hover:shadow-[0_20px_40px_-28px_rgba(38,53,43,0.4)]">
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#F1EEE7] p-2">
                  {offer.image ? <Image src={offer.image} alt={offer.title} fill className="object-contain object-center" sizes="400px" /> : <div className="flex h-full items-center justify-center text-[#B5B2A8]"><Flame className="h-10 w-10" /></div>}
                  {discount && <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-[#C25B4F] px-3 py-1 text-[11px] font-black text-[#fff]"><Percent className="h-3 w-3" /> {discount}%</span>}
                  <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-[#333B2E]/80 px-2.5 py-1 text-[10.5px] font-bold text-[#fff] backdrop-blur-md">
                    <Clock className="h-3 w-3 text-[#D9DFD2]" /> {Math.round(offer.durationMinutes / 60)} ساعات
                  </span>
                </div>
                <div className="flex flex-1 flex-col justify-between space-y-4 p-4 sm:p-5">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-[14px] font-black text-[#333B2E] transition-colors group-hover:text-[#50604D]">{offer.title}</h3>
                      <ActiveBadge active={offer.isActive} />
                    </div>
                    <p className="line-clamp-2 text-[11.5px] font-medium leading-relaxed text-[#9A9C90]">{offer.subtitle}</p>
                  </div>
                  <div className="flex items-baseline justify-between border-t border-[#F0EDE5] pt-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[17px] font-black text-[#333B2E]">{offer.price} ج.م</span>
                      {offer.originalPrice > offer.price && <span className="text-[11px] text-[#9A9C90] line-through">{offer.originalPrice} ج.م</span>}
                    </div>
                    <span className="font-mono text-[11px] text-[#B5B2A8]">#{offer.sortOrder}</span>
                  </div>
                  <div className="flex items-center gap-2 border-t border-[#F0EDE5] pt-2">
                    <button onClick={() => toggleActive(offer.id, offer.isActive)} className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#F4F2EE] py-2 text-[11px] font-bold text-[#6B7264] transition-colors hover:bg-[#EDEAE1] hover:text-[#333B2E]">
                      {offer.isActive ? <><EyeOff className="h-3.5 w-3.5 text-[#C08A2E]" /> إيقاف</> : <><Eye className="h-3.5 w-3.5 text-[#4F8A57]" /> تفعيل</>}
                    </button>
                    <button onClick={() => openEdit(offer)} className="flex items-center gap-1.5 rounded-full bg-[#F4F2EE] px-3 py-2 text-[11px] font-bold text-[#6B7264] transition-colors hover:bg-[#EDEAE1] hover:text-[#50604D]">
                      <Pencil className="h-3.5 w-3.5" /> تعديل
                    </button>
                    <button onClick={() => setDeleteId(offer.id)} className="flex items-center rounded-full bg-[#F4F2EE] p-2 text-[#6B7264] transition-colors hover:bg-[#FBE4E0] hover:text-[#C25B4F]">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editOffer ? "تعديل العرض" : "إضافة عرض جديد"}>
        <div className="space-y-4">
          {[{ label: "عنوان العرض *", key: "title", ph: "كومبو روزماري" }, { label: "محتويات العرض *", key: "subtitle", ph: "بيتزا + كريب + مشروب" }].map(({ label, key, ph }) => (
            <div key={key}>
              <label className="mb-1.5 block text-xs font-bold text-[#8F9186]">{label}</label>
              {key === "subtitle" ? (
                <textarea rows={2} value={(form as Record<string, unknown>)[key] as string} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} placeholder={ph}
                  className="w-full resize-none rounded-[12px] border border-[#E9E5DA] bg-[#F7F4EE] p-3 text-[13px] text-[#333B2E] placeholder-[#B0B1A6] focus:border-[#B9C4AF] focus:outline-none focus:ring-2 focus:ring-[#96A78F]/20" />
              ) : (
                <input type="text" value={(form as Record<string, unknown>)[key] as string} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} placeholder={ph}
                  className="w-full rounded-[12px] border border-[#E9E5DA] bg-[#F7F4EE] px-3.5 py-2.5 text-[13px] text-[#333B2E] placeholder-[#B0B1A6] focus:border-[#B9C4AF] focus:outline-none focus:ring-2 focus:ring-[#96A78F]/20" />
              )}
            </div>
          ))}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#8F9186]">سعر العرض *</label>
              <input type="number" value={form.price || ""} onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) || 0 }))} min={1}
                className="w-full rounded-[12px] border border-[#E9E5DA] bg-[#F7F4EE] px-3.5 py-2.5 text-[13px] text-[#333B2E] focus:border-[#B9C4AF] focus:outline-none focus:ring-2 focus:ring-[#96A78F]/20" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#8F9186]">السعر الأصلي</label>
              <input type="number" value={form.originalPrice || ""} onChange={e => setForm(p => ({ ...p, originalPrice: Number(e.target.value) || 0 }))} min={0}
                className="w-full rounded-[12px] border border-[#E9E5DA] bg-[#F7F4EE] px-3.5 py-2.5 text-[13px] text-[#333B2E] focus:border-[#B9C4AF] focus:outline-none focus:ring-2 focus:ring-[#96A78F]/20" />
            </div>
          </div>
          <ImageUpload value={form.image}
            onChange={img => setForm(p => ({ ...p, image: img }))}
            onPublicIdChange={pid => setForm(p => ({ ...p, imagePublicId: pid }))}
            label="صورة العرض *" folder="rozmaly/offers" previewClassName="aspect-[16/9]" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#8F9186]">المدة (دقيقة)</label>
              <input type="number" value={form.durationMinutes} onChange={e => setForm(p => ({ ...p, durationMinutes: Number(e.target.value) || 60 }))} min={10}
                className="w-full rounded-[12px] border border-[#E9E5DA] bg-[#F7F4EE] px-3.5 py-2.5 text-[13px] text-[#333B2E] focus:border-[#B9C4AF] focus:outline-none focus:ring-2 focus:ring-[#96A78F]/20" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#8F9186]">الترتيب</label>
              <input type="number" value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: Number(e.target.value) || 1 }))} min={1}
                className="w-full rounded-[12px] border border-[#E9E5DA] bg-[#F7F4EE] px-3.5 py-2.5 text-[13px] text-[#333B2E] focus:border-[#B9C4AF] focus:outline-none focus:ring-2 focus:ring-[#96A78F]/20" />
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-[#6B7264]">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="h-4 w-4 rounded accent-[#50604D]" />
            تفعيل العرض فوراً
          </label>
          <div className="flex justify-end gap-2.5 border-t border-[#F0EDE5] pt-4">
            <button onClick={() => setModalOpen(false)} className="rounded-full bg-[#F0EDE5] px-4 py-2.5 text-[12px] font-bold text-[#50604D] transition-colors hover:bg-[#E7E3D8]">إلغاء</button>
            <button onClick={save} disabled={saving} className="rounded-full bg-[#50604D] px-5 py-2.5 text-[12px] font-bold text-[#fff] transition-colors hover:bg-[#435241] disabled:opacity-70">
              {saving ? "جاري..." : editOffer ? "حفظ" : "إضافة"}
            </button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteOffer(deleteId!)}
        title="حذف العرض" message="هل أنت متأكد؟" confirmText="حذف" variant="danger" />
    </div>
  );
}
