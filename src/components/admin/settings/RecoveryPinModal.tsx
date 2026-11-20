"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { KeyRound, Loader2, ShieldCheck, X } from "lucide-react";

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
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setPin("");
    setError("");
    setSaving(false);
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, saving, onClose]);

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
        className="absolute inset-0 bg-[#26352B]/45 backdrop-blur-[2px]"
        onClick={() => { if (!saving) onClose(); }}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="رمز استعادة كلمة المرور"
        className="relative w-full max-w-[380px] overflow-hidden rounded-[22px] border border-[#E6E1D5] bg-[#F8F6F1] shadow-[0_24px_60px_-20px_rgba(38,53,43,0.45)]"
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#ECE7DC] px-5 py-4">
          <h2 className="flex items-center gap-2 text-[14px] font-black text-[#333B2E]">
            <ShieldCheck className="h-4 w-4 text-[#50604D]" />
            رمز استعادة كلمة المرور
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="إغلاق"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#E7E2D6] bg-white text-[#6B7264] transition-colors hover:bg-[#EFECE3] disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="flex items-start gap-2.5 rounded-[12px] border border-[#E9E5DA] bg-[#FBF9F6] px-3.5 py-3">
            <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-[#50604D]" />
            <p className="text-[11px] font-semibold leading-relaxed text-[#6B7264]">
              اكتب الرمز المكوّن من 4 أرقام اللي تعرفه انت بس.
              الرمز مش بيتبعت على الميل — ومحاولاتك محدودة.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#8F9186]" htmlFor="recovery-pin">
              رمز الاستعادة
            </label>
            <input
              ref={inputRef}
              id="recovery-pin"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
                if (error) setError("");
              }}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={4}
              placeholder="••••"
              dir="ltr"
              className="w-full rounded-[12px] border border-[#E3DED1] bg-white px-3.5 py-3 text-center font-mono text-[22px] font-black tracking-[0.55em] text-[#333B2E] placeholder:tracking-[0.45em] placeholder:text-[#C9CCC0] focus:border-[#8FA184] focus:outline-none focus:ring-2 focus:ring-[#50604D]/15"
            />
          </div>

          {error && (
            <p className="rounded-[10px] border border-[#F3D9D9] bg-[#FDF1F1] px-3 py-2 text-[11.5px] font-bold text-[#B0503F]">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2.5 border-t border-[#ECE7DC] bg-[#FBF9F6] px-5 py-4">
          <button
            type="button"
            onClick={submit}
            disabled={saving || pin.length !== 4}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#50604D] px-5 py-2.5 text-[12.5px] font-bold text-[#FFFFFF] transition-colors hover:bg-[#435241] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> جاري التحديث...</> : "تأكيد وتحديث كلمة المرور"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-full border border-[#DDD8CA] bg-white px-5 py-2.5 text-[12.5px] font-bold text-[#6B7264] transition-colors hover:bg-[#F1EEE7] disabled:opacity-50"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
