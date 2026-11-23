"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import type { AdminOrder } from "@/types/admin";
import { printOrderFromQueue } from "@/lib/print-queue-client";

const AUTO_PRINT_KEY = "rozmaly_autoprint";
const AUTO_PRINT_EVENT = "rozmaly:autoprint";

/** الفحص الدوري بيشتغل على صفحة الطلبات فقط */
const POLL_INTERVAL_MS = 10_000;
/** أول فحص بعد فتح الصفحة — تأخير بسيط عشان ما يزاحمش تحميل الجدول */
const FIRST_POLL_DELAY_MS = 3_000;
/** أقصى عدد طلبات per دورة (تُطبع واحد ورا التاني) */
const BATCH_LIMIT = 5;

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

function isOrdersPath(pathname: string | null): boolean {
  return (
    pathname === "/dashboard/orders" ||
    (pathname?.startsWith("/dashboard/orders/") ?? false)
  );
}

/**
 * طابور الطباعة التلقائية: كل 10 ثواني (وإنت على صفحة الطلبات وبس)
 * بنسأل السيرفر عن الطلبات المستحقة، ونحجز كل طلب حجز ذري قبل طباعته.
 * - مفيش أكتر من timer واحد ولا طلبين متزامنين (inFlight + for loop).
 * - لو الشبكة قطعت، الدورة الجاية بتكمّل من نفس حالة الـ DB (مفيش فقدان).
 * - بيقف فوراً عند مغادرة الصفحة أو تسجيل الخروج أو قفل التoggle.
 */
export function useAutoPrintOrders() {
  const pathname = usePathname();
  const { enabled } = useAutoPrintSetting();

  useEffect(() => {
    if (!enabled || !isOrdersPath(pathname)) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let inFlight = false;

    const tick = async () => {
      if (cancelled || inFlight) return;
      if (document.visibilityState !== "visible") return;

      inFlight = true;
      try {
        const res = await fetch(`/api/admin/print-queue?limit=${BATCH_LIMIT}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const d = await res.json();
        if (!d?.success) return;

        const due = (d.data.orders ?? []) as AdminOrder[];
        for (const order of due) {
          // التوقف فوراً لو الtoggle اتقفل أو الصفحة اتقفلت
          if (cancelled) break;
          try {
            await printOrderFromQueue(order.id);
          } catch {
            /* لو طلب واحد فشل، نكمل الباقي في نفس الدورة */
          }
          // فاصل صغير بين الإيصالات عشان ما يتداخلوش في الطابعة
          await new Promise((resolve) => setTimeout(resolve, 700));
        }
      } catch {
        /* الشبكة قطعت — الدورة الجاية هتحاول من جديد من نفس الـ DB */
      } finally {
        inFlight = false;
      }
    };

    const schedule = (delay: number) => {
      timer = setTimeout(async () => {
        await tick();
        if (!cancelled) schedule(POLL_INTERVAL_MS);
      }, delay);
    };

    schedule(FIRST_POLL_DELAY_MS);

    // لما المستخدم يرجع للتاب نفحص فوراً بدل ما نستنى الدورة الجاية
    const onVisibility = () => {
      if (document.visibilityState === "visible") void tick();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [pathname, enabled]);
}
