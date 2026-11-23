"use client";

import type { CSSProperties } from "react";
import {
  ShoppingBag,
  Heart,
  Search,
  Bell,
  X,
  Plus,
} from "lucide-react";
import { themeCssVariables, type ThemeTokens } from "@/lib/theme";
import { resolveTickerIcon } from "@/lib/ticker";

export interface PreviewTicker {
  enabled: boolean;
  message: string;
  icon: string;
  iconPosition: "start" | "end";
}

interface ThemePreviewProps {
  tokens: ThemeTokens;
  ticker: PreviewTicker;
}

/** معاينة حية لكل الأسطح المتأثرة بالهوية — بتقرأ المتغيرات نفسها اللي الموقع بيقراها */
export function ThemePreview({ tokens, ticker }: ThemePreviewProps) {
  const vars = themeCssVariables(tokens) as unknown as CSSProperties;
  const { Icon, text } = resolveTickerIcon(ticker.icon);
  const tickerText = ticker.message.trim() || "توصيل مجاني للطلبات فوق 200 ج.م";
  const tickerContent = (
    <>
      {Icon ? (
        <Icon className="h-3.5 w-3.5 shrink-0 text-[var(--color-on-primary)]" />
      ) : text ? (
        <span className="shrink-0 text-[12px] leading-none">{text}</span>
      ) : null}
      <span className="truncate text-[10.5px] font-bold">{tickerText}</span>
    </>
  );

  return (
    <div
      style={vars}
      dir="rtl"
      className="overflow-hidden rounded-[18px] border border-[var(--color-border)] bg-[var(--color-page-background)] text-[var(--color-text-primary)]"
    >
      {/* الشريط العلوي */}
      {ticker.enabled && (
        <div className="flex items-center justify-center gap-2.5 border-b border-[var(--color-primary-hover)] bg-[var(--color-primary)] px-4 py-2 text-[var(--color-on-primary)]">
          <div className={`flex max-w-full items-center gap-2.5 ${ticker.iconPosition === "end" ? "flex-row-reverse" : ""}`}>
            {tickerContent}
          </div>
        </div>
      )}

      {/* الهيدر — خلفيته نفس خلفية الموقع */}
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-header-background)] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-primary)] text-[11px] font-black text-[var(--color-on-primary)]">
            R
          </span>
          <span className="text-[12px] font-black text-[var(--color-text-primary)]">روزماري</span>
        </div>
        <div className="flex items-center gap-1.5">
          {[Search, Heart, ShoppingBag, Bell].map((Glyph, index) => (
            <span
              key={index}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-icon)]"
            >
              <Glyph className="h-3.5 w-3.5" />
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-3.5 p-4">
        {/* الأزرار + الأيقونات */}
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className="rounded-full bg-[var(--color-primary)] px-4 py-2 text-[11px] font-bold text-[var(--color-on-primary)]">
            أضف للسلة
          </button>
          <button type="button" className="rounded-full bg-[var(--color-primary-hover)] px-4 py-2 text-[11px] font-bold text-[var(--color-on-primary)]">
            عند المرور (Hover)
          </button>
          <button type="button" className="rounded-full bg-[var(--color-primary-active)] px-4 py-2 text-[11px] font-bold text-[var(--color-on-primary)]">
            عند الضغط (Active)
          </button>
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-icon)]">
            <Heart className="h-4 w-4" />
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)]">
            <Plus className="h-4 w-4" />
          </span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-close-icon)]">
            <X className="h-4 w-4" />
          </span>
        </div>

        {/* كارت منتج + كارت تصنيف */}
        <div className="grid grid-cols-2 gap-3">
          <div className="overflow-hidden rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="h-16 bg-[var(--color-primary-soft)]" />
            <div className="space-y-1.5 p-3">
              <p className="text-[11px] font-black text-[var(--color-text-primary)]">بيتزا مارجريتا</p>
              <p className="text-[10px] text-[var(--color-text-muted)]">50 – 120 ج.م</p>
              <span className="inline-block rounded-full bg-[var(--color-primary)] px-3 py-1 text-[9.5px] font-bold text-[var(--color-on-primary)]">
                اطلب الآن
              </span>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
            <div className="h-16 bg-[var(--color-border-strong)]/40" />
            <div className="space-y-1 p-3">
              <p className="text-[11px] font-black text-[var(--color-text-primary)]">بيتزا</p>
              <p className="text-[10px] text-[var(--color-text-muted)]">6 منتجات</p>
            </div>
          </div>
        </div>

        {/* جدول */}
        <div className="overflow-hidden rounded-[14px] border border-[var(--color-border)]">
          <div className="flex items-center justify-between bg-[var(--color-surface-secondary)] px-3 py-2 text-[10px] font-black text-[var(--color-text-primary)]">
            <span>الطلب</span>
            <span>الإجمالي</span>
          </div>
          {[
            { id: "#RZ-1042", total: "240 ج.م" },
            { id: "#RZ-1043", total: "175 ج.م" },
          ].map((row) => (
            <div
              key={row.id}
              className="flex items-center justify-between border-t border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-3 py-2 text-[10px] font-semibold text-[var(--color-text-secondary)]"
            >
              <span dir="ltr">{row.id}</span>
              <span className="font-bold text-[var(--color-text-primary)]">{row.total}</span>
            </div>
          ))}
        </div>

        {/* مودال */}
        <div className="relative overflow-hidden rounded-[14px] border border-[var(--color-border)]">
          <div className="absolute inset-0 bg-[var(--color-text-primary)]/20" />
          <div className="relative m-3 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-3">
            <div className="flex items-start justify-between">
              <p className="text-[11px] font-black text-[var(--color-text-primary)]">تأكيد الطلب</p>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-close-icon)]">
                <X className="h-3.5 w-3.5" />
              </span>
            </div>
            <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">منطقة التوصيل: المعادي — رسوم 15 ج.م</p>
            <div className="mt-2.5 flex gap-2">
              <span className="rounded-full bg-[var(--color-primary)] px-3 py-1.5 text-[9.5px] font-bold text-[var(--color-on-primary)]">تأكيد</span>
              <span className="rounded-full bg-[var(--color-surface-secondary)] px-3 py-1.5 text-[9.5px] font-bold text-[var(--color-text-secondary)]">إلغاء</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
