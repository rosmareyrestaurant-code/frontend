"use client";

import { useState } from "react";
import {
  Plus, Pencil, Trash2, MapPin, CalendarDays, Truck, Power, PowerOff, Info,
} from "lucide-react";
import { Modal } from "@/components/admin/shared/Modal";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { EmptyState } from "@/components/admin/shared/EmptyState";
import { ActiveBadge } from "@/components/admin/shared/StatusBadge";
import { useToast } from "@/components/admin/shared/Toast";
import { useDelivery } from "@/context/DeliveryContext";
import {
  DELIVERY_DAYS, DeliveryDayKey, DeliveryZone, formatDays,
} from "@/types/delivery";

interface ZoneForm {
  name: string;
  days: DeliveryDayKey[];
  isActive: boolean;
  note: string;
}

const EMPTY_FORM: ZoneForm = { name: "", days: [], isActive: true, note: "" };

export default function DeliveryZonesPage() {
  const { showToast } = useToast();
  const { zones, addZone, updateZone, toggleZone, deleteZone } = useDelivery();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<DeliveryZone | null>(null);
  const [form, setForm] = useState<ZoneForm>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<DeliveryZone | null>(null);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (zone: DeliveryZone) => {
    setEditing(zone);
    setForm({ name: zone.name, days: zone.days, isActive: zone.isActive, note: zone.note ?? "" });
    setModalOpen(true);
  };

  const toggleDay = (day: DeliveryDayKey) => {
    setForm((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }));
  };

  const save = () => {
    const name = form.name.trim();
    if (!name) { showToast("اسم المنطقة مطلوب", "error"); return; }
    if (form.days.length === 0) { showToast("اختر يوم توصيل مجاني واحد على الأقل", "error"); return; }

    const input = {
      name,
      days: DELIVERY_DAYS.filter((d) => form.days.includes(d.key)).map((d) => d.key),
      isActive: form.isActive,
      note: form.note.trim() || undefined,
    };

    if (editing) {
      updateZone(editing.id, input);
      showToast("تم تحديث منطقة التوصيل", "success");
    } else {
      addZone(input);
      showToast("تمت إضافة منطقة التوصيل", "success");
    }
    setModalOpen(false);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    deleteZone(deleteTarget.id);
    showToast(`تم حذف منطقة ${deleteTarget.name}`, "warning");
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-5">
      {/* رأس الصفحة */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-black text-white">مناطق التوصيل</h1>
          <p className="mt-1 text-xs text-[#8a8076]">
            أضف الأماكن اللي ليها توصيل مجاني — هتظهر تلقائياً في شريط التنبيهات أعلى الموقع،
            ولو العميل اختار مكان من القائمة هيشوف توضيح بس، وهيظهر الطلب في الداش بورد عشان نتواصل معاه.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#ff7a00] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#e66e00]"
        >
          <Plus className="h-4 w-4" /> إضافة منطقة
        </button>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-[#ff7a00]/20 bg-[#ff7a00]/8 px-4 py-3 text-[11px] leading-relaxed text-[#ffb066]">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          مثال: لو أضفت «المرج»، أي عميل يختار المرج عند إتمام الطلب هيشوف توضيح إن مكانه ضمن التوصيل المجاني،
          وهيظهر لك الطلب في لوحة الطلبات. المناطق الموقوفة لا تظهر للعملاء ولا في الشريط المتحرك.
        </span>
      </div>

      {/* القائمة */}
      {zones.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="لا توجد مناطق توصيل"
          description="أضف أول منطقة توصل إليها وحدد أيام التوصيل المجاني"
          action={<button onClick={openAdd} className="rounded-xl bg-[#ff7a00] px-4 py-2 text-sm font-bold text-white">إضافة منطقة</button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {zones.map((zone) => (
            <div key={zone.id} className="rounded-2xl border border-[#26201a] bg-[#141210] p-4 transition-colors hover:border-[#3a3229]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#ff7a00]/25 bg-[#ff7a00]/10 text-[#ff7a00]">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-black text-white">{zone.name}</h3>
                    <p className="mt-0.5 text-[11px] text-[#6b6259]">{zone.note || "منطقة توصيل"}</p>
                  </div>
                </div>
                <ActiveBadge active={zone.isActive} />
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#2a231d] bg-[#1a1512] px-3 py-2.5">
                <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ff7a00]" />
                <div>
                  <p className="text-[10px] text-[#6b6259]">أيام التوصيل المجاني</p>
                  <p className="mt-0.5 text-xs font-bold text-[#ffb066]">{formatDays(zone.days)}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-[#1e1914] pt-3">
                <button
                  onClick={() => {
                    toggleZone(zone.id);
                    showToast(zone.isActive ? `تم إيقاف ${zone.name}` : `تم تفعيل ${zone.name}`, "success");
                  }}
                  className="flex items-center gap-1.5 text-xs font-bold text-[#8a8076] transition-colors hover:text-[#ff7a00]"
                >
                  {zone.isActive ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                  {zone.isActive ? "إيقاف" : "تفعيل"}
                </button>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => openEdit(zone)}
                    aria-label={`تعديل ${zone.name}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2a231d] bg-[#1f1915] text-[#8a8076] transition-colors hover:text-[#ff7a00]"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(zone)}
                    aria-label={`حذف ${zone.name}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#2a231d] bg-[#1f1915] text-[#8a8076] transition-colors hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* موديل الإضافة / التعديل */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `تعديل منطقة ${editing.name}` : "إضافة منطقة توصيل"}
        size="md"
      >
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#c4b9b0]">اسم المنطقة *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="مثال: المرج"
              className="w-full rounded-xl border border-[#2d2620] bg-[#1a1512] px-3 py-2.5 text-sm text-white placeholder-[#5a534d] focus:border-[#ff7a00] focus:outline-none focus:ring-1 focus:ring-[#ff7a00]/30"
            />
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-bold text-[#c4b9b0]">
              <CalendarDays className="h-3.5 w-3.5 text-[#ff7a00]" /> أيام التوصيل المجاني *
            </label>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {DELIVERY_DAYS.map((day) => {
                const active = form.days.includes(day.key);
                return (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => toggleDay(day.key)}
                    className={`rounded-lg border px-2 py-2 text-xs font-bold transition-colors ${
                      active
                        ? "border-[#ff7a00] bg-[#ff7a00]/15 text-[#ffb066]"
                        : "border-[#2a231d] bg-[#1a1512] text-[#8a8076] hover:border-[#ff7a00]/40 hover:text-white"
                    }`}
                  >
                    {day.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#c4b9b0]">ملاحظة (اختياري)</label>
            <input
              value={form.note}
              onChange={(e) => setForm((p) => ({ ...p, note: e.target.value }))}
              placeholder="مثال: توصيل مجاني كل يوم سبت"
              className="w-full rounded-xl border border-[#2d2620] bg-[#1a1512] px-3 py-2.5 text-sm text-white placeholder-[#5a534d] focus:border-[#ff7a00] focus:outline-none focus:ring-1 focus:ring-[#ff7a00]/30"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-[#c4b9b0]">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
              className="h-4 w-4 accent-[#ff7a00]"
            />
            المنطقة مفعّلة (تظهر للعملاء)
          </label>

          <div className="flex items-start gap-2 rounded-xl border border-[#2a231d] bg-[#1a1512] px-3 py-2.5 text-[11px] text-[#a89f94]">
            <Truck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#ff7a00]" />
            <span>
              معاينة الشريط: توصل مجاني إلى {form.name.trim() || "اسم المنطقة"}
              {form.days.length ? ` كل ${formatDays(form.days)}` : ""}
            </span>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={() => setModalOpen(false)}
              className="flex-1 rounded-xl border border-[#2a231d] bg-[#1c1613] px-4 py-2.5 text-sm font-bold text-[#a89f94] transition-colors hover:text-white"
            >
              إلغاء
            </button>
            <button
              onClick={save}
              className="flex-1 rounded-xl bg-[#ff7a00] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#e66e00]"
            >
              {editing ? "حفظ التعديلات" : "إضافة المنطقة"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="حذف منطقة التوصيل"
        message={`هل تريد حذف منطقة «${deleteTarget?.name ?? ""}»؟ لن تظهر للعملاء في الموقع.`}
        confirmText="حذف المنطقة"
      />
    </div>
  );
}
