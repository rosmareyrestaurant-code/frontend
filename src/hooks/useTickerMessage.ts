"use client";

import { useSyncExternalStore } from "react";

export const TICKER_KEY = "rosemary_ticker_message";
export const TICKER_EVENT = "rosemary_ticker_message";

/** الجملة المكتوبة من الإعدادات — فاضية يعني استخدم الجملة الافتراضية */
export function readTickerMessage(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(TICKER_KEY) ?? "";
  } catch {
    return "";
  }
}

export function writeTickerMessage(message: string) {
  try {
    const value = message.trim();
    if (value) window.localStorage.setItem(TICKER_KEY, value);
    else window.localStorage.removeItem(TICKER_KEY);
    window.dispatchEvent(new Event(TICKER_EVENT));
  } catch {
    // مساحة التخزين مش متاحة — التجربة ما تقفش
  }
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener(TICKER_EVENT, onStoreChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === TICKER_KEY) onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(TICKER_EVENT, onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function useTickerMessage(): string {
  return useSyncExternalStore(subscribe, readTickerMessage, () => "");
}
