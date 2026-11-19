/**
 * أدوات تخزين Session Storage للعميل (السلة + المفضلة + آخر طلب).
 * - تُستدعى فقط داخل Client Components/effects (لا تُمسح window في Server Components).
 * - مع versioning لسهولة تغيير الشكل لاحقاً.
 * - بنية بيانات السلة: مراجع فقط (productId/quantity/size/addons/notes) — الأسعار من السيرفر.
 */
import { STORAGE_KEYS } from "./constants";
import type { CartItemInput, Order } from "@/types";

const isClient = () => typeof window !== "undefined";

function readJSON<T>(key: string, fallback: T): T {
  if (!isClient()) return fallback;
  try {
    const raw = window.sessionStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  if (!isClient()) return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // مساحة التخزين ممكن تخلص — التجربة ما توقفش
  }
}

/* ─── السلة ──────────────────────────────────────────────────────── */
export function readCart(): CartItemInput[] {
  const data = readJSON<{ v: number; items: CartItemInput[] } | null>(
    STORAGE_KEYS.cart,
    null,
  );
  if (!data || data.v !== STORAGE_KEYS.version) return [];
  return Array.isArray(data.items) ? data.items : [];
}

export function writeCart(items: CartItemInput[]): void {
  writeJSON(STORAGE_KEYS.cart, { v: STORAGE_KEYS.version, items });
}

export function clearCartStorage(): void {
  if (!isClient()) return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEYS.cart);
  } catch {
    /* ignore */
  }
}

/* ─── المفضلة (productId فقط) ────────────────────────────────────── */
export function readFavoriteIds(): string[] {
  const data = readJSON<{ v: number; ids: string[] } | null>(
    STORAGE_KEYS.favorites,
    null,
  );
  if (!data || data.v !== STORAGE_KEYS.version) return [];
  return Array.isArray(data.ids) ? data.ids : [];
}

export function writeFavoriteIds(ids: string[]): void {
  writeJSON(STORAGE_KEYS.favorites, { v: STORAGE_KEYS.version, ids });
}

/* ─── آخر طلب (لعرض صفحة التأكيد بعد التحديث) ────────────────────── */
export interface LastOrderRef {
  orderNumber: string;
  accessToken: string;
}

export function readLastOrder(): LastOrderRef | null {
  return readJSON<LastOrderRef | null>(STORAGE_KEYS.lastOrder, null);
}

export function writeLastOrder(ref: LastOrderRef): void {
  writeJSON(STORAGE_KEYS.lastOrder, ref);
}

export function clearLastOrder(): void {
  if (!isClient()) return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEYS.lastOrder);
  } catch {
    /* ignore */
  }
}

/* ─── الطلب الحالي (localStorage — يكمل بعد إغلاق التاب) ─────────── */
const CURRENT_ORDER_KEY = "rosemary_current_order";

export function readCurrentOrder(): Order | null {
  if (!isClient()) return null;
  try {
    const raw = window.localStorage.getItem(CURRENT_ORDER_KEY);
    return raw ? (JSON.parse(raw) as Order) : null;
  } catch {
    return null;
  }
}

export function writeCurrentOrder(order: Order): void {
  if (!isClient()) return;
  try {
    window.localStorage.setItem(CURRENT_ORDER_KEY, JSON.stringify(order));
  } catch {
    /* ignore */
  }
}

export function clearCurrentOrder(): void {
  if (!isClient()) return;
  try {
    window.localStorage.removeItem(CURRENT_ORDER_KEY);
  } catch {
    /* ignore */
  }
}
