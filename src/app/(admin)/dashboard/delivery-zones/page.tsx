"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Pencil, Trash2, MapPin, CalendarDays, Power, PowerOff, Loader2 } from "lucide-react";
import { Modal } from "@/components/admin/shared/Modal";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { BulkActionsBar } from "@/components/admin/shared/BulkActionsBar";
import { BulkCheckbox } from "@/components/admin/shared/BulkCheckbox";
import { EmptyState } from "@/components/admin/shared/EmptyState";
import { ActiveBadge } from "@/components/admin/shared/StatusBadge";
import { useToast } from "@/components/admin/shared/Toast";
import { useRowSelection } from "@/hooks/useRowSelection";
import { bulkDelete } from "@/lib/bulk-delete";
import { DELIVERY_DAYS, type DeliveryDayKey, type DeliveryZone, formatDays } from "@/types/delivery";

// DeliveryContext معلّق للداشبورد — نستخدم الـ API مباشرة
// import { useDelivery } from "@/context/DeliveryContext";

interface ZoneForm { name: string; days: DeliveryDayKey[]; isActive: boolean; note: string; }
const EMPTY_FORM: ZoneForm = { name: "", days: [], isActive: true, note: "" };

export default function DeliveryZonesPage() {
  const { showToast } = useToast();
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const loadedOnce = useRef(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DeliveryZone | null>(null);
  const [form, setForm] = useState<ZoneForm>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<DeliveryZone | null>(null);
  const [saving, setSaving] = useState(false);
  const selection = useRowSelection(zones.map((z) => z.id));
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const fetchZones = useCallback(async () => {
    if (loadedOnce.current) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch("/api/admin/delivery-zones");
      const d = await res.json();
      if (d.success) setZones(d.data);
      else showToast(d.error?.message ?? "فشل", "error");
    } catch { showToast("خطأ", "error"); }
    finally { loadedOnce.current = true; setLoading(false); setRefreshing(false); }
  }, [showToast]);

  useEffect(() => { queueMicrotask(() => { void fetchZones(); }); }, [fetchZones]);

  const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (z: DeliveryZone) => { setEditing(z); setForm({ name: z.name, days: z.days, isActive: z.isActive, note: z.note ?? "" }); setModalOpen(true); };
  const toggleDay = (day: DeliveryDayKey) => setForm(p => ({ ...p, days: p.days.includes(day) ? p.days.filter(d => d !== day) : [...p.days, day] }));

  const save = async () => {
    if (!form.name.trim()) { showToast("الاسم مطلوب", "error"); return; }
    if (!form.days.length) { showToast("اختر يوم واحد على الأقل", "error"); return; }
    setSaving(true);
    try {
      const payload = { name: form.name.trim(), days: form.days, isActive: form.isActive, note: form.note.trim() || undefined };
      const url = editing ? `/api/admin/delivery-zones/${editing.id}` : "/api/admin/delivery-zones";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await res.json();
      if (d.success) { showToast(editing ? "تم التحديث" : "تمت الإضافة", "success"); setModalOpen(false); fetchZones(); }
      else showToast(d.error?.message ?? "فشل", "error");
    } catch { showToast("خطأ", "error"); }
    finally { setSaving(false); }
  };

  const toggleActive = async (z: DeliveryZone) => {
    await fetch(`/api/admin/delivery-zones/${z.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !z.isActive }) });
    showToast(z.isActive ? `تم إيقاف ${z.name}` : `تم تفعيل ${z.name}`, "success");
    fetchZones();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/admin/delivery-zones/${deleteTarget.id}`, { method: "DELETE" });
    showToast(`تم حذف ${deleteTarget.name}`, "warning");
    setDeleteTarget(null);
    fetchZones();
  };

  const deleteSelectedZones = async () => {
    if (!selection.hasSelection) return;
    const ids = [...selection.selectedIds];
    setBulkDeleting(true);
    try {
      const { succeeded, failed } = await bulkDelete(ids, (id) => `/api/admin/delivery-zones/${id}`);
      if (succeeded.length) {
        setZones((prev) => prev.filter((z) => !succeeded.includes(z.id)));
        showToast(`تم حذف ${succeeded.length} مناطق`, "warning");
        void fetchZones();
      }
      if (failed.length) showToast(`تعذّر حذف ${failed.length} مناطق`, "error");
      selection.clear();
    } finally {
      setBulkDeleting(false);
    }
  };

  if (loading) return <div className="py-12 text-center text-sm text-[var(--color-text-muted)] animate-pulse">جاري التحميل...</div>;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-black text-white">
            مناطق التوصيل
            {refreshing && <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--color-text-muted)]" />}
          </h1>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">أضف الأماكن التي لها توصيل مجاني — ستظهر في شريط التنبيهات أعلى الموقع</p>
        </div>
        <button onClick={openAdd} className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-bold text-white hover:bg-[var(--color-primary-hover)] transition-colors">
          <Plus className="h-4 w-4" /> إضافة منطقة
        </button>
      </div>

      <BulkActionsBar
        count={selection.count}
        onDelete={deleteSelectedZones}
        onClear={selection.clear}
        deleting={bulkDeleting}
        title="حذف مناطق التوصيل المحددة"
        message={`هل تريد حذف ${selection.count} ${selection.count === 1 ? "منطقة" : "مناطق"}؟ لا يمكن التراجع.`}
        confirmText="حذف المناطق"
      />
      {zones.length === 0 ? (
        <EmptyState icon={MapPin} title="لا توجد مناطق" description="أضف مناطق التوصيل المجاني"
          action={<button onClick={openAdd} className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-white">إضافة منطقة</button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {zones.map(zone => (
            <div key={zone.id} className={`rounded-2xl border bg-[var(--color-page-background)] p-4 hover:border-[#3a3229] transition-colors ${selection.isSelected(zone.id) ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary-border)]" : "border-[var(--color-border)]"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <BulkCheckbox
                    checked={selection.isSelected(zone.id)}
                    onChange={() => selection.toggle(zone.id)}
                    label={`تحديد منطقة ${zone.name}`}
                  />
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--color-primary)]/25 bg-[var(--color-primary)]/10 text-[var(--color-primary)]"><MapPin className="h-5 w-5" /></div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-black text-white">{zone.name}</h3>
                    <p className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">{zone.note || "منطقة توصيل"}</p>
                  </div>
                </div>
                <ActiveBadge active={zone.isActive} />
              </div>
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-page-background)] px-3 py-2.5">
                <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-primary)]" />
                <div>
                  <p className="text-[10px] text-[var(--color-text-muted)]">أيام التوصيل المجاني</p>
                  <p className="mt-0.5 text-xs font-bold text-[var(--color-primary)]">{formatDays(zone.days)}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-[var(--color-text-primary)] pt-3">
                <button onClick={() => toggleActive(zone)} className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors">
                  {zone.isActive ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                  {zone.isActive ? "إيقاف" : "تفعيل"}
                </button>
                <div className="flex gap-1.5">
                  <button onClick={() => openEdit(zone)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-page-background)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => setDeleteTarget(zone)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-page-background)] text-[var(--color-text-muted)] hover:text-red-400 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `تعديل ${editing.name}` : "إضافة منطقة توصيل"} size="md">
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--color-text-muted)]">اسم المنطقة *</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="مثال: المرج"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-page-background)] px-3 py-2.5 text-sm text-white focus:border-[var(--color-primary)] focus:outline-none" />
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-muted)]"><CalendarDays className="h-3.5 w-3.5 text-[var(--color-primary)]" /> أيام التوصيل المجاني *</label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {DELIVERY_DAYS.map(day => {
                const active = form.days.includes(day.key);
                return (
                  <button key={day.key} type="button" onClick={() => toggleDay(day.key)}
                    className={`rounded-lg border px-2 py-2 text-xs font-bold transition-colors ${active ? "border-[var(--color-primary)] bg-[var(--color-primary)]/15 text-[var(--color-primary)]" : "border-[var(--color-border)] bg-[var(--color-page-background)] text-[var(--color-text-muted)] hover:border-[var(--color-primary)]/40 hover:text-white"}`}>
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--color-text-muted)]">ملاحظة (اختياري)</label>
            <input value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} placeholder="مثال: توصيل مجاني كل يوم سبت"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-page-background)] px-3 py-2.5 text-sm text-white focus:border-[var(--color-primary)] focus:outline-none" />
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-[var(--color-text-muted)]">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} className="h-4 w-4 accent-[var(--color-primary)]" />
            المنطقة مفعّلة
          </label>
          <div className="flex gap-3 pt-1">
            <button onClick={() => setModalOpen(false)} className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-page-background)] px-4 py-2.5 text-sm font-bold text-[var(--color-text-muted)] hover:text-white">إلغاء</button>
            <button onClick={save} disabled={saving} className="flex-1 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-bold text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-70">
              {saving ? "جاري..." : editing ? "حفظ" : "إضافة"}
            </button>
          </div>
        </div>
      </Modal>
      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete}
        title="حذف منطقة التوصيل" message={`هل تريد حذف «${deleteTarget?.name ?? ""}»؟`} confirmText="حذف المنطقة" />
    </div>
  );
}
