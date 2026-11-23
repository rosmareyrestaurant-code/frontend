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
import { updateOrderStatusSchema } from "@/lib/validation";
import { ORDER_STATUS_TRANSITIONS } from "@/types/admin";
import type { OrderStatus } from "@/types/admin";
import { awaitingPaymentReview } from "@/lib/payment-review";


export const instant = false;
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireStaff();
    const { id } = await params;

    const body = await req.json();
    const parsed = updateOrderStatusSchema.safeParse(body);
    if (!parsed.success)
      return badRequest(parsed.error.issues[0]?.message ?? "حالة غير صحيحة");

    const { status: newStatus } = parsed.data;

    await connectToDatabase();
    const order = await OrderModel.findById(id);
    if (!order) return notFound("الطلب غير موجود");

    const currentStatus = order.orderStatus as OrderStatus;
    const allowed = ORDER_STATUS_TRANSITIONS[currentStatus];

    if (!allowed.includes(newStatus as OrderStatus)) {
      return badRequest(
        `لا يمكن تغيير الحالة من "${currentStatus}" إلى "${newStatus}"`,
        "INVALID_TRANSITION",
      );
    }

    // لا يخرج الطلب الإلكتروني لمسار التجهيز/التسليم قبل تأكيد الدفع — حتى بالـ API مباشرة
    if (
      newStatus === "delivered" &&
      awaitingPaymentReview({
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        status: currentStatus,
      })
    ) {
      return badRequest(
        "لا يمكن تسليم الطلب قبل تأكيد استلام المبلغ من التحويل",
        "PAYMENT_NOT_VERIFIED",
      );
    }

    order.orderStatus = newStatus;
    await order.save();

    return success(
      toAdminOrder(order.toObject() as Parameters<typeof toAdminOrder>[0]),
      `تم تحديث الحالة إلى: ${newStatus}`,
    );
  } catch (e) {
    if (e instanceof AppError)
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    console.error("[PATCH /api/admin/orders/:id/status]", e);
    return serverError();
  }
}
