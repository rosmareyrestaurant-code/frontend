"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Plus,
  Pencil,
  Trash2,
  Megaphone,
  Eye,
  EyeOff,
  Layers,
  Sparkles,
  PanelBottom,
  Sliders,
  ExternalLink,
} from "lucide-react";
import { ActiveBadge } from "@/components/admin/shared/StatusBadge";
import { Modal } from "@/components/admin/shared/Modal";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { EmptyState } from "@/components/admin/shared/EmptyState";
import ImageUpload from "@/components/admin/shared/ImageUpload";
import { useToast } from "@/components/admin/shared/Toast";
import { MOCK_ADMIN_BANNERS } from "@/data/admin/banners";
import { AdminBanner, BannerPosition } from "@/types/admin";

const POSITION_INFO: Record<
  BannerPosition,
  { label: string; icon: typeof Layers; color: string; bg: string; border: string; desc: string }
> = {
  hero: {
    label: "سلايدر الهيرو (أعلى الصفحة)",
    icon: Sliders,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/25",
    desc: "يعرض داخل السلايدر التفاعلي الدوار في مقدمة الموقع",
  },
  middle: {
    label: "بانرات منتصف الصفحة",
    icon: Sparkles,
    color: "text-[#ff7a00]",
    bg: "bg-[#ff7a00]/10",
    border: "border-[#ff7a00]/25",
    desc: "البانران الكبيران في منتصف الصفحة بين الأقسام",
  },
  delivery: {
    label: "بانر أسفل الصفحة",
    icon: PanelBottom,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/25",
    desc: "البانر الإعلاني العريض المعروض أسفل الصفحة الرئيسية قبل الفوتر",
  },
};

const EMPTY: Omit<AdminBanner, "id"> = {
  title: "",
  description: "",
  image: "",
  position: "hero",
  ctaText: "",
  ctaLink: "",
  sortOrder: 1,
  isActive: true,
};

