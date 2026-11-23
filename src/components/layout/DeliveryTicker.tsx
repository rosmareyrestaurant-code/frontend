"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useDelivery } from "@/context/DeliveryContext";
import { resolveTickerIcon } from "@/lib/ticker";
import type { PublicTickerSettings } from "@/lib/storefront";

const TICKER_HIDDEN_KEY = "rozmaly:ticker-hidden";

export default function DeliveryTicker({ initial }: { initial: PublicTickerSettings }) {
  const { activeZones } = useDelivery();
  const [hiddenByCustomer, setHiddenByCustomer] = useState(false);

  useEffect(() => {
    try {
      setHiddenByCustomer(window.localStorage.getItem(TICKER_HIDDEN_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  if (!initial.enabled) return null;

  const customMessage = initial.message.trim();
  const names = activeZones.map((zone) => zone.name);
  const message = customMessage || (names.length ? `توصيل مجاني إلى ${names.join(" و")}` : "");

  if (!message) return null;

  if (hiddenByCustomer) {
    return (
      <div dir="ltr" className="relative z-40 flex justify-end bg-[var(--color-primary)] px-3 py-1">
        <button
          type="button"
          onClick={() => {
            try { window.localStorage.setItem(TICKER_HIDDEN_KEY, "0"); } catch { /* ignore */ }
            setHiddenByCustomer(false);
          }}
          aria-label="إظهار الشريط العلوي"
          className="delivery-ticker-actions flex h-6 w-6 items-center justify-center rounded-full text-[var(--color-on-primary)] transition-colors hover:bg-white/15"
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  const { Icon, text } = resolveTickerIcon(initial.icon);
  const iconFirst = initial.iconPosition !== "end";

  return (
    <div
      dir="ltr"
      className="relative z-40 flex items-stretch overflow-hidden border-b border-[var(--color-primary-hover)] bg-[var(--color-primary)]"
    >
      <div className="delivery-ticker-track flex w-max items-center py-2">
        {[0, 1].map((copy) => (
          <div key={copy} dir="rtl" aria-hidden={copy === 1} className="flex shrink-0 items-center gap-3 pe-12">
            {!iconFirst && (
              <span className="whitespace-nowrap text-[11px] font-bold text-[var(--color-on-primary)] sm:text-xs">
                {message}
              </span>
            )}
            {Icon ? (
              <Icon className="h-4 w-4 shrink-0 text-[var(--color-on-primary)]" />
            ) : text ? (
              <span className="shrink-0 text-sm leading-none text-[var(--color-on-primary)]" aria-hidden="true">
                {text}
              </span>
            ) : null}
            {iconFirst && (
              <span className="whitespace-nowrap text-[11px] font-bold text-[var(--color-on-primary)] sm:text-xs">
                {message}
              </span>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => {
          try { window.localStorage.setItem(TICKER_HIDDEN_KEY, "1"); } catch { /* ignore */ }
          setHiddenByCustomer(true);
        }}
        aria-label="إخفاء الشريط العلوي"
        className="delivery-ticker-actions flex w-9 shrink-0 items-center justify-center border-s border-white/15 text-[var(--color-on-primary)] transition-colors hover:bg-white/15"
      >
        <EyeOff className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
