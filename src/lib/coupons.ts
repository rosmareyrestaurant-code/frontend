/**
 * أدوات التحقق من كوبونات الخصم — تُستخدم في معاينة العميل ووقت إنشاء الطلب.
 * النسبة تُقرأ دائماً من قاعدة البيانات، ولا يُوثق بأي قيمة قادمة من المتصفح.
 */
import { CouponModel } from "@/models/Coupon";

export interface UsableCoupon {
  code: string;
  discountPercent: number;
  durationDays?: number | null;
  expiresAt?: Date | string | null;
}

interface CouponDoc {
  code?: string;
  discountPercent?: number;
  durationDays?: number | null;
  expiresAt?: Date | string | null;
}

function isExpired(coupon: CouponDoc): boolean {
  if (!coupon.expiresAt) return false;
  const expiresAt = new Date(coupon.expiresAt).getTime();
  return Number.isFinite(expiresAt) && expiresAt <= Date.now();
}

/** تحويل المدة بالأيام إلى حقول الحفظ — undefined تعني عدم تغيير الحقل */
export function couponDurationUpdate(durationDays?: number | null): {
  durationDays?: number | null;
  expiresAt?: Date | null;
} {
  if (durationDays === undefined) return {};
  if (durationDays === null) return { durationDays: null, expiresAt: null };
  return {
    durationDays,
    expiresAt: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000),
  };
}

/** كوبون نشط وغير منتهٍ — أو null لو الكود غير صالح */
export async function findUsableCoupon(rawCode: string): Promise<UsableCoupon | null> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return null;

  const coupon = await CouponModel.findOne({ code, isActive: true }).lean();
  if (!coupon || isExpired(coupon as CouponDoc)) return null;

  return {
    code,
    discountPercent: Number((coupon as CouponDoc).discountPercent ?? 0),
    durationDays: (coupon as CouponDoc).durationDays ?? null,
    expiresAt: (coupon as CouponDoc).expiresAt ?? null,
  };
}
