"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface NewOrderNotification {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  createdAt: string;
}

/** الحدث اللي بيتبعت للصفحات (زي صفحة الطلبات) لما يوصل طلب جديد */
export const NEW_ORDERS_EVENT = "rosemary:new-orders";

const LAST_CHECK_KEY = "rozmaly_orders_last_check";
const SOUND_KEY = "rozmaly_admin_sound";
const POLL_INTERVAL_MS = 15_000;
/** لو آخر فحص أقدم من يوم، بنبدأ من دلوقتي بدل ما نطلع إشعارات قديمة */
const BASELINE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!audioCtx) audioCtx = new Ctor();
    return audioCtx;
  } catch {
    return null;
  }
}

/** المتصفحات بتمنع الصوت قبل أي تفاعل من المستخدم — بنفتح الـ AudioContext أول ضغطة */
export function unlockNotificationSound() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === "suspended") void ctx.resume().catch(() => {});
}

function playOrderChime() {
  const ctx = getAudioContext();
  if (!ctx || ctx.state !== "running") return;
  [880, 1174.66].forEach((freq, index) => {
    const start = ctx.currentTime + index * 0.18;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.2, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.55);
  });
}

export function useNewOrders() {
  const [notifications, setNotifications] = useState<NewOrderNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const sinceRef = useRef<number | null>(null);
  const soundEnabledRef = useRef(true);
  const inFlightRef = useRef(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(SOUND_KEY) === "off") {
        soundEnabledRef.current = false;
        setSoundEnabled(false);
      }
      const stored = Number(localStorage.getItem(LAST_CHECK_KEY));
      const now = Date.now();
      sinceRef.current =
        Number.isFinite(stored) && stored > now - BASELINE_MAX_AGE_MS ? stored : now;
    } catch {
      sinceRef.current = Date.now();
    }

    const unlock = () => unlockNotificationSound();
    document.addEventListener("pointerdown", unlock, { once: true });
    document.addEventListener("keydown", unlock, { once: true });
    return () => {
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
    };
  }, []);

  const poll = useCallback(async () => {
    const since = sinceRef.current;
    if (since == null || inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      const res = await fetch(`/api/admin/notifications/orders?since=${since}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const d = await res.json();
      if (!d?.success) return;

      const orders: NewOrderNotification[] = d.data.orders ?? [];
      const serverTime: number = d.data.serverTime;
      sinceRef.current = serverTime;
      try {
        localStorage.setItem(LAST_CHECK_KEY, String(serverTime));
      } catch {
        /* ignore */
      }
      setPendingCount(d.data.pendingCount ?? 0);

      if (orders.length > 0) {
        setNotifications((prev) => {
          const seen = new Set(prev.map((n) => n.id));
          return [...orders.filter((n) => !seen.has(n.id)), ...prev].slice(0, 20);
        });
        setUnreadCount((count) => count + orders.length);
        if (soundEnabledRef.current) playOrderChime();
        window.dispatchEvent(new CustomEvent(NEW_ORDERS_EVENT, { detail: orders }));
      }
    } catch {
      /* الشبكة ممكن تكون قطعت لحظياً — نحاول تاني في الدورة الجاية */
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      if (timer) return;
      void poll();
      timer = setInterval(() => void poll(), POLL_INTERVAL_MS);
    };
    const stop = () => {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") start();
      else stop();
    };

    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [poll]);

  const markAllRead = useCallback(() => setUnreadCount(0), []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      soundEnabledRef.current = next;
      try {
        localStorage.setItem(SOUND_KEY, next ? "on" : "off");
      } catch {
        /* ignore */
      }
      if (next) {
        unlockNotificationSound();
        // resume() غير متزامن — نستنى لحظة قبل معاينة الصوت
        window.setTimeout(playOrderChime, 150);
      }
      return next;
    });
  }, []);

  return {
    notifications,
    unreadCount,
    pendingCount,
    soundEnabled,
    markAllRead,
    toggleSound,
  };
}
