"use client";

import { useMemo, useSyncExternalStore } from "react";
import { Product, ProductSize } from "@/types";
import { AdminProduct } from "@/types/admin";
import { ALL_PRODUCTS } from "@/data/mockData";
import { MOCK_ADMIN_PRODUCTS } from "@/data/admin/products";

export const CATALOG_KEY = "rosemary_admin_products";
export const CATALOG_EVENT = "rosemary_admin_products";

/** البداية: بيانات الأدمن + أحجام المنتجات الأصلية عشان مفيش حاجة تضيع */
function seedCatalog(): AdminProduct[] {
  return MOCK_ADMIN_PRODUCTS.map((p) => {
    const siteProduct = ALL_PRODUCTS.find((sp) => sp.id === p.id);
    return {
      ...p,
      image: siteProduct?.image || p.image,
      sizes: siteProduct?.sizes?.map((s) => ({ ...s })) ?? p.sizes,
    };
  });
}

export function readCatalog(): AdminProduct[] {
  if (typeof window === "undefined") return seedCatalog();
  try {
    const raw = localStorage.getItem(CATALOG_KEY);
    if (!raw) return seedCatalog();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AdminProduct[]) : seedCatalog();
  } catch {
    return seedCatalog();
  }
}

// مخزن مشترك بيقرأ localStorage مرة واحدة ويblatt كل الكروت من نفس النسخة
let cached: AdminProduct[] | null = null;
let serverSeed: AdminProduct[] | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function reloadFromStorage() {
  cached = readCatalog();
  notify();
}

function onStorage(e: StorageEvent) {
  if (e.key === CATALOG_KEY) reloadFromStorage();
}

function subscribe(onStoreChange: () => void) {
  if (listeners.size === 0) {
    window.addEventListener("storage", onStorage);
    window.addEventListener(CATALOG_EVENT, reloadFromStorage);
  }
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    if (listeners.size === 0) {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(CATALOG_EVENT, reloadFromStorage);
    }
  };
}

function getSnapshot(): AdminProduct[] {
  if (cached === null) cached = readCatalog();
  return cached;
}

function getServerSnapshot(): AdminProduct[] {
  if (serverSeed === null) serverSeed = seedCatalog();
  return serverSeed;
}

export function writeCatalog(products: AdminProduct[]) {
  cached = products;
  try {
    localStorage.setItem(CATALOG_KEY, JSON.stringify(products));
    window.dispatchEvent(new Event(CATALOG_EVENT));
  } catch {
    // مساحة التخزين خلصت — التجربة مش هتقف
  }
  notify();
}

export function useAdminCatalog(): AdminProduct[] {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function isShown(p: AdminProduct) {
  return p.isVisible !== false && p.isAvailable !== false;
}

function applyOverride(base: Product, admin?: AdminProduct): Product {
  if (!admin) return base;
  const sizes: ProductSize[] | undefined = admin.sizes?.length
    ? admin.sizes.map((s) => ({ ...s }))
    : base.sizes;
  const defaultSize = sizes?.find((s) => s.isDefault) ?? sizes?.[0];

  return {
    ...base,
    name: admin.name || base.name,
    description: admin.description || base.description,
    image: admin.image || base.image,
    price: defaultSize?.price || admin.price || base.price,
    originalPrice: admin.originalPrice ?? defaultSize?.originalPrice ?? base.originalPrice,
    sizes,
    // وجود سجل أدمن للمنتج معناه إن اختيار الأدمن هو المسيطر على ظهوره في «الأكثر طلباً»
    isPopular: admin ? admin.isFeatured : base.isPopular,
  };
}

/** منتج أدمن جديد (من الفورم أو الإكسيل) على شكل منتج للموقع */
function adminToProduct(p: AdminProduct): Product {
  const sizes: ProductSize[] | undefined = p.sizes?.map((s) => ({ ...s }));
  const defaultSize = sizes?.find((s) => s.isDefault) ?? sizes?.[0];
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    image: p.image || "/images/menu/menu-1.jpg",
    price: defaultSize?.price || p.price || 0,
    originalPrice: p.originalPrice ?? defaultSize?.originalPrice,
    category: p.category,
    isPopular: p.isFeatured,
    sizes,
  };
}

/** منتج واحد بالتعديلات اللي الأدمن عملها (صورة مرفوعة / أحجام / سعر) */
export function useCatalogProduct(base: Product): Product {
  const catalog = useAdminCatalog();
  return useMemo(() => applyOverride(base, catalog.find((p) => p.id === base.id)), [base, catalog]);
}

/** مجموعة منتجات: تعديلات الأدمن + منتجات جديدة من نفس تصنيف القسم */
export function useCatalogProducts(base: Product[], includeAllCategories = false): Product[] {
  const catalog = useAdminCatalog();
  return useMemo(() => {
    const byId = new Map(catalog.map((p) => [p.id, p]));
    const baseIds = new Set(base.map((p) => p.id));
    const categories = includeAllCategories ? null : new Set(base.map((p) => p.category));

    const merged = base
      .filter((b) => {
        const admin = byId.get(b.id);
        return !admin || isShown(admin);
      })
      .map((b) => applyOverride(b, byId.get(b.id)));

    const added = catalog
      .filter(
        (p) =>
          !baseIds.has(p.id) &&
          (!categories || categories.has(p.category)) &&
          isShown(p),
      )
      .map(adminToProduct);

    return [...merged, ...added];
  }, [base, catalog, includeAllCategories]);
}
