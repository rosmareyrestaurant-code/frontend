/**
 * منطق التسعير المركزي على السيرفر — المصدر الوحيد للحقيقة في الأسعار والإجماليات.
 * لا يُعتمد أبداً على الأسعار القادمة من المتصفح.
 */
import { AppError } from "./api-response";
import { getTodayKey } from "@/types/delivery";
import type { DeliveryZone } from "@/types/delivery";

export interface PricedItem {
  productId: string;
  productName: string;
  productImage: string;
  selectedSize?: { id: string; name: string; price: number };
  selectedAddons: { id: string; name: string; price: number }[];
  quantity: number;
  unitPrice: number;
  itemTotal: number;
  notes?: string;
  couponCode?: string;
  couponPercent?: number;
  couponDiscount?: number;
}

export interface PricingProduct {
  _id: { toString(): string };
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  sizes?: {
    id: string;
    name: string;
    detail?: string;
    price: number;
    originalPrice?: number;
    isDefault?: boolean;
  }[];
  addons?: { id: string; name: string; price: number; isDefault?: boolean }[];
  isAvailable: boolean;
  isVisible: boolean;
}

export interface PricingSettings {
  deliveryFee: number;
  minimumOrder: number;
}

export interface PricingCoupon {
  code: string;
  discountPercent: number;
}

export interface PricingResult {
  items: PricedItem[];
  subtotal: number;
  /** خصم الأسعار الأصلية للمنتجات (معلوماتي — لا يُطرح مرتين) */
  discount: number;
  couponCode?: string;
  couponPercent: number;
  couponDiscount: number;
  deliveryFee: number;
  total: number;
}

export function computeOrderPricing(
  cartItems: {
    productId: string;
    quantity: number;
    sizeId?: string;
    addonIds?: string[];
    notes?: string;
    couponCode?: string;
  }[],
  productsById: Map<string, PricingProduct>,
  settings: PricingSettings,
  zones: DeliveryZone[],
  customer: { areaId?: string; areaName?: string },
  /** خريطة أكواد صالحة — أو كوبون واحد للتوافق مع المسارات القديمة */
  coupons?: Map<string, PricingCoupon> | PricingCoupon,
): PricingResult {
  const couponByCode = new Map<string, PricingCoupon>();
  if (coupons instanceof Map) {
    for (const [code, coupon] of coupons) couponByCode.set(code, coupon);
  } else if (coupons) {
    couponByCode.set(coupons.code, coupons);
  }

  const items: PricedItem[] = [];
  const appliedCodes = new Set<string>();
  let subtotal = 0;
  let discount = 0;
  let couponDiscount = 0;

  for (const ci of cartItems) {
    const product = productsById.get(ci.productId);
    if (!product) throw new AppError("BAD_REQUEST", "منتج غير موجود في الطلب", 400);
    if (!product.isAvailable)
      throw new AppError("BAD_REQUEST", `المنتج "${product.name}" غير متاح حالياً`, 400);
    if (!product.isVisible)
      throw new AppError("BAD_REQUEST", `المنتج "${product.name}" غير معروض حالياً`, 400);

    // الحجم
    let basePrice = product.price;
    let originalPrice = product.originalPrice;
    let selectedSize: { id: string; name: string; price: number } | undefined;
    if (product.sizes && product.sizes.length) {
      const size = ci.sizeId
        ? product.sizes.find((s) => s.id === ci.sizeId)
        : undefined;
      if (!size)
        throw new AppError("BAD_REQUEST", `اختر حجم صحيح لـ "${product.name}"`, 400);
      basePrice = size.price;
      originalPrice = size.originalPrice ?? originalPrice;
      selectedSize = { id: size.id, name: size.name, price: size.price };
    }

    // الإضافات
    const selectedAddons: { id: string; name: string; price: number }[] = [];
    if (ci.addonIds?.length) {
      if (!product.addons?.length)
        throw new AppError("BAD_REQUEST", `المنتج "${product.name}" لا يدعم إضافات`, 400);
      for (const aid of ci.addonIds) {
        const addon = product.addons.find((a) => a.id === aid);
        if (!addon)
          throw new AppError("BAD_REQUEST", `إضافة غير صحيحة لـ "${product.name}"`, 400);
        selectedAddons.push({ id: addon.id, name: addon.name, price: addon.price });
      }
    }

    const addonsTotal = selectedAddons.reduce((s, a) => s + a.price, 0);
    const unitPrice = basePrice + addonsTotal;
    const itemTotal = unitPrice * ci.quantity;
    subtotal += itemTotal;
    if (originalPrice && originalPrice > basePrice) {
      discount += (originalPrice - basePrice) * ci.quantity;
    }

    // الكوبون الخاص بالمنتج — السيرفر يتحقق منه قبل الوصول هنا
    const itemCouponCode = ci.couponCode?.trim().toUpperCase();
    const itemCoupon = itemCouponCode
      ? couponByCode.get(itemCouponCode)
      : undefined;
    const itemCouponPercent = itemCoupon?.discountPercent ?? 0;
    const itemCouponDiscount =
      itemCoupon && itemCouponPercent > 0
        ? Math.min(itemTotal, Math.round((itemTotal * itemCouponPercent) / 100))
        : 0;
    if (itemCoupon && itemCouponDiscount > 0) appliedCodes.add(itemCoupon.code);
    couponDiscount += itemCouponDiscount;

    items.push({
      productId: String(product._id),
      productName: product.name,
      productImage: product.image,
      selectedSize,
      selectedAddons,
      quantity: ci.quantity,
      unitPrice,
      itemTotal,
      notes: ci.notes?.trim() || undefined,
      couponCode: itemCoupon?.code,
      couponPercent: itemCouponPercent,
      couponDiscount: itemCouponDiscount,
    });
  }

  // الحد الأدنى للطلب
  if (settings.minimumOrder > 0 && subtotal < settings.minimumOrder) {
    throw new AppError(
      "BAD_REQUEST",
      `الحد الأدنى للطلب ${settings.minimumOrder} ج.م`,
      400,
    );
  }

  // رسوم التوصيل — مجانية لو المكان ضمن منطقة نشطة لليوم الحالي
  let deliveryFee = settings.deliveryFee;
  const today = getTodayKey();
  const freeArea = zones.some(
    (z) =>
      z.isActive &&
      z.days.includes(today) &&
      ((customer.areaId && z.id === customer.areaId) ||
        (customer.areaName && z.name === customer.areaName)),
  );
  if (freeArea) deliveryFee = 0;

  // الخصم محسوب على العناصر اللي أدخل العميل معاها الكود فقط — قبل رسوم التوصيل.
  const codes = [...appliedCodes];
  const couponPercent =
    codes.length === 1 ? (couponByCode.get(codes[0])?.discountPercent ?? 0) : 0;
  const total = Math.max(0, subtotal - couponDiscount) + deliveryFee;
  return {
    items,
    subtotal,
    discount,
    couponCode: codes.join(", ") || undefined,
    couponPercent,
    couponDiscount,
    deliveryFee,
    total,
  };
}

/** توليد رقم طلب فريد: RZ-YYYYMMDD-XXXX */
export function generateOrderNumber(): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RZ-${ymd}-${rand}`;
}

/** توليد رمز وصول عشوائي آمن لكل طلب (يُعطى للعميل لعرض تفاصيل طلبه) */
export function generateAccessToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
