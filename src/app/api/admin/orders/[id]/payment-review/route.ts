/**
 * POST /api/admin/orders/[id]/payment-review
 * قرار مراجعة الدفع من تفاصيل الطلب: { decision: "paid" | "unpaid", override?: boolean }
 * الموظف والوقت بيُحدّدوا على السيرفر من الجلسة — مش من المتصفح.
 */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { OrderModel } from "@/models/Order";
import { AdminModel } from "@/models/Admin";
import {
  success,
  badRequest,
  notFound,
  error,
  serverError,
  AppError,
} from "@/lib/api-response";
import { requireStaff } from "@/lib/auth";
import { toAdminOrder } from "@/lib/serialize";
import { paymentReviewSchema } from "@/lib/validation";
import { getPaymentDecision, isOnlinePaymentMethod, isPaymentVerified } from "@/lib/payment-review";

export const instant = false;

type IOrder = Parameters<typeof toAdminOrder>[0];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await requireStaff();
    const { id } = await params;

    const body = await req.json().catch(() => null);
    const parsed = paymentReviewSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? "قرار غير صحيح");
    }

    const { decision, override } = parsed.data;

    await connectToDatabase();
    const order = await OrderModel.findById(id).lean();
    if (!order) return notFound("الطلب غير موجود");

    if (!isOnlinePaymentMethod(order.paymentMethod)) {
      return badRequest("طلبات الكاش لا تحتاج مراجعة دفع", "NOT_ONLINE_PAYMENT");
    }

    const previous = (order as {
      paymentVerification?: {
        decision?: string | null;
        reviewedBy?: string | null;
        reviewedByName?: string | null;
        reviewedAt?: Date | string | null;
      };
    }).paymentVerification;

    const current = getPaymentDecision({
      paymentStatus: order.paymentStatus,
      paymentVerification: order.paymentVerification as {
        decision?: string | null;
        reviewedAt?: Date | string | null;
        reviewedBy?: string | null;
        reviewedByName?: string | null;
      },
    });

    // الطلبات القديمة المؤكدة بالـ paymentStatus فقط لسه محتاجة تسجيل قرار جديد
    if (!override && current === decision && previous?.decision === decision) {
      return success(
        toAdminOrder(order as unknown as IOrder),
        "القرار محفوظ بالفعل",
      );
    }

    if (isPaymentVerified(order.paymentStatus) && decision === "unpaid" && !override) {
      return error(
        "PAYMENT_ALREADY_VERIFIED",
        "تم تأكيد دفع هذا الطلب بالفعل",
        409,
      );
    }

    if (current !== "pending" && !override) {
      return error(
        "PAYMENT_REVIEW_EXISTS",
        "فيه قرار مراجعة محفوظ — أكّد التغيير",
        409,
      );
    }

    const admin = await AdminModel.findById(session.adminId)
      .select({ name: 1 })
      .lean();
    const adminName =
      (admin as { name?: string } | null)?.name || session.email;

    const now = new Date();
    // حماية من سباق موظفين: أي تحديث لازم يطابق وقت المراجعة اللي اتقرأ
    const guard: Record<string, unknown> = {
      _id: id,
      "paymentVerification.reviewedAt": previous?.reviewedAt ?? null,
    };

    const set: Record<string, unknown> = {
      "paymentVerification.decision": decision,
      "paymentVerification.reviewedBy": session.adminId,
      "paymentVerification.reviewedByName": adminName,
      "paymentVerification.reviewedAt": now,
      paymentStatus: decision === "paid" ? "verified" : "unpaid",
    };

    if (decision === "paid") {
      set.paymentVerifiedBy = session.adminId;
      set.paymentVerifiedByName = adminName;
      set.paymentVerifiedAt = now;
      set.verifiedAmount = order.total;
      set.paymentRejectionReason = "";
      set.paymentRejectedAt = null;
      set.paymentRejectedBy = "";
    } else {
      set.paymentVerifiedBy = "";
      set.paymentVerifiedByName = "";
      set.paymentVerifiedAt = null;
      set.verifiedAmount = null;
    }

    const update: Record<string, unknown> = { $set: set };
    if (current !== "pending") {
      update.$push = {
        "paymentVerification.history": {
          decision: current === "paid" ? "paid" : "unpaid",
          reviewedBy: previous?.reviewedBy || "",
          reviewedByName: previous?.reviewedByName || "",
          reviewedAt: previous?.reviewedAt || now,
        },
      };
    }

    const updated = await OrderModel.findOneAndUpdate(guard, update, {
      returnDocument: "after",
    }).lean();

    if (!updated) {
      return error(
        "PAYMENT_REVIEW_CONFLICT",
        "تغيّر قرار المراجعة من مستخدم تاني — حدّث الطلب",
        409,
      );
    }

    return success(
      toAdminOrder(updated as unknown as IOrder),
      decision === "paid" ? "تم تأكيد الدفع" : "تم تسجيل القرار",
    );
  } catch (e) {
    if (e instanceof AppError)
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    console.error("[POST /api/admin/orders/:id/payment-review]", e);
    return serverError();
  }
}