export default function BannersPage() {
  const { showToast } = useToast();
  const [banners, setBanners] = useState<AdminBanner[]>(MOCK_ADMIN_BANNERS);
  const [activeTab, setActiveTab] = useState<"all" | BannerPosition>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editBanner, setEditBanner] = useState<AdminBanner | null>(null);
  const [form, setForm] = useState<Omit<AdminBanner, "id">>(EMPTY);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredBanners =
    activeTab === "all"
      ? banners
      : banners.filter((b) => (b.position || "hero") === activeTab);

  const openAdd = () => {
    setEditBanner(null);
    setForm({
      ...EMPTY,
      position: activeTab === "all" ? "hero" : activeTab,
      sortOrder: banners.length + 1,
    });
    setModalOpen(true);
  };

  const openEdit = (b: AdminBanner) => {
    setEditBanner(b);
    setForm({
      title: b.title,
      description: b.description ?? "",
      image: b.image,
      position: b.position || "hero",
      ctaText: b.ctaText ?? "",
      ctaLink: b.ctaLink ?? "",
      startDate: b.startDate ?? "",
      endDate: b.endDate ?? "",
      sortOrder: b.sortOrder,
      isActive: b.isActive,
    });
    setModalOpen(true);
  };

  const save = () => {
    if (!form.title.trim()) {
      showToast("عنوان البانر مطلوب", "error");
      return;
    }
    if (!form.image.trim()) {
      showToast("صورة البانر مطلوبة", "error");
      return;
    }

    if (editBanner) {
      setBanners((prev) =>
        prev.map((b) => (b.id === editBanner.id ? { ...b, ...form } : b))
      );
      showToast("تم تحديث البانر بنجاح", "success");
    } else {
      setBanners((prev) => [
        ...prev,
        { ...form, id: `ban-${Date.now()}` },
      ]);
      showToast("تمت إضافة البانر بنجاح", "success");
    }
    setModalOpen(false);
  };

  const toggleActive = (id: string) => {
    setBanners((prev) =>
      prev.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b))
    );
    showToast("تم تغيير حالة تفعيل البانر", "warning");
  };

  const deleteBanner = (id: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
    showToast("تم حذف البانر", "warning");
    setDeleteId(null);
  };

  return (
    <div className="space-y-6 select-none">
      {/* الرأس: الشرح وأزرار التصفية والإضافة */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            إدارة بانرات الموقع
          </h1>
          <p className="text-xs sm:text-sm text-[#8a8076] mt-1">
            تحكم في بنرات الصفحة الرئيسية: سلايدر الهيرو، بانرات منتصف الصفحة، وبانر أسفل الصفحة
          </p>
        </div>

        <button
          onClick={openAdd}
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff7a00] to-[#e66e00] hover:scale-105 active:scale-95 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#ff7a00]/20 transition-all"
        >
          <Plus className="h-4 w-4" />
          <span>إضافة بانر جديد</span>
        </button>
      </div>

      {/* شريط التبويبات حسب مكان ظهور البانر */}
      <div className="flex flex-wrap gap-2 border-b border-[#231d17] pb-3">
        <button
          onClick={() => setActiveTab("all")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === "all"
              ? "bg-[#ff7a00] text-white shadow-md shadow-[#ff7a00]/20"
              : "bg-[#181310] border border-[#2b221a] text-[#8a8076] hover:text-white hover:bg-[#201915]"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          <span>كل البنرات ({banners.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("hero")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === "hero"
              ? "bg-[#ff7a00] text-white shadow-md shadow-[#ff7a00]/20"
              : "bg-[#181310] border border-[#2b221a] text-[#8a8076] hover:text-white hover:bg-[#201915]"
          }`}
        >
          <Sliders className="h-3.5 w-3.5" />
          <span>
            سلايدر الهيرو ({banners.filter((b) => (b.position || "hero") === "hero").length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab("middle")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === "middle"
              ? "bg-[#ff7a00] text-white shadow-md shadow-[#ff7a00]/20"
              : "bg-[#181310] border border-[#2b221a] text-[#8a8076] hover:text-white hover:bg-[#201915]"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>
            بانرات منتصف الصفحة ({banners.filter((b) => b.position === "middle").length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab("delivery")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
            activeTab === "delivery"
              ? "bg-[#ff7a00] text-white shadow-md shadow-[#ff7a00]/20"
              : "bg-[#181310] border border-[#2b221a] text-[#8a8076] hover:text-white hover:bg-[#201915]"
          }`}
        >
          <PanelBottom className="h-3.5 w-3.5" />
          <span>
            بانر أسفل الصفحة ({banners.filter((b) => b.position === "delivery").length})
          </span>
        </button>
      </div>

      {/* قائمة البنرات */}
      {filteredBanners.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="لا توجد بنرات في هذا القسم"
          description="يمكنك الضغط على زر 'إضافة بانر جديد' لإضافة بنر يعرض لزوار الموقع."
        />
      ) : (
        <div className="grid gap-4 sm:gap-5">
          {filteredBanners.map((banner) => {
            const pos = POSITION_INFO[banner.position || "hero"] || POSITION_INFO.hero;
            const PosIcon = pos.icon;

            return (
              <div
                key={banner.id}
                className="group relative overflow-hidden rounded-2xl bg-[#141210] border border-[#26201a] transition-all duration-300 hover:border-[#ff7a00]/40 hover:shadow-xl hover:shadow-black/60"
              >
                <div className="flex flex-col sm:flex-row">
                  {/* صورة البانر */}
                  <div className="relative h-48 p-2 sm:h-auto sm:min-h-44 sm:w-80 shrink-0 bg-[#1a1512] overflow-hidden">
                    {banner.image ? (
                      <Image
                        src={banner.image} unoptimized={banner.image.startsWith("data:")}
                        alt={banner.title}
                        fill
                        className="object-contain object-center"
                        sizes="(max-width: 640px) 100vw, 320px"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[#5a4f45]">
                        <Megaphone className="h-8 w-8" />
                      </div>
                    )}

                    {/* شارة مكان الظهور فوق الصورة */}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black backdrop-blur-md ${pos.bg} ${pos.color} ${pos.border} shadow-lg`}
                      >
                        <PosIcon className="h-3 w-3" />
                        <span>{pos.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* بيانات وتفاصيل البانر */}
                  <div className="flex-1 p-5 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-white group-hover:text-[#ff7a00] transition-colors">
                              {banner.title}
                            </h3>
                            <ActiveBadge active={banner.isActive} />
                          </div>
                          {banner.description && (
                            <p className="text-xs text-[#8a8076] mt-1.5 leading-relaxed max-w-2xl">
                              {banner.description}
                            </p>
                          )}
                        </div>

                        <span className="text-xs font-mono font-bold text-[#5a4f45] shrink-0">
                          ترتيب: #{banner.sortOrder}
                        </span>
                      </div>

                      {/* معلومات الزر والرابط */}
                      <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-[#736a61]">
                        {banner.ctaText && (
                          <span className="rounded-lg bg-[#1a1512] border border-[#2b221a] px-2.5 py-1 text-[#b5aba0]">
                            نص الزر: <strong className="text-white">{banner.ctaText}</strong>
                          </span>
                        )}
                        {banner.ctaLink && (
                          <span className="flex items-center gap-1 rounded-lg bg-[#1a1512] border border-[#2b221a] px-2.5 py-1 text-[#b5aba0]">
                            الرابط: <code className="text-[#ff7a00]" dir="ltr">{banner.ctaLink}</code>
                            <ExternalLink className="h-3 w-3 opacity-60" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* أزرار الإجراءات */}
                    <div className="flex items-center gap-2 pt-3 border-t border-[#1e1914]">
                      <button
                        onClick={() => toggleActive(banner.id)}
                        className="flex items-center gap-1.5 rounded-xl bg-[#1f1915] border border-[#2a231d] px-3.5 py-1.5 text-xs font-bold text-[#8a8076] hover:text-white hover:bg-[#28201a] transition-colors"
                      >
                        {banner.isActive ? (
                          <>
                            <EyeOff className="h-3.5 w-3.5 text-amber-400" />
                            <span>إيقاف العرض</span>
                          </>
                        ) : (
                          <>
                            <Eye className="h-3.5 w-3.5 text-emerald-400" />
                            <span>تفعيل البانر</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => openEdit(banner)}
                        className="flex items-center gap-1.5 rounded-xl bg-[#1f1915] border border-[#2a231d] px-3.5 py-1.5 text-xs font-bold text-[#8a8076] hover:text-[#ff7a00] hover:bg-[#28201a] transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        <span>تعديل</span>
                      </button>

                      <button
                        onClick={() => setDeleteId(banner.id)}
                        className="flex items-center gap-1.5 rounded-xl bg-[#1f1915] border border-[#2a231d] px-3.5 py-1.5 text-xs font-bold text-[#8a8076] hover:text-red-400 hover:bg-red-500/10 transition-colors mr-auto"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>حذف</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* موديل إضافة / تعديل بانر */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editBanner ? "تعديل بيانات البانر" : "إضافة بانر جديد"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#8a8076] mb-1.5">
              عنوان البانر *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="مثال: برجر روزماري الفاخر"
              className="w-full rounded-xl bg-[#1c1714] border border-[#2a231d] px-3.5 py-2.5 text-sm text-white placeholder-[#5a4f45] focus:outline-none focus:border-[#ff7a00]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#8a8076] mb-1.5">
              موضع ظهور البانر في الموقع *
            </label>
            <select
              value={form.position || "hero"}
              onChange={(e) =>
                setForm((p) => ({ ...p, position: e.target.value as BannerPosition }))
              }
              className="w-full rounded-xl bg-[#1c1714] border border-[#2a231d] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#ff7a00]"
            >
              <option value="hero">سلايدر الهيرو (أعلى الصفحة الرئيسية)</option>
              <option value="middle">بانرات منتصف الصفحة (البانرين الترويجيين)</option>
              <option value="delivery">بانر أسفل الصفحة (قبل الفوتر)</option>
            </select>
            <p className="text-[11px] text-[#6d6359] mt-1">
              {POSITION_INFO[form.position || "hero"]?.desc}
            </p>
          </div>

          <ImageUpload
            value={form.image}
            onChange={(image) => setForm((p) => ({ ...p, image }))}
            label="صورة البانر *"
            hint="ارفع صورة البانر كملف من جهازك — بتظهر كاملة من غير قص"
            previewClassName="aspect-[16/9]"
          />

          <div>
            <label className="block text-xs font-bold text-[#8a8076] mb-1.5">
              الوصف أو النص التوضيحي
            </label>
            <input
              type="text"
              value={form.description || ""}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="تفاصيل العرض أو نص تشويقي"
              className="w-full rounded-xl bg-[#1c1714] border border-[#2a231d] px-3.5 py-2.5 text-sm text-white placeholder-[#5a4f45] focus:outline-none focus:border-[#ff7a00]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#8a8076] mb-1.5">
                نص الزر (CTA)
              </label>
              <input
                type="text"
                value={form.ctaText || ""}
                onChange={(e) => setForm((p) => ({ ...p, ctaText: e.target.value }))}
                placeholder="مثال: اطلب الآن"
                className="w-full rounded-xl bg-[#1c1714] border border-[#2a231d] px-3.5 py-2.5 text-sm text-white placeholder-[#5a4f45] focus:outline-none focus:border-[#ff7a00]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[#8a8076] mb-1.5">
                الرابط المستهدف
              </label>
              <input
                type="text"
                value={form.ctaLink || ""}
                onChange={(e) => setForm((p) => ({ ...p, ctaLink: e.target.value }))}
                placeholder="مثال: #burger أو /menu"
                dir="ltr"
                className="w-full rounded-xl bg-[#1c1714] border border-[#2a231d] px-3.5 py-2.5 text-sm text-white placeholder-[#5a4f45] focus:outline-none focus:border-[#ff7a00]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-[#8a8076] mb-1.5">
                ترتيب الظهور
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

            <div className="flex items-center gap-2 pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-white">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
                  className="rounded border-[#2a231d] bg-[#1c1714] text-[#ff7a00] focus:ring-[#ff7a00]"
                />
                <span>تفعيل البانر فوراً</span>
              </label>
            </div>
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
              {editBanner ? "حفظ التعديلات" : "إضافة البانر"}
            </button>
          </div>
        </div>
      </Modal>

      {/* حوار تأكيد الحذف */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) deleteBanner(deleteId);
        }}
        title="حذف البانر"
        message="هل أنت متأكد من حذف هذا البانر نهائياً من الموقع؟"
        confirmText="نعم، حذف البانر"
        variant="danger"
      />
    </div>
  );
}
