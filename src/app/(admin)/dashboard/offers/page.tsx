"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Plus,
  Pencil,
  Trash2,
  Flame,
  Clock,
  Eye,
  EyeOff,
  Percent,
} from "lucide-react";
import { ActiveBadge } from "@/components/admin/shared/StatusBadge";
import { Modal } from "@/components/admin/shared/Modal";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { EmptyState } from "@/components/admin/shared/EmptyState";
import ImageUpload from "@/components/admin/shared/ImageUpload";
import { useToast } from "@/components/admin/shared/Toast";
import { MOCK_ADMIN_OFFERS } from "@/data/admin/offers";
import { AdminOffer } from "@/types/admin";

const EMPTY: Omit<AdminOffer, "id"> = {
  title: "",
  subtitle: "",
  image: "",
  price: 0,
  originalPrice: 0,
  durationMinutes: 180,
  sortOrder: 1,
  isActive: true,
};

export default function OffersAdminPage() {
  const { showToast } = useToast();
  const [offers, setOffers] = useState<AdminOffer[]>(MOCK_ADMIN_OFFERS);
  const [modalOpen, setModalOpen] = useState(false);
  const [editOffer, setEditOffer] = useState<AdminOffer | null>(null);
  const [form, setForm] = useState<Omit<AdminOffer, "id">>(EMPTY);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openAdd = () => {
    setEditOffer(null);
    setForm({
      ...EMPTY,
      sortOrder: offers.length + 1,
    });
    setModalOpen(true);
  };

  const openEdit = (offer: AdminOffer) => {
    setEditOffer(offer);
    setForm({
      title: offer.title,
      subtitle: offer.subtitle,
      image: offer.image,
      price: offer.price,
      originalPrice: offer.originalPrice,
      durationMinutes: offer.durationMinutes,
      sortOrder: offer.sortOrder,
      isActive: offer.isActive,
    });
    setModalOpen(true);
  };

  const save = () => {
    if (!form.title.trim()) {
      showToast("عنوان العرض مطلوب", "error");
      return;
    }
    if (!form.price || form.price <= 0) {
      showToast("يرجى إدخال سعر صحيح للعرض", "error");
      return;
    }
    if (!form.image.trim()) {
      showToast("صورة العرض مطلوبة", "error");
      return;
    }

    if (editOffer) {
      setOffers((prev) =>
        prev.map((o) => (o.id === editOffer.id ? { ...o, ...form } : o))
      );
      showToast("تم تحديث العرض بنجاح", "success");
    } else {
      const newOffer: AdminOffer = {
        ...form,
        id: `deal-${Date.now()}`,
        createdAt: new Date().toISOString().split("T")[0],
      };
      setOffers((prev) => [newOffer, ...prev]);
      showToast("تمت إضافة العرض الجديد بنجاح", "success");
    }
    setModalOpen(false);
  };

  const toggleActive = (id: string) => {
    setOffers((prev) =>
      prev.map((o) => (o.id === id ? { ...o, isActive: !o.isActive } : o))
    );
    showToast("تم تغيير حالة تفعيل العرض", "warning");
  };

  const deleteOffer = (id: string) => {
    setOffers((prev) => prev.filter((o) => o.id !== id));
    showToast("تم حذف العرض", "warning");
    setDeleteId(null);
  };

  // احتساب نسبة الخصم
  const calcDiscount = (price: number, original: number) => {
    if (!original || original <= price) return null;
    return Math.round(((original - price) / original) * 100);
  };

  return (
    <div className="space-y-6 select-none">
      {/* رأس الصفحة والمقدمة */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-white">
              إدارة عروض التوفير والكومبو
            </h1>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#ff7a00]/15 border border-[#ff7a00]/30 px-2.5 py-0.5 text-xs font-bold text-[#ff9838]">
              <Flame className="h-3 w-3 text-[#ff7a00]" />
              <span>صفحة العروض</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#8a8076] mt-1">
            إضافة وتعديل عروض الكومبو والتوفير التي تظهر للعملاء في صفحة العروض الخاصة (/offers)
          </p>
        </div>

        <button
          onClick={openAdd}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff7a00] to-[#e66e00] hover:scale-105 active:scale-95 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#ff7a00]/20 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>إضافة عرض جديد</span>
        </button>
      </div>

      {/* قائمة العروض */}
      {offers.length === 0 ? (
        <EmptyState
          icon={Flame}
          title="لا توجد عروض ترويجية حالياً"
          description="اضغط على زر 'إضافة عرض جديد' لنشر أول عرض في صفحة عروض روزماري."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {offers.map((offer) => {
            const discount = calcDiscount(offer.price, offer.originalPrice);

            return (
              <div
                key={offer.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-[#141210] border border-[#26201a] transition-all duration-300 hover:border-[#ff7a00]/50 hover:shadow-2xl hover:shadow-black/70"
              >
                {/* الجزء العلوي: صورة العرض مع شارة الخصم والمدة */}
                <div className="relative aspect-[16/9] w-full bg-[#1a1512] overflow-hidden p-2">
                  {offer.image ? (
                    <Image
                      src={offer.image} unoptimized={offer.image.startsWith("data:")}
                      alt={offer.title}
                      fill
                      className="object-contain object-center"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-[#5a4f45]">
                      <Flame className="h-10 w-10" />
                    </div>
                  )}

                  {/* شارة الخصم */}
                  {discount && (
                    <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-red-600 to-[#ff7a00] px-3 py-1 text-xs font-black text-white shadow-lg border border-white/20">
                      <Percent className="h-3 w-3" />
                      <span>خصم {discount}%</span>
                    </span>
                  )}

                  {/* شارة المدة */}
                  <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-full bg-black/70 backdrop-blur-md px-2.5 py-1 text-[11px] font-bold text-white border border-white/15">
                    <Clock className="h-3 w-3 text-[#ff7a00]" />
                    <span>{Math.round(offer.durationMinutes / 60)} ساعات</span>
                  </span>
                </div>

                {/* المحتوى والبيانات */}
                <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-bold text-white group-hover:text-[#ff7a00] transition-colors leading-tight">
                        {offer.title}
                      </h3>
                      <ActiveBadge active={offer.isActive} />
                    </div>

                    <p className="text-xs text-[#8a8076] leading-relaxed line-clamp-2">
                      {offer.subtitle}
                    </p>
                  </div>

                  {/* الأسعار */}
                  <div className="flex items-baseline justify-between pt-2 border-t border-[#1f1915]">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-[#ff7a00]">
                        {offer.price} ج.م
                      </span>
                      {offer.originalPrice > offer.price && (
                        <span className="text-xs text-[#736a61] line-through font-medium">
                          {offer.originalPrice} ج.م
                        </span>
                      )}
                    </div>

                    <span className="text-[11px] font-mono text-[#5a4f45]">
                      ترتيب #{offer.sortOrder}
                    </span>
                  </div>

                  {/* أزرار التحكم */}
                  <div className="flex items-center gap-2 pt-2 border-t border-[#1f1915]">
                    <button
                      onClick={() => toggleActive(offer.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#1c1714] border border-[#2a231d] py-2 text-xs font-bold text-[#8a8076] hover:text-white transition-colors"
                    >
                      {offer.isActive ? (
                        <>
                          <EyeOff className="h-3.5 w-3.5 text-amber-400" />
                          <span>إيقاف</span>
                        </>
                      ) : (
                        <>
                          <Eye className="h-3.5 w-3.5 text-emerald-400" />
                          <span>تفعيل</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => openEdit(offer)}
                      className="flex items-center justify-center gap-1.5 rounded-xl bg-[#1c1714] border border-[#2a231d] px-3 py-2 text-xs font-bold text-[#8a8076] hover:text-[#ff7a00] transition-colors"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      <span>تعديل</span>
                    </button>

                    <button
                      onClick={() => setDeleteId(offer.id)}
                      className="flex items-center justify-center rounded-xl bg-[#1c1714] border border-[#2a231d] p-2 text-[#8a8076] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* موديل إضافة / تعديل عرض */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editOffer ? "تعديل بيانات العرض" : "إضافة عرض توفير جديد"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#8a8076] mb-1.5">
              عنوان العرض أو اسم الوجبة *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="مثال: كومبو ميكس روزماري العملاق"
              className="w-full rounded-xl bg-[#1c1714] border border-[#2a231d] px-3.5 py-2.5 text-sm text-white placeholder-[#5a4f45] focus:outline-none focus:border-[#ff7a00]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#8a8076] mb-1.5">
              محتويات وتفاصيل العرض *
            </label>
            <textarea
              rows={2}
              value={form.subtitle}
              onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))}
              placeholder="مثال: 3 ساندوتشات من اختيارك + باكت بطاطس عائلي + كريب حلو + كانز بيبسي"
              className="w-full rounded-xl bg-[#1c1714] border border-[#2a231d] p-3 text-sm text-white placeholder-[#5a4f45] focus:outline-none focus:border-[#ff7a00] resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#8a8076] mb-1.5">
                سعر العرض (ج.م) *
              </label>
              <input
                type="number"
                value={form.price || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, price: Number(e.target.value) || 0 }))
                }
                placeholder="199"
                min={1}
                className="w-full rounded-xl bg-[#1c1714] border border-[#2a231d] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff7a00]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#8a8076] mb-1.5">
                السعر الأصلي قبل الخصم (ج.م)
              </label>
              <input
                type="number"
                value={form.originalPrice || ""}
                onChange={(e) =>
                  setForm((p) => ({ ...p, originalPrice: Number(e.target.value) || 0 }))
                }
                placeholder="280"
                min={1}
                className="w-full rounded-xl bg-[#1c1714] border border-[#2a231d] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff7a00]"
              />
            </div>
          </div>

          <ImageUpload
            value={form.image}
            onChange={(image) => setForm((p) => ({ ...p, image }))}
            label="صورة العرض *"
            hint="ارفع صورة العرض كملف من جهازك — بتظهر كاملة من غير قص"
            previewClassName="aspect-[16/9]"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#8a8076] mb-1.5">
                مدة صلاحية العرض (بالدقائق)
              </label>
              <input
                type="number"
                value={form.durationMinutes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, durationMinutes: Number(e.target.value) || 60 }))
                }
                placeholder="180 (3 ساعات)"
                min={10}
                className="w-full rounded-xl bg-[#1c1714] border border-[#2a231d] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff7a00]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#8a8076] mb-1.5">
                ترتيب العرض
              </label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(e) =>
                  setForm((p) => ({ ...p, sortOrder: Number(e.target.value) || 1 }))
                }
                min={1}
                className="w-full rounded-xl bg-[#1c1714] border border-[#2a231d] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff7a00]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-white">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                className="rounded border-[#2a231d] bg-[#1c1714] text-[#ff7a00] focus:ring-[#ff7a00]"
              />
              <span>تفعيل العرض فوراً في صفحة العروض</span>
            </label>
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-[#231d17]">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-xl bg-[#1f1915] border border-[#2a231d] px-4 py-2.5 text-xs font-bold text-[#8a8076] hover:text-white transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={save}
              className="rounded-xl bg-gradient-to-r from-[#ff7a00] to-[#e66e00] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#ff7a00]/20 hover:scale-105 active:scale-95 transition-all"
            >
              {editOffer ? "حفظ التعديلات" : "إضافة العرض"}
            </button>
          </div>
        </div>
      </Modal>

      {/* حوار تأكيد الحذف */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) deleteOffer(deleteId);
        }}
        title="حذف العرض الترويجي"
        message="هل أنت متأكد من حذف هذا العرض؟ لن يظهر مجدداً في صفحة العروض."
        confirmText="نعم، حذف العرض"
        variant="danger"
      />
    </div>
  );
}
