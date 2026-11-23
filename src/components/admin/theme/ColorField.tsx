"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { THEME_HEX_REGEX } from "@/lib/theme";

interface ColorFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  /** للخصائص المتقدمة: فراغ = اشتقاق تلقائي من الأساسي */
  allowAuto?: boolean;
  /** اللون الناتج تلقائياً — يظهر لما الحقل فاضي */
  derived?: string;
}

export function ColorField({ label, value, onChange, hint, allowAuto = false, derived }: ColorFieldProps) {
  const [text, setText] = useState(value);
  const [lastValue, setLastValue] = useState(value);
  // مزامنة نص الحقل مع القيمة الجاية من برّه (إعادة تعيين/تلقائي) من غير Effect
  if (value !== lastValue) {
    setLastValue(value);
    setText(value);
  }

  const normalized = text.trim().toUpperCase();
  const valid = THEME_HEX_REGEX.test(normalized);
  const auto = allowAuto && !value.trim();

  const handleText = (next: string) => {
    setText(next);
    const upper = next.trim().toUpperCase();
    if (THEME_HEX_REGEX.test(upper)) onChange(upper);
    else if (allowAuto && !next.trim()) onChange("");
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-bold text-[var(--color-text-muted)]">{label}</label>
        {allowAuto && (
          <button
            type="button"
            onClick={() => onChange("")}
            disabled={auto}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold transition-colors ${
              auto
                ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)]"
            }`}
            title="اشتقاق اللون تلقائياً من اللون الأساسي"
          >
            <RotateCcw className="h-2.5 w-2.5" />
            {auto ? "تلقائي" : "رجّع للتلقائي"}
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span
          className="relative h-10 w-11 shrink-0 overflow-hidden rounded-[10px] border border-[var(--color-control-border)]"
          style={{ backgroundColor: auto ? derived : value || "#ffffff" }}
        >
          <input
            type="color"
            aria-label={`اختيار ${label}`}
            value={valid ? normalized : derived || "#000000"}
            onChange={(event) => {
              onChange(event.target.value.toUpperCase());
              setText(event.target.value.toUpperCase());
            }}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </span>
        <input
          type="text"
          dir="ltr"
          maxLength={7}
          value={text}
          placeholder="#50604D"
          onChange={(event) => handleText(event.target.value)}
          className={`w-full rounded-[12px] border bg-[var(--color-surface-soft)] px-3 py-2.5 font-mono text-[13px] uppercase tracking-wide text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-border)]/20 ${
            valid || (allowAuto && !text.trim())
              ? "border-[var(--color-control-border)] focus:border-[var(--color-primary-border)]"
              : "border-[#C25B4F]"
          }`}
        />
      </div>
      {hint && <p className="text-[10px] leading-relaxed text-[var(--color-text-muted)]">{hint}</p>}
      {!valid && !(allowAuto && !text.trim()) && (
        <p className="text-[10px] font-bold text-[#C25B4F]">لون HEX غير صحيح — لازم يبدأ بـ # ويتبعه 6 أرقام أو حروف مثل #50604D</p>
      )}
    </div>
  );
}
