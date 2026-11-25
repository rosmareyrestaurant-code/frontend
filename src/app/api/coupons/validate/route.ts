/**
 * POST /api/coupons/validate
 * معاينة فقط للعميل: يتحقق من وجود الكود ونشاطه ويرجع نسبة الخصم.
 * الخصم الفعلي يُحسب مرة ثانية على السيرفر وقت إنشاء الطلب.
 */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { findUsableCoupon } from "@/lib/coupons";
import {
  success,
  badRequest,
  serverError,
  AppError,
} from "@/lib/api-response";
import { clientIp, rateLimitOrThrow } from "@/lib/rate-limit";
import { validateCouponSchema } from "@/lib/validation";


export const instant = false;

export async function POST(req: NextRequest) {
  try {
    rateLimitOrThrow(`coupon:${clientIp(req)}`, 20, 60_000);

    const body = await req.json();
    const parsed = validateCouponSchema.safeParse(body);
    if (!parsed.success)
      return badRequest(parsed.error.issues[0]?.message ?? "كود الخصم غير صحيح");

    await connectToDatabase();
    const coupon = await findUsableCoupon(parsed.data.code);
    if (!coupon)
      return badRequest("كود الخصم غير صالح أو منتهي", "COUPON_INVALID");

    return success({
      code: coupon.code,
      discountPercent: coupon.discountPercent,
    });
  } catch (e) {
    if (e instanceof AppError)
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    return serverError();
  }
}
