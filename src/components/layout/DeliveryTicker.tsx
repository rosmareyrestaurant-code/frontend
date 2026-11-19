"use client";

import { Truck } from "lucide-react";
import { useDelivery } from "@/context/DeliveryContext";

/**
 * شريط متحرك أعلى الهيدر بجملة واحدة تجمع مناطق التوصيل المجاني اللي بيضيفها الإدمن.
 * الحركة من اليمين لليسار، وتتوقف عند تمرير الماوس.
 */
export default function DeliveryTicker() {
  const { activeZones } = useDelivery();

  if (activeZones.length === 0) return null;

  const names = activeZones.map((zone) => zone.name);
  const message = `توصيل مجاني إلى ${names.join(" و")}`;

  return (
    <div dir="ltr" className="relative z-40 overflow-hidden border-b border-[#ff7a00]/25 bg-gradient-to-l from-[#2a1708] via-[#1a1009] to-[#2a1708]">
      <div className="delivery-ticker-track flex w-max items-center py-2">
        {[0, 1].map((copy) => (
          <div key={copy} dir="rtl" aria-hidden={copy === 1} className="flex shrink-0 items-center gap-3 pe-12">
            <Truck className="h-4 w-4 shrink-0 text-[#ff7a00]" />
            <span className="whitespace-nowrap text-[11px] font-bold text-[#ffb066] sm:text-xs">
              {message}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
