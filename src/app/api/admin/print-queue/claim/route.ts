/**
 * POST /api/admin/print-queue/claim
 * حجز ذري لطلب واحد قبل الطباعة — جهاز واحد فقط ينجح لنفس الطلب.
 * الطباعة مسموحة لأي طلب غير ملغي (بما فيها التحويل غير المؤكد)؛
 * حالة الدفع لا تتغيّر هنا إطلاقاً، وبوابة التجهيز/التسليم تبقى منفصلة.
 */
import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { OrderModel } from "@/models/Order";
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
import { printClaimSchema } from "@/lib/validation";
import {
  claimableFilter,
  duePrintFilter,
  PRINT_MAX_AUTO_ATTEMPTS,
} from "@/lib/print-queue";

export const instant = false;

export async function POST(req: NextRequest) {
  try {
    const session = await requireStaff();

    const body = await req.json().catch(() => null);
    const parsed = printClaimSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");
    }

    await connectToDatabase();
    const { orderId, manual } = parsed.data;
    const claimId = randomUUID();
    const now = new Date();

    const eligible = manual ? claimableFilter(now) : duePrintFilter(now);
    const updated = await OrderModel.findOneAndUpdate(
      { _id: orderId, ...eligible },
      {
        $set: {
          printState: "processing",
          printClaimId: claimId,
          printClaimedAt: now,
          printClaimedBy: session.adminId,
          printLastAttemptAt: now,
          printLastError: "",
          printNextAttemptAt: null,
        },
        /*
         * المحاولة اليدوية مقصودة ومنفصلة: نستنفد رصيد المحاولات التلقائية
         * حتى لو فشلت قبل print()، فلا تعيد الطلب إلى حلقة الطابور.
         */
        $inc: { printAttempts: manual ? PRINT_MAX_AUTO_ATTEMPTS : 1 },
      },
      { returnDocument: "after" },
    ).lean();

    if (!updated) {
      // توضيح سبب الرفض من الحالة الحالية — بدون أي تعديل
      const current = await OrderModel.findById(orderId)
        .select({
          orderStatus: 1,
          paymentMethod: 1,
          paymentStatus: 1,
          printState: 1,
        })
        .lean();
      if (!current) return notFound("الطلب غير موجود");
      if (current.orderStatus === "cancelled") {
        return badRequest("الطلب ملغي — لا يمكن طباعته", "ORDER_CANCELLED");
      }
      if (current.printState === "processing") {
        return error(
          "PRINT_IN_PROGRESS",
          "الطلب قيد الطباعة الآن على جهاز آخر — جرّب بعد لحظات",
          409,
        );
      }
      if (current.printState === "printed" && !manual) {
        return error("ALREADY_PRINTED", "تمت طباعة هذا الطلب بالفعل", 409);
      }
      return error(
        "PRINT_NOT_CLAIMABLE",
        "الطلب غير متاح للطباعة الآن",
        409,
      );
    }

    return success(
      {
        order: toAdminOrder(updated as Parameters<typeof toAdminOrder>[0]),
        claimId,
      },
      "تم حجز الطلب للطباعة",
    );
  } catch (e) {
    if (e instanceof AppError)
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    console.error("[POST /api/admin/print-queue/claim]", e);
    return serverError();
  }
}
