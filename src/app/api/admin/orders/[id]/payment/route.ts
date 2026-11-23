/**
 * POST /api/admin/orders/[id]/payment
 * مراجعة المدير اليدوية لدفعة التحويل (فودافون كاش / إنستاباي):
 *   { action: "verify", transactionReference, amount } — تأكيد استلام المبلغ
 *   { action: "reject", reason }                        — رفض التحويل
 * المدير فقط (requireAdmin) — الكاشير ممنوع، والعميل لا يملك أي مسار هنا.
 */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { OrderModel } from "@/models/Order";
import { AdminModel } from "@/models/Admin";
import {
  success,
  badRequest,
  notFound,
  serverError,
  AppError,
} from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import { toAdminOrder } from "@/lib/serialize";
import { orderPaymentActionSchema } from "@/lib/validation";
import { isOnlinePaymentMethod, isPaymentVerified } from "@/lib/payment-review";

export const instant = false;

type IOrder = Parameters<typeof toAdminOrder>[0];

/** مرجع التحويل فريد — خطأ فهرس MongoDB يعني الرقم مستخدم في طلب تاني */
function isDuplicateKeyError(e: unknown): boolean {
  return (e as { code?: number }).code === 11000;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireAdmin();
    const { id } = await params;

    const body = await req.json().catch(() => null);
    const parsed = orderPaymentActionSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");
    }

    await connectToDatabase();
    const order = await OrderModel.findById(id);
    if (!order) return notFound("الطلب غير موجود");

    if (!isOnlinePaymentMethod(order.paymentMethod)) {
      return badRequest("طلبات الكاش عند الاستلام لا تحتاج تأكيد دفع", "NOT_ONLINE_PAYMENT");
    }
    if (isPaymentVerified(order.paymentStatus)) {
      return badRequest("تم تأكيد دفع هذا الطلب بالفعل", "PAYMENT_ALREADY_VERIFIED");
    }

    const admin = await AdminModel.findById(session.adminId)
      .select({ name: 1 })
      .lean();
    const adminName =
      (admin as { name?: string } | null)?.name || session.email;

    if (parsed.data.action === "reject") {
      // شرط الحالة داخل التحديث نفسه يمنع سباق تأكيد/رفض متزامن
      const updated = await OrderModel.findOneAndUpdate(
        { _id: id, paymentStatus: { $nin: ["verified", "paid"] } },
        {
          $set: {
            paymentStatus: "rejected",
            paymentRejectionReason: parsed.data.reason,
            paymentRejectedAt: new Date(),
            paymentRejectedBy: session.adminId,
          },
        },
        { returnDocument: "after" },
      ).lean();

      if (!updated) {
        return badRequest("تم تأكيد دفع هذا الطلب بالفعل", "PAYMENT_ALREADY_VERIFIED");
      }
      return success(
        toAdminOrder(updated as unknown as IOrder),
        "تم رفض التحويل وتسجيل السبب",
      );
    }

    // ─── تأكيد استلام المبلغ ───
    if (!order.paymentProofUrl) {
      return badRequest("لا توجد صورة تحويل لمراجعتها", "PAYMENT_PROOF_MISSING");
    }

    const totalCents = Math.round(order.total * 100);
    const amountCents = Math.round(parsed.data.amount * 100);
    if (amountCents !== totalCents) {
      return badRequest(
        `المبلغ المستلم لازم يطابق إجمالي الطلب (${order.total} ج.م)`,
        "AMOUNT_MISMATCH",
      );
    }

    let updated;
    try {
      updated = await OrderModel.findOneAndUpdate(
        { _id: id, paymentStatus: { $nin: ["verified", "paid"] } },
        {
          $set: {
            paymentStatus: "verified",
            transactionReference: parsed.data.transactionReference,
            verifiedAmount: parsed.data.amount,
            paymentVerifiedAt: new Date(),
            paymentVerifiedBy: session.adminId,
            paymentVerifiedByName: adminName,
            paymentRejectionReason: "",
            paymentRejectedAt: null,
            paymentRejectedBy: "",
          },
        },
        { returnDocument: "after" },
      ).lean();
    } catch (e) {
      if (isDuplicateKeyError(e)) {
        return badRequest(
          "رقم مرجع العملية مستخدم بالفعل في طلب آخر",
          "DUPLICATE_TRANSACTION_REFERENCE",
        );
      }
      throw e;
    }

    if (!updated) {
      return badRequest("تم تأكيد دفع هذا الطلب بالفعل", "PAYMENT_ALREADY_VERIFIED");
    }

    return success(
      toAdminOrder(updated as unknown as IOrder),
      "تم تأكيد استلام المبلغ بنجاح",
    );
  } catch (e) {
    if (e instanceof AppError)
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    console.error("[POST /api/admin/orders/:id/payment]", e);
    return serverError();
  }
}
