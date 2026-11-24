"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Plus, Pencil, Trash2, TicketPercent, Power, PowerOff, Loader2,
} from "lucide-react";
import { Modal } from "@/components/admin/shared/Modal";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { EmptyState } from "@/components/admin/shared/EmptyState";
import { ActiveBadge } from "@/components/admin/shared/StatusBadge";
import { useToast } from "@/components/admin/shared/Toast";
import type { AdminCoupon } from "@/types/admin";

interface CouponForm {
  code: string;
  discountPercent: number;
  description: string;
  isActive: boolean;
}

const EMPTY_FORM: CouponForm = {
  code: "",
  discountPercent: 10,
  description: "",
  isActive: true,
};

export default function CouponsPage() {
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const loadedOnce = useRef(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCoupon | null>(null);
  const [form, setForm] = useState<CouponForm>(EMPTY_FORM);
  const [deleteTarget, setDeleteTarget] = useState<AdminCoupon | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchCoupons = useCallback(async () => {
    if (loadedOnce.current) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetch("/api/admin/coupons");
      const data = await res.json();
      if (data.success) setCoupons(data.data as AdminCoupon[]);
      else showToast(data.error?.message ?? "فشل تحميل الكوبونات", "error");
    } catch {
      showToast("تعذّر تحميل الكوبونات", "error");
    } finally {
      loadedOnce.current = true;
      setLoading(false);
      setRefreshing(false);
    }
  }, [showToast]);

  useEffect(() => {
    queueMicrotask(() => { void fetchCoupons(); });
  }, [fetchCoupons]);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (coupon: AdminCoupon) => {
    setEditing(coupon);
    setForm({
      code: coupon.code,
      discountPercent: coupon.discountPercent,
      description: coupon.description ?? "",
      isActive: coupon.isActive,
    });
    setModalOpen(true);
  };

  const save = async () => {
    const code = form.code.trim().toUpperCase();
    if (!code) {
      showToast("كود الخصم مطلوب", "error");
      return;
    }
    const percent = Number(form.discountPercent);
    if (!Number.isInteger(percent) || percent < 1 || percent > 100) {
      showToast("نسبة الخصم يجب أن تكون بين 1 و 100", "error");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code,
        discountPercent: percent,
        description: form.description.trim() || undefined,
        isActive: form.isActive,
      };
      const url = editing ? `/api/admin/coupons/${editing.id}` : "/api/admin/coupons";
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) {
        showToast(data.error?.message ?? "فشل حفظ الكوبون", "error");
        return;
      }
      showToast(editing ? "تم تحديث الكوبون" : "تمت إضافة الكوبون", "success");
      setModalOpen(false);
      await fetchCoupons();
    } catch {
      showToast("تعذّر حفظ الكوبون", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (coupon: AdminCoupon) => {
    setTogglingId(coupon.id);
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message);
      showToast(coupon.isActive ? `تم إيقاف ${coupon.code}` : `تم تفعيل ${coupon.code}`, "success");
      await fetchCoupons();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "تعذّر تغيير الحالة", "error");
    } finally {
      setTogglingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/admin/coupons/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message);
      showToast(`تم حذف ${deleteTarget.code}`, "warning");
      setDeleteTarget(null);
      await fetchCoupons();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "تعذّر حذف الكوبون", "error");
    }
  };

  if (loading) {
    return <div className="py-12 text-center text-sm text-[var(--color-text-muted)] animate-pulse">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-black text-[var(--color-text-primary)]">
            كوبونات الخصم
            {refreshing && <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--color-text-muted)]" />}
          </h1>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            أنشئ كود خصم بنسبة مئوية — يدخله العميل من موديل المنتج ويظهر في السلة وتفاصيل الطلب
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-bold text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-primary-hover)]"
        >
          <Plus className="h-4 w-4" /> إضافة كوبون
        </button>
      </div>

      {coupons.length === 0 ? (
        <EmptyState
          icon={TicketPercent}
          title="لا توجد كوبونات"
          description="أضف أول كود خصم للعملاء"
          action={
            <button
              onClick={openAdd}
              className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-bold text-[var(--color-on-primary)]"
            >
              إضافة كوبون
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-page-background)] p-4 transition-colors hover:border-[var(--color-primary-border)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                    <TicketPercent className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 dir="ltr" className="truncate text-sm font-black text-[var(--color-text-primary)]">
                      {coupon.code}
                    </h3>
                    <p className="mt-0.5 truncate text-[11px] text-[var(--color-text-muted)]">
                      {coupon.description || "كوبون خصم"}
                    </p>
                  </div>
                </div>
                <ActiveBadge active={coupon.isActive} />
              </div>

              <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-3 py-2.5">
                <p className="text-[10px] text-[var(--color-text-muted)]">نسبة الخصم</p>
                <p className="mt-0.5 text-lg font-black text-[var(--color-primary)]">
                  {coupon.discountPercent}%
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border)] pt-3">
                <button
                  onClick={() => toggleActive(coupon)}
                  disabled={togglingId === coupon.id}
                  className="flex items-center gap-1.5 text-xs font-bold text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary)] disabled:opacity-60"
                >
                  {togglingId === coupon.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : coupon.isActive ? (
                    <PowerOff className="h-3.5 w-3.5" />
                  ) : (
                    <Power className="h-3.5 w-3.5" />
                  )}
                  {coupon.isActive ? "إيقاف" : "تفعيل"}
                </button>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => openEdit(coupon)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-page-background)] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary)]"
                    aria-label="تعديل"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(coupon)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-page-background)] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-danger)]"
                    aria-label="حذف"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `تعديل ${editing.code}` : "إضافة كوبون خصم"}
        size="md"
      >
        <div className="space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="coupon-code" className="text-xs font-bold text-[var(--color-text-muted)]">
              كود الخصم *
            </label>
            <input
              id="coupon-code"
              value={form.code}
              onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
              dir="ltr"
              maxLength={30}
              placeholder="مثال: ROS10"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-page-background)] px-3 py-2.5 text-sm font-bold uppercase tracking-wider text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
            />
            <p className="text-[10px] text-[var(--color-text-muted)]">حروف لاتينية أو أرقام — سيُحفظ بحروف كبيرة</p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="coupon-percent" className="text-xs font-bold text-[var(--color-text-muted)]">
              نسبة الخصم *
            </label>
            <div className="relative">
              <input
                id="coupon-percent"
                type="number"
                min={1}
                max={100}
                step={1}
                value={form.discountPercent}
                onChange={(e) => setForm((p) => ({ ...p, discountPercent: Number(e.target.value) }))}
                className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-page-background)] px-3 py-2.5 pl-10 text-sm font-bold text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-[var(--color-text-muted)]">%</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="coupon-description" className="text-xs font-bold text-[var(--color-text-muted)]">
              وصف داخلي (اختياري)
            </label>
            <input
              id="coupon-description"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              maxLength={200}
              placeholder="مثال: عرض الصيف"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-page-background)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] focus:outline-none"
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-[var(--color-text-muted)]">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
              className="h-4 w-4 accent-[var(--color-primary)]"
            />
            الكوبون مفعّل
          </label>

          <div className="flex gap-3 pt-1">
            <button
              onClick={() => setModalOpen(false)}
              className="flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-page-background)] px-4 py-2.5 text-sm font-bold text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            >
              إلغاء
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-bold text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-70"
            >
              {saving ? "جاري..." : editing ? "حفظ" : "إضافة"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="حذف كوبون الخصم"
        message={`هل تريد حذف «${deleteTarget?.code ?? ""}»؟`}
        confirmText="حذف الكوبون"
        variant="danger"
      />
    </div>
  );
}
