"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, Megaphone, Eye, EyeOff, Layers, Sparkles, PanelBottom, Sliders, ExternalLink, Loader2 } from "lucide-react";
import { ActiveBadge } from "@/components/admin/shared/StatusBadge";
import { Modal } from "@/components/admin/shared/Modal";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { EmptyState } from "@/components/admin/shared/EmptyState";
import ImageUpload from "@/components/admin/shared/ImageUpload";
import { useToast } from "@/components/admin/shared/Toast";
import type { AdminBanner, BannerPosition } from "@/types/admin";

// Mock data — مفعّلة مؤقتاً للتيست (رجّع تعليقها وشغّل الـ API بعد الانتهاء)
import { MOCK_ADMIN_BANNERS } from "@/data/admin/banners";

const USE_MOCK = false; // الموك معطّل — الواجهة متصلة بالـ API

const POSITION_INFO: Record<BannerPosition, { label: string; icon: React.ElementType; color: string; bg: string; border: string; desc: string }> = {
  hero:     { label: "سلايدر الهيرو",          icon: Sliders,    color: "text-amber-400",   bg: "bg-amber-500/10",   border: "border-amber-500/25",  desc: "السلايدر التفاعلي أعلى الموقع" },
  middle:   { label: "بانرات منتصف الصفحة",    icon: Sparkles,   color: "text-[var(--color-primary)]",   bg: "bg-[var(--color-primary)]/10",   border: "border-[var(--color-primary)]/25",  desc: "البانران الكبيران في منتصف الصفحة" },
  delivery: { label: "بانر أسفل الصفحة",       icon: PanelBottom, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/25", desc: "البانر أسفل الصفحة قبل الفوتر" },
};

const EMPTY: Omit<AdminBanner, "id"> & { imagePublicId?: string } = { title: "", description: "", image: "", imagePublicId: "", position: "hero", ctaText: "", ctaLink: "", sortOrder: 1, isActive: true };

export default function BannersPage() {
  const { showToast } = useToast();
  const [banners, setBanners] = useState<AdminBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const loadedOnce = useRef(false);
  const [activeTab, setActiveTab] = useState<"all" | BannerPosition>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editBanner, setEditBanner] = useState<AdminBanner | null>(null);
  const [form, setForm] = useState<Omit<AdminBanner, "id"> & { imagePublicId?: string }>(EMPTY);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchBanners = useCallback(async () => {
    if (USE_MOCK) { setLoading(false); loadedOnce.current = true; return; }
    if (loadedOnce.current) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch("/api/admin/banners?limit=50");
      const d = await res.json();
      if (d.success) setBanners(d.data.banners);
      else showToast(d.error?.message ?? "فشل", "error");
    } catch { showToast("خطأ", "error"); }
    finally { loadedOnce.current = true; setLoading(false); setRefreshing(false); }
  }, [showToast]);

  useEffect(() => { queueMicrotask(() => { void fetchBanners(); }); }, [fetchBanners]);

  const filtered = activeTab === "all" ? banners : banners.filter(b => (b.position || "hero") === activeTab);

  const openAdd = () => { setEditBanner(null); setForm({ ...EMPTY, position: activeTab === "all" ? "hero" : activeTab, sortOrder: banners.length + 1 }); setModalOpen(true); };
  const openEdit = (b: AdminBanner) => { setEditBanner(b); setForm({ title: b.title, description: b.description ?? "", image: b.image, imagePublicId: (b as AdminBanner & { imagePublicId?: string }).imagePublicId ?? "", position: b.position || "hero", ctaText: b.ctaText ?? "", ctaLink: b.ctaLink ?? "", startDate: b.startDate ?? "", endDate: b.endDate ?? "", sortOrder: b.sortOrder, isActive: b.isActive }); setModalOpen(true); };

  const save = async () => {
    if (!form.title.trim()) { showToast("العنوان مطلوب", "error"); return; }
    if (!form.image.trim()) { showToast("الصورة مطلوبة", "error"); return; }
    if (USE_MOCK) {
      if (editBanner) {
        setBanners((prev) => prev.map((b) => b.id === editBanner.id ? { ...b, ...form } : b));
        showToast("تم التحديث", "success");
      } else {
        setBanners((prev) => [...prev, { ...(form as AdminBanner), id: `bnr-${Date.now()}` }]);
        showToast("تمت الإضافة", "success");
      }
      setModalOpen(false);
      return;
    }
    setSaving(true);
    try {
      const url = editBanner ? `/api/admin/banners/${editBanner.id}` : "/api/admin/banners";
      const method = editBanner ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const d = await res.json();
      if (d.success) { showToast(editBanner ? "تم التحديث" : "تمت الإضافة", "success"); setModalOpen(false); fetchBanners(); }
      else showToast(d.error?.message ?? "فشل", "error");
    } catch { showToast("خطأ", "error"); }
    finally { setSaving(false); }
  };

  const toggleActive = async (id: string, cur: boolean) => {
    if (USE_MOCK) {
      setBanners((prev) => prev.map((b) => b.id === id ? { ...b, isActive: !cur } : b));
      return;
    }
    const res = await fetch(`/api/admin/banners/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !cur }) });
    const d = await res.json();
    if (d.success) fetchBanners();
  };

  const deleteBanner = async (id: string) => {
    if (USE_MOCK) {
      setBanners((prev) => prev.filter((b) => b.id !== id));
      showToast("تم الحذف", "warning");
      setDeleteId(null);
      return;
    }
    const res = await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
    const d = await res.json();
    if (d.success) { showToast("تم الحذف", "warning"); fetchBanners(); }
    setDeleteId(null);
  };

  if (loading) return <div className="py-12 text-center text-sm text-[var(--color-text-muted)] animate-pulse">جاري التحميل...</div>;

  return (
    <div className="space-y-6 select-none">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl sm:text-2xl font-black text-white">
            إدارة بانرات الموقع
            {refreshing && <Loader2 className="h-4 w-4 animate-spin text-[var(--color-text-muted)]" />}
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-1">تحكم في بنرات الصفحة الرئيسية</p>
        </div>
        <button onClick={openAdd} className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[var(--color-primary)]/20">
          <Plus className="h-4 w-4" /> إضافة بانر جديد
        </button>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-[var(--color-border)] pb-3">
        {(["all", "hero", "middle", "delivery"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all ${activeTab === tab ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-page-background)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white hover:bg-[var(--color-page-background)]"}`}>
            {tab === "all" ? <><Layers className="h-3.5 w-3.5" /> كل البنرات ({banners.length})</> :
             tab === "hero" ? <><Sliders className="h-3.5 w-3.5" /> الهيرو ({banners.filter(b => (b.position||"hero")==="hero").length})</> :
             tab === "middle" ? <><Sparkles className="h-3.5 w-3.5" /> المنتصف ({banners.filter(b => b.position==="middle").length})</> :
             <><PanelBottom className="h-3.5 w-3.5" /> الأسفل ({banners.filter(b => b.position==="delivery").length})</>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Megaphone} title="لا توجد بنرات" description="أضف بانر جديد" />
      ) : (
        <div className="grid gap-4 sm:gap-5">
          {filtered.map(banner => {
            const pos = POSITION_INFO[banner.position || "hero"] || POSITION_INFO.hero;
            const PosIcon = pos.icon;
            return (
              <div key={banner.id} className="group relative overflow-hidden rounded-2xl bg-[var(--color-page-background)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/40 hover:shadow-xl transition-all">
                <div className="flex flex-col sm:flex-row">
                  <div className="relative h-48 p-2 sm:h-auto sm:min-h-44 sm:w-80 shrink-0 bg-[var(--color-page-background)] overflow-hidden">
                    {banner.image ? <Image src={banner.image} alt={banner.title} fill className="object-contain object-center" sizes="320px" /> : <div className="flex h-full items-center justify-center text-[var(--color-text-muted)]"><Megaphone className="h-8 w-8" /></div>}
                    <div className="absolute top-3 right-3">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-black backdrop-blur-md ${pos.bg} ${pos.color} ${pos.border}`}>
                        <PosIcon className="h-3 w-3" />{pos.label}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 p-5 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2"><h3 className="text-base font-bold text-white group-hover:text-[var(--color-primary)]">{banner.title}</h3><ActiveBadge active={banner.isActive} /></div>
                          {banner.description && <p className="text-xs text-[var(--color-text-muted)] mt-1.5 max-w-2xl">{banner.description}</p>}
                        </div>
                        <span className="text-xs font-mono text-[var(--color-text-muted)] shrink-0">#{banner.sortOrder}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-[var(--color-text-muted)]">
                        {banner.ctaText && <span className="rounded-lg bg-[var(--color-page-background)] border border-[var(--color-border)] px-2.5 py-1 text-[var(--color-text-muted)]">زر: <strong className="text-white">{banner.ctaText}</strong></span>}
                        {banner.ctaLink && <span className="flex items-center gap-1 rounded-lg bg-[var(--color-page-background)] border border-[var(--color-border)] px-2.5 py-1"><code className="text-[var(--color-primary)]" dir="ltr">{banner.ctaLink}</code><ExternalLink className="h-3 w-3 opacity-60" /></span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-3 border-t border-[var(--color-text-primary)]">
                      <button onClick={() => toggleActive(banner.id, banner.isActive)}
                        className="flex items-center gap-1.5 rounded-xl bg-[var(--color-page-background)] border border-[var(--color-border)] px-3.5 py-1.5 text-xs font-bold text-[var(--color-text-muted)] hover:text-white transition-colors">
                        {banner.isActive ? <><EyeOff className="h-3.5 w-3.5 text-amber-400" /> إيقاف</> : <><Eye className="h-3.5 w-3.5 text-emerald-400" /> تفعيل</>}
                      </button>
                      <button onClick={() => openEdit(banner)} className="flex items-center gap-1.5 rounded-xl bg-[var(--color-page-background)] border border-[var(--color-border)] px-3.5 py-1.5 text-xs font-bold text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors">
                        <Pencil className="h-3.5 w-3.5" /> تعديل
                      </button>
                      <button onClick={() => setDeleteId(banner.id)} className="flex items-center gap-1.5 rounded-xl bg-[var(--color-page-background)] border border-[var(--color-border)] px-3.5 py-1.5 text-xs font-bold text-[var(--color-text-muted)] hover:text-red-400 mr-auto transition-colors">
                        <Trash2 className="h-3.5 w-3.5" /> حذف
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editBanner ? "تعديل البانر" : "إضافة بانر جديد"}>
        <div className="space-y-4">
          {[{ label: "عنوان البانر *", key: "title", ph: "برجر روزماري" }, { label: "الوصف", key: "description", ph: "نص توضيحي" }].map(({ label, key, ph }) => (
            <div key={key}>
              <label className="block text-xs font-bold text-[var(--color-text-muted)] mb-1.5">{label}</label>
              <input type="text" value={(form as Record<string, unknown>)[key] as string} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} placeholder={ph}
                className="w-full rounded-xl bg-[var(--color-page-background)] border border-[var(--color-border)] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--color-primary)]" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-bold text-[var(--color-text-muted)] mb-1.5">موضع البانر *</label>
            <select value={form.position || "hero"} onChange={e => setForm(p => ({ ...p, position: e.target.value as BannerPosition }))}
              className="w-full rounded-xl bg-[var(--color-page-background)] border border-[var(--color-border)] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--color-primary)]">
              <option value="hero">سلايدر الهيرو (أعلى الصفحة)</option>
              <option value="middle">بانرات منتصف الصفحة</option>
              <option value="delivery">بانر أسفل الصفحة</option>
            </select>
          </div>
          <ImageUpload value={form.image}
            onChange={img => setForm(p => ({ ...p, image: img }))}
            onPublicIdChange={pid => setForm(p => ({ ...p, imagePublicId: pid }))}
            label="صورة البانر *" hint="سلايدر الهيرو: 1800×600 بيكسل (نسبة 3:1) — بانرات الصفحة: 1280×720 بيكسل (16:9). JPG / PNG / WebP، أقل من 8 ميجا" folder="rozmaly/banners" previewClassName="aspect-[16/9]" />
          <div className="grid grid-cols-2 gap-3">
            {[{ label: "نص الزر", key: "ctaText", ph: "اطلب الآن" }, { label: "الرابط", key: "ctaLink", ph: "#burger", dir: "ltr" as const }].map(({ label, key, ph, dir }) => (
              <div key={key}>
                <label className="block text-xs font-bold text-[var(--color-text-muted)] mb-1.5">{label}</label>
                <input type="text" dir={dir} value={(form as Record<string, unknown>)[key] as string} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} placeholder={ph}
                  className="w-full rounded-xl bg-[var(--color-page-background)] border border-[var(--color-border)] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--color-primary)]" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-[var(--color-text-muted)] mb-1.5">ترتيب الظهور</label>
              <input type="number" value={form.sortOrder} onChange={e => setForm(p => ({ ...p, sortOrder: Number(e.target.value) || 1 }))} min={1}
                className="w-full rounded-xl bg-[var(--color-page-background)] border border-[var(--color-border)] px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[var(--color-primary)]" />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-white">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="rounded accent-[var(--color-primary)]" />
                تفعيل البانر
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-4 border-t border-[var(--color-border)]">
            <button onClick={() => setModalOpen(false)} className="rounded-xl bg-[var(--color-page-background)] border border-[var(--color-border)] px-4 py-2.5 text-xs font-bold text-[var(--color-text-muted)] hover:text-white">إلغاء</button>
            <button onClick={save} disabled={saving} className="rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-70">
              {saving ? "جاري..." : editBanner ? "حفظ التعديلات" : "إضافة البانر"}
            </button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => deleteBanner(deleteId!)}
        title="حذف البانر" message="هل أنت متأكد من حذف هذا البانر نهائياً؟" confirmText="حذف" variant="danger" />
    </div>
  );
}
