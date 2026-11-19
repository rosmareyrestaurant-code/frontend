"use client";

import { useSyncExternalStore } from "react";

export const ADMIN_AUTH_KEY = "rosemary_admin_session";
const ADMIN_AUTH_EVENT = "rosemary_admin_session";

/** حالة دخول الأدمن في الواجهة (الجلسة الحقيقية في كوكي HttpOnly على السيرفر) */
export function readAdminAuth(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(ADMIN_AUTH_KEY) === "1";
  } catch {
    return false;
  }
}

export function signInAdmin() {
  try {
    window.localStorage.setItem(ADMIN_AUTH_KEY, "1");
    window.dispatchEvent(new Event(ADMIN_AUTH_EVENT));
  } catch { /* ignore */ }
}

let logoutAt = 0;

export function signOutAdmin() {
  try {
    window.localStorage.removeItem(ADMIN_AUTH_KEY);
    window.dispatchEvent(new Event(ADMIN_AUTH_EVENT));
  } catch { /* ignore */ }
}

/** تسجيل خروج مع منع بوابة الداش بورد من التحويل للوجن أثناء الرجوع للهوم */
export function beginAdminLogout() {
  logoutAt = Date.now();
  signOutAdmin();
}

export function isRecentLogout(): boolean {
  return Date.now() - logoutAt < 2000;
}

function subscribe(onStoreChange: () => void) {
  window.addEventListener(ADMIN_AUTH_EVENT, onStoreChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === ADMIN_AUTH_KEY) onStoreChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(ADMIN_AUTH_EVENT, onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

export function useAdminAuth(): boolean {
  return useSyncExternalStore(subscribe, readAdminAuth, () => false);
}
