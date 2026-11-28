import type { Product } from "@/types";

export interface PriceRange {
  min: number;
  max: number;
  isRange: boolean;
  /** السعر القديم المشطوب لأرخص حجم متاح */
  minOriginal?: number;
  discountPercent: number | null;
}

/** صيغة سعر العرض الاختياري: 100 أو 100-200 (أو 100 – 200) */
const CARD_PRICE_REGEX = /^(\d+)(?:\s*[-–]\s*(\d+))?$/;

/**
 * لو الأدمن كتب سعر عرض يدوي على المنتج، نستخدمه في الكارت بدل حساب الأحجام.
 * أي قيمة غير صحيحة بتتجاهل ويرجع الحساب التلقائي زي ما كان.
 */
function parseCardPrice(value?: string): { min: number; max: number } | null {
  if (!value?.trim()) return null;
  const match = value.trim().match(CARD_PRICE_REGEX);
  if (!match) return null;

  const first = Number(match[1]);
  const second = match[2] ? Number(match[2]) : first;
  if (!Number.isFinite(first) || !Number.isFinite(second)) return null;

  return {
    min: Math.min(first, second),
    max: Math.max(first, second),
  };
}

/**
 * نطاق السعر المعروض في الكروت — بيتحسب من الأحجام الفعلية للمنتج،
 * ولو مفيش أحجام بيرجع السعر الأساسي زي ما هو.
 * سعر العرض اللي الأدمن بيكتبه (لو موجود) له الأولوية في العرض فقط،
 * ومعاملش في سعر الطلب الفعلي اللي بيحسبه السيرفر من الأحجام.
 */
export function getProductPriceRange(
  product: Pick<Product, "price" | "originalPrice" | "sizes" | "cardPrice">,
): PriceRange {
  const override = parseCardPrice(product.cardPrice);
  if (override) {
    return {
      min: override.min,
      max: override.max,
      isRange: override.max > override.min,
      // السعر القديم/الخصم متعلقين بالأحجام الحقيقية، فبنخبيهم مع العرض اليدوي
      // عشان الكارت ما يظهرش رقم وهي مش متطابقة.
      minOriginal: undefined,
      discountPercent: null,
    };
  }

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
