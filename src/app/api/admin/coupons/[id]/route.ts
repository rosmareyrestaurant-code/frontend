import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { CouponModel } from "@/models/Coupon";
import {
  success,
  notFound,
  badRequest,
  conflict,
  serverError,
  AppError,
} from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import { toAdminCoupon } from "@/lib/serialize";
import { updateCouponSchema } from "@/lib/validation";


export const instant = false;

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const parsed = updateCouponSchema.safeParse(body);
    if (!parsed.success)
      return badRequest(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");

    await connectToDatabase();
    const updated = await CouponModel.findByIdAndUpdate(
      id,
      { $set: parsed.data },
      { new: true, runValidators: true },
    ).lean();
    if (!updated) return notFound("كوبون الخصم غير موجود");

    return success(
      toAdminCoupon(updated as Parameters<typeof toAdminCoupon>[0]),
      "تم تحديث كوبون الخصم",
    );
  } catch (e) {
    if (e instanceof AppError)
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    if ((e as { code?: number })?.code === 11000)
      return conflict("كود الخصم مستخدم بالفعل");
    return serverError();
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    await connectToDatabase();
    const deleted = await CouponModel.findByIdAndDelete(id);
    if (!deleted) return notFound("كوبون الخصم غير موجود");
    return success(null, "تم حذف كوبون الخصم");
  } catch (e) {
    if (e instanceof AppError)
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    return serverError();
  }
}
