"use client";

import { useDelivery } from "@/context/DeliveryContext";
import { resolveTickerIcon } from "@/lib/ticker";
import type { PublicTickerSettings } from "@/lib/storefront";

/**
 * شريط متحرك أعلى الهيدر: الجملة والأيقونة وترتيبها بيحددهم الأدمن من الداشبورد.
 * لونه بياخده تلقائياً من لون الأزرار الأساسي في هوية الموقع.
 * لو مفيش جملة محفوظة، بيرجع لنص مناطق التوصيل المجاني الافتراضي.
 */
export default function DeliveryTicker({ initial }: { initial: PublicTickerSettings }) {
  const { activeZones } = useDelivery();

  // لو الأدمن قافل الشريط، مفيش أي مساحة فاضية أعلى الهيدر
  if (!initial.enabled) return null;

  const customMessage = initial.message.trim();
  const names = activeZones.map((zone) => zone.name);
  const message = customMessage || (names.length ? `توصيل مجاني إلى ${names.join(" و")}` : "");

  if (!message) return null;

  const { Icon, text } = resolveTickerIcon(initial.icon);
  const iconFirst = initial.iconPosition !== "end";

  return (
    <div
      dir="ltr"
      className="relative z-40 overflow-hidden border-b border-[var(--color-primary-hover)] bg-[var(--color-primary)]"
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
    </div>
  );
}
