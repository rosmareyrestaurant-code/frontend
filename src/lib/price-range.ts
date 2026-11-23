import type { Product } from "@/types";

export interface PriceRange {
  min: number;
  max: number;
  isRange: boolean;
  /** السعر القديم المشطوب لأرخص حجم متاح */
  minOriginal?: number;
  discountPercent: number | null;
}

/**
 * نطاق السعر المعروض في الكروت — بيتحسب من الأحجام الفعلية للمنتج،
 * ولو مفيش أحجام بيرجع السعر الأساسي زي ما هو.
 */
export function getProductPriceRange(
  product: Pick<Product, "price" | "originalPrice" | "sizes">,
): PriceRange {
  const variants = (product.sizes ?? []).filter(
    (size) => Number.isFinite(size.price) && size.price > 0,
  );

  if (!variants.length) {
    const original =
      product.originalPrice && product.originalPrice > product.price
        ? product.originalPrice
        : undefined;
    return {
      min: product.price,
      max: product.price,
      isRange: false,
      minOriginal: original,
      discountPercent: original
        ? Math.round(((original - product.price) / original) * 100)
        : null,
    };
  }

  const prices = variants.map((size) => size.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const cheapestOriginal = variants.find((size) => size.price === min)?.originalPrice;
  const minOriginal = cheapestOriginal && cheapestOriginal > min ? cheapestOriginal : undefined;

  let discountPercent: number | null = null;
  for (const size of variants) {
    if (size.originalPrice && size.originalPrice > size.price) {
      const percent = Math.round(((size.originalPrice - size.price) / size.originalPrice) * 100);
      if (percent > (discountPercent ?? 0)) discountPercent = percent;
    }
  }

  return { min, max, isRange: max > min, minOriginal, discountPercent };
}

export function formatPriceRange(range: PriceRange): string {
  return range.isRange ? `${range.min} – ${range.max}` : `${range.min}`;
}
