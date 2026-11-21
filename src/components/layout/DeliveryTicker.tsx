"use client";

import { useEffect, useState } from "react";
import { useDelivery } from "@/context/DeliveryContext";
import { resolveTickerIcon } from "@/lib/ticker";

interface TickerSettings {
  message: string;
  icon: string;
}

/**
 * شريط متحرك أعلى الهيدر: الجملة والأيقونة بيحددهم الأدمن من الداشبورد.
 * لو مفيش جملة محفوظة، بيرجع لنص مناطق التوصيل المجاني الافتراضي.
 */
export default function DeliveryTicker() {
  const { activeZones } = useDelivery();
  const [ticker, setTicker] = useState<TickerSettings | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings/public", { cache: "no-store" })
      .then((res) => res.json())
      .then((d) => {
        if (cancelled || !d.success) return;
        setTicker({
          message: typeof d.data.tickerMessage === "string" ? d.data.tickerMessage : "",
          icon: typeof d.data.tickerIcon === "string" ? d.data.tickerIcon : "truck",
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const customMessage = ticker?.message.trim() ?? "";
  const names = activeZones.map((zone) => zone.name);
  const message = customMessage || (names.length ? `توصيل مجاني إلى ${names.join(" و")}` : "");

  if (!message) return null;

  const { Icon, text } = resolveTickerIcon(ticker?.icon ?? "truck");

  return (
    <div dir="ltr" className="relative z-40 overflow-hidden border-b border-[#697F6B] bg-[#526B58]">
      <div className="delivery-ticker-track flex w-max items-center py-2">
        {[0, 1].map((copy) => (
          <div key={copy} dir="rtl" aria-hidden={copy === 1} className="flex shrink-0 items-center gap-3 pe-12">
            {Icon ? (
              <Icon className="h-4 w-4 shrink-0 !text-white" />
            ) : text ? (
              <span className="shrink-0 text-sm leading-none" aria-hidden="true">
                {text}
              </span>
            ) : null}
            <span className="whitespace-nowrap text-[11px] font-bold !text-white sm:text-xs">
              {message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
