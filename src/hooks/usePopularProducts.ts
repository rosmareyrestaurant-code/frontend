"use client";

import { useEffect, useMemo, useState } from "react";
import { ALL_PRODUCTS } from "@/data/mockData";
import { Product } from "@/types";
import { useAdminCatalog, useCatalogProducts } from "@/hooks/useCatalog";
import { useCustomerOrders } from "@/hooks/useCustomerOrders";
import { currentTime } from "@/lib/currentTime";

/** أي منتج يتطلب 50 مرة أو أكثر خلال آخر 7 أيام يبقى من الأكثر طلباً تلقائياً */
export const POPULAR_THRESHOLD = 50;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** عدد مرات طلب كل منتج خلال آخر ٧ أيام (مجموع الكميات، مع تجاهل الطلبات القديمة) */
export function useWeeklyOrderCounts(): Map<string, number> {
  const orders = useCustomerOrders();
  const [now, setNow] = useState(0);

  useEffect(() => {
    const refresh = () => setNow(currentTime());
    queueMicrotask(refresh);
    const timer = setInterval(refresh, 60_000);
    return () => clearInterval(timer);
  }, []);

  return useMemo(() => {
    const counts = new Map<string, number>();
    if (!now) return counts;
    const cutoff = now - WEEK_MS;

    orders.forEach((order) => {
      const time = Date.parse(order.createdAt);
      if (!Number.isFinite(time) || time < cutoff) return;

      order.items.forEach((item) => {
        const id = item.product?.id;
        if (!id) return;
        counts.set(id, (counts.get(id) ?? 0) + Math.max(1, item.quantity || 0));
      });
    });

    return counts;
  }, [orders, now]);
}

export interface PopularEntry {
  product: Product;
  weeklyOrders: number;
  /** الأدمن (أو البيانات الأساسية) عيّنه كمنتج مميز */
  manual: boolean;
  /** وصل لـ 50 طلب في آخر أسبوع */
  auto: boolean;
  isPopular: boolean;
}

/** كل المنتجات مع مصدر كل منتج في قائمة «الأكثر طلباً» */
export function usePopularEntries(): PopularEntry[] {
  const counts = useWeeklyOrderCounts();
  const catalog = useAdminCatalog();
  const products = useCatalogProducts(ALL_PRODUCTS, true);

  const manualIds = useMemo(
    () => new Set(catalog.filter((p) => p.isFeatured).map((p) => p.id)),
    [catalog],
  );

  return useMemo(
    () =>
      products.map((product) => {
        const weeklyOrders = counts.get(product.id) ?? 0;
        const auto = weeklyOrders >= POPULAR_THRESHOLD;
        const manual = manualIds.has(product.id) || product.isPopular === true;
        return {
          product,
          weeklyOrders,
          manual,
          auto,
          isPopular: manual || auto,
        };
      }),
    [products, counts, manualIds],
  );
}

/** قائمة المنتجات اللي هتظهر في سكشن «الأكثر طلباً» في الصفحة الرئيسية */
export function usePopularProducts(): Product[] {
  return usePopularEntries()
    .filter((entry) => entry.isPopular)
    .map((entry) => entry.product);
}
