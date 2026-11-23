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
import { requireStaff } from "@/lib/auth";
import { toAdminOrder } from "@/lib/serialize";
import { updateOrderSchema } from "@/lib/validation";

export const instant = false;

/** PATCH /api/admin/orders/:id/cashier-note — ملاحظة الكاشير على الطلب */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireStaff();
    const { id } = await params;

    const body = await req.json();
    if (typeof body?.cashierNote !== "string") {
      return badRequest("الملاحظة غير صحيحة");
    }
    const parsed = updateOrderSchema.safeParse({ cashierNote: body.cashierNote });
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? "الملاحظة غير صحيحة");
    }

    await connectToDatabase();
    const order = await OrderModel.findById(id);
    if (!order) return notFound("الطلب غير موجود");

    order.cashierNote = parsed.data.cashierNote ?? "";
    await order.save();

    return success(
      toAdminOrder(order.toObject() as Parameters<typeof toAdminOrder>[0]),
      "تم حفظ ملاحظة الكاشير",
    );
  } catch (e) {
    if (e instanceof AppError)
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    console.error("[PATCH /api/admin/orders/:id/cashier-note]", e);
    return serverError();
  }
}
