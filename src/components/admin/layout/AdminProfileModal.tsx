"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, UserRound, Mail, ShieldCheck } from "lucide-react";
import ImageUpload from "@/components/admin/shared/ImageUpload";
import { useToast } from "@/components/admin/shared/Toast";

export interface AdminProfileData {
  name: string;
  avatar: string;
  email?: string;
  role?: string;
}

interface AdminProfileModalProps {
  open: boolean;
  initial: AdminProfileData;
  onClose: () => void;
  onSaved: (profile: { name: string; avatar: string }) => void;
}

export default function AdminProfileModal({ open, initial, onClose, onSaved }: AdminProfileModalProps) {
  const { showToast } = useToast();
  const [name, setName] = useState(initial.name);
  const [avatar, setAvatar] = useState(initial.avatar);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [wasOpen, setWasOpen] = useState(open);

  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName(initial.name);
      setAvatar(initial.avatar);
      setError("");
      setSaving(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, saving, onClose]);

  const save = async () => {
    if (saving) return;
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("الاسم لازم يكون حرفين على الأقل");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, avatar }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? "تعذّر حفظ البيانات");
        return;
      }
      showToast("تم تحديث بيانات الحساب");
      onSaved({ name: data.data.name, avatar: data.data.avatar ?? "" });
      onClose();
    } catch {
      setError("تعذّر الاتصال بالسيرفر — جرّب تاني");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const isCashier = initial.role === "cashier";

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" dir="rtl">
      <div
        className="absolute inset-0 bg-[var(--color-text-primary)]/45 backdrop-blur-[2px]"
        onClick={() => { if (!saving) onClose(); }}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={isCashier ? "بيانات حساب الكاشير" : "بيانات حساب المدير"}
        className="relative w-full max-w-[420px] overflow-hidden rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface-soft)] shadow-[0_24px_60px_-20px_rgba(38,53,43,0.45)]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-[14px] font-black text-[var(--color-text-primary)]">
              <UserRound className="h-4 w-4 text-[var(--color-primary)]" />
              {isCashier ? "بيانات حساب الكاشير" : "بيانات حساب المدير"}
            </h2>
            {!isCashier && (
              <p className="mt-1 text-[10.5px] font-semibold text-[var(--color-text-muted)]">
                الاسم والصورة بيظهروا في هيدر لوحة التحكم
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="إغلاق"
            className="icon-close flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-elevated)] transition-colors hover:bg-[var(--color-surface-hover)] disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          {initial.email && (
            <div className="flex items-center justify-between gap-3 rounded-[12px] border border-[var(--color-control-border)] bg-[var(--color-surface)] px-3.5 py-2.5">
              <span className="flex min-w-0 items-center gap-1.5 text-[11.5px] font-bold text-[var(--color-text-muted)]">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate" dir="ltr">{initial.email}</span>
              </span>
              <span className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--color-primary-soft)] px-2 py-0.5 text-[10px] font-black text-[var(--color-primary)]">
                <ShieldCheck className="h-3 w-3" />
                {initial.role === "admin" ? "مدير النظام" : initial.role === "cashier" ? "كاشير" : initial.role}
              </span>
            </div>
          )}

          {isCashier ? (
            <div className="flex items-center gap-3 rounded-[12px] border border-[var(--color-control-border)] bg-[var(--color-surface)] px-3.5 py-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                <UserRound className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-black text-[var(--color-text-primary)]">{initial.name}</p>
                <p className="mt-0.5 text-[10.5px] font-semibold text-[var(--color-text-muted)]">صورة افتراضية ثابتة</p>
              </div>
            </div>
          ) : (
            <>
              <ImageUpload
                value={avatar}
                onChange={setAvatar}
                shape="circle"
                folder="rozmaly/admins"
                label="الصورة الشخصية"
                hint="صورة مربعة أو دائرية، أقل من 8 ميجا"
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[var(--color-text-muted)]" htmlFor="admin-profile-name">
                  الاسم المعروض
                </label>
                <input
                  id="admin-profile-name"
                  value={name}
                  onChange={(e) => { setName(e.target.value); if (error) setError(""); }}
                  maxLength={60}
                  placeholder="مثال: محمد هشام"
                  className="w-full rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3.5 py-2.5 text-[13px] font-bold text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15"
                />
              </div>
            </>
          )}

          {error && (
            <p className="rounded-[10px] border border-[#F3D9D9] bg-[#FDF1F1] px-3 py-2 text-[11.5px] font-bold text-[#B0503F]">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2.5 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4">
          {isCashier ? (
            <button
              type="button"
              onClick={onClose}
              className="flex flex-1 items-center justify-center rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-[12.5px] font-bold text-[var(--color-text-on-primary)] transition-colors hover:bg-[var(--color-primary-hover)]"
            >
              إغلاق
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-[12.5px] font-bold text-[var(--color-text-on-primary)] transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> جاري الحفظ...</> : "حفظ التعديلات"}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-5 py-2.5 text-[12.5px] font-bold text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-secondary)] disabled:opacity-50"
              >
                إلغاء
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
