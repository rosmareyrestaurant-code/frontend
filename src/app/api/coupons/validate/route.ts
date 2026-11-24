/**
 * POST /api/coupons/validate
 * معاينة فقط للعميل: يتحقق من وجود الكود ونشاطه ويرجع نسبة الخصم.
 * الخصم الفعلي يُحسب مرة ثانية على السيرفر وقت إنشاء الطلب.
 */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { CouponModel } from "@/models/Coupon";
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
    const coupon = await CouponModel.findOne({
      code: parsed.data.code,
      isActive: true,
    }).lean();

    if (!coupon)
      return badRequest("كود الخصم غير صالح أو غير مُفعّل", "COUPON_INVALID");

    return success({
      code: parsed.data.code,
      discountPercent: Number(
        (coupon as { discountPercent?: number }).discountPercent ?? 0,
      ),
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
