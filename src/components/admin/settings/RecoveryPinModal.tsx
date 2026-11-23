"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, ShieldCheck, X } from "lucide-react";

interface RecoveryPinModalProps {
  open: boolean;
  newPassword: string;
  confirmPassword: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RecoveryPinModal({
  open, newPassword, confirmPassword, onClose, onSuccess,
}: RecoveryPinModalProps) {
  // State starts fresh whenever the parent remounts this modal with a new key.
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus on mount (the modal is only rendered when open).
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saving, onClose]);

  const submit = async () => {
    if (saving) return;
    if (!/^\d{4}$/.test(pin)) {
      setError("اكتب رمز الاستعادة كامل — 4 أرقام");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth/password/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword, confirmPassword, pin }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error?.message ?? "تعذّر تحديث كلمة المرور");
        return;
      }
      onSuccess();
      onClose();
    } catch {
      setError("تعذّر الاتصال بالسيرفر — جرّب تاني");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" dir="rtl">
      <div
        className="absolute inset-0 bg-[var(--color-text-primary)]/45 backdrop-blur-[2px]"
        onClick={() => { if (!saving) onClose(); }}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="رمز استعادة كلمة المرور"
        className="relative w-full max-w-[380px] overflow-hidden rounded-[22px] border border-[var(--color-border)] bg-[var(--color-surface-soft)] shadow-[0_24px_60px_-20px_rgba(38,53,43,0.45)]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-5 py-4">
          <h2 className="flex items-center gap-2 text-[14px] font-black text-[var(--color-text-primary)]">
            <ShieldCheck className="h-4 w-4 text-[var(--color-primary)]" />
            رمز استعادة كلمة المرور
          </h2>
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
          <div className="space-y-1.5">
            <label
              className="block text-xs font-bold text-[var(--color-text-muted)]"
              htmlFor="recovery-pin"
            >
              رمز الاستعادة
            </label>
            <input
              ref={inputRef}
              id="recovery-pin"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
                setError("");
              }}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={4}
              placeholder="••••"
              dir="ltr"
              className="w-full rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-3.5 py-3 text-center font-mono text-[22px] font-black tracking-[0.55em] text-[var(--color-text-primary)] placeholder:tracking-[0.45em] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/15"
            />
          </div>

          {error && (
            <p className="rounded-[10px] border border-[#F3D9D9] bg-[#FDF1F1] px-3 py-2 text-[11.5px] font-bold text-[#B0503F]">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2.5 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4">
          <button
            type="button"
            onClick={submit}
            disabled={saving || pin.length !== 4}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-[12.5px] font-bold text-[var(--color-text-on-primary)] transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? <><Loader2 className="h-4 w-4 animate-spin" /> جاري التحديث...</>
              : "تأكيد وتحديث كلمة المرور"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-5 py-2.5 text-[12.5px] font-bold text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-secondary)] disabled:opacity-50"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
