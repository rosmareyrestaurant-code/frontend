import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { OrderModel } from "@/models/Order";
import {
  success,
  notFound,
  badRequest,
  serverError,
  AppError,
} from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import { toAdminOrder } from "@/lib/serialize";
import { updateOrderSchema } from "@/lib/validation";


export const instant = false;
/** GET /api/admin/orders/:id — تفاصيل طلب */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    await connectToDatabase();

    const order = await OrderModel.findById(id).lean();
    if (!order) return notFound("الطلب غير موجود");
    return success(toAdminOrder(order as Parameters<typeof toAdminOrder>[0]));
  } catch (e) {
    if (e instanceof AppError)
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    return serverError();
  }
}

/** PATCH /api/admin/orders/:id — تعديل بيانات العميل والملاحظات */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await req.json();
    const parsed = updateOrderSchema.safeParse(body);
    if (!parsed.success)
      return badRequest(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");

    await connectToDatabase();
    const order = await OrderModel.findByIdAndUpdate(
      id,
      { $set: parsed.data },
      { new: true },
    ).lean();
    if (!order) return notFound("الطلب غير موجود");

    return success(toAdminOrder(order as Parameters<typeof toAdminOrder>[0]));
  } catch (e) {
    if (e instanceof AppError)
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    return serverError();
  }
}

/** DELETE /api/admin/orders/:id */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    await connectToDatabase();

    const order = await OrderModel.findByIdAndDelete(id);
    if (!order) return notFound("الطلب غير موجود");
    return success(null, "تم حذف الطلب");
  } catch (e) {
    if (e instanceof AppError)
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    return serverError();
  }
}
