import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { CouponModel } from "@/models/Coupon";
import {
  success,
  badRequest,
  conflict,
  serverError,
  AppError,
} from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import { couponDurationUpdate } from "@/lib/coupons";
import { toAdminCoupon } from "@/lib/serialize";
import { createCouponSchema } from "@/lib/validation";


export const instant = false;

export async function GET(_req: NextRequest) {
  try {
    await requireAdmin();
    await connectToDatabase();

    const coupons = await CouponModel.find().sort({ createdAt: -1 }).lean();
    return success(
      coupons.map((c) => toAdminCoupon(c as Parameters<typeof toAdminCoupon>[0])),
    );
  } catch (e) {
    if (e instanceof AppError)
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = createCouponSchema.safeParse(body);
    if (!parsed.success)
      return badRequest(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");

    await connectToDatabase();
    const { durationDays, ...fields } = parsed.data;
    const coupon = await CouponModel.create({
      ...fields,
      ...couponDurationUpdate(durationDays),
    });
    return success(
      toAdminCoupon(coupon.toObject() as Parameters<typeof toAdminCoupon>[0]),
      "تم إضافة كوبون الخصم",
      201,
    );
  } catch (e) {
    if (e instanceof AppError)
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    // الكود مكرر (unique index)
    if ((e as { code?: number })?.code === 11000)
      return conflict("كود الخصم مستخدم بالفعل");
    return serverError();
  }
}
