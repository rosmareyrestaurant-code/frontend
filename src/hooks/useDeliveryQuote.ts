"use client";

import { useEffect, useState } from "react";
import { useDelivery } from "@/context/DeliveryContext";
import { getTodayKey } from "@/types/delivery";

/** حساب عرض رسوم التوصيل في السلة — نفس منطق السيرفر في lib/pricing.ts */
export function useDeliveryQuote() {
  const { selectedZone } = useDelivery();
  const [storeFee, setStoreFee] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings/public", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.success) setStoreFee(Number(d.data.deliveryFee) || 0);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const isFree = !!selectedZone && selectedZone.days.includes(getTodayKey());
  const amount = isFree ? 0 : storeFee;
  const label = isFree ? "توصيل مجاني" : storeFee > 0 ? `${storeFee} ج.م` : "يحدد لاحقاً";

  return { isFree, amount, label, fee: storeFee };
}
