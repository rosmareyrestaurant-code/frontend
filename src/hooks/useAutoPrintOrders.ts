"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { NEW_ORDERS_EVENT, type NewOrderNotification } from "@/hooks/useNewOrders";
import { printReceiptInFrame } from "@/lib/receipt";
import type { AdminOrder } from "@/types/admin";

const AUTO_PRINT_KEY = "rozmaly_autoprint";
const AUTO_PRINT_EVENT = "rozmaly:autoprint";

export function readAutoPrint(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(AUTO_PRINT_KEY) === "1";
  } catch {
    return false;
  }
}

export function setAutoPrint(enabled: boolean) {
  try {
    window.localStorage.setItem(AUTO_PRINT_KEY, enabled ? "1" : "0");
    window.dispatchEvent(new Event(AUTO_PRINT_EVENT));
  } catch {
    /* ignore */
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(AUTO_PRINT_EVENT, onChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === AUTO_PRINT_KEY) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(AUTO_PRINT_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** إعداد الطباعة التلقائية على الجهاز ده */
export function useAutoPrintSetting() {
  const enabled = useSyncExternalStore(subscribe, readAutoPrint, () => false);
  const toggle = useCallback(() => setAutoPrint(!readAutoPrint()), []);
  return { enabled, toggle, setEnabled: setAutoPrint };
}

/**
 * يطبع أي طلب جديد تلقائياً على الطابعة الافتراضية.
 * بيتفعّل من صفحة الطلبات، وبيشتغل على أي صفحة داخل الداشبورد.
 */
export function useAutoPrintOrders() {
  const enabledRef = useRef(false);
  const queueRef = useRef(Promise.resolve());

  useEffect(() => {
    enabledRef.current = readAutoPrint();
    const sync = () => {
      enabledRef.current = readAutoPrint();
    };
    window.addEventListener(AUTO_PRINT_EVENT, sync);
    const onStorage = (e: StorageEvent) => {
      if (e.key === AUTO_PRINT_KEY) sync();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(AUTO_PRINT_EVENT, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    const onNewOrders = (event: Event) => {
      if (!enabledRef.current) return;
      const list = ((event as CustomEvent).detail ?? []) as NewOrderNotification[];
      if (!list.length) return;

      // بنطبع الأقدم الأول وواحد ورا التاني عشان الإيصالات متتداخلش
      queueRef.current = queueRef.current.then(async () => {
        for (const notification of [...list].reverse()) {
          try {
            const res = await fetch(`/api/admin/orders/${notification.id}`, { cache: "no-store" });
            const d = await res.json();
            if (d?.success && d.data) printReceiptInFrame(d.data as AdminOrder);
          } catch {
            /* لو طلب واحد فشل، نكمل اللي بعده */
          }
          await new Promise((resolve) => setTimeout(resolve, 800));
        }
      });
    };

    window.addEventListener(NEW_ORDERS_EVENT, onNewOrders);
    return () => window.removeEventListener(NEW_ORDERS_EVENT, onNewOrders);
  }, []);
}
