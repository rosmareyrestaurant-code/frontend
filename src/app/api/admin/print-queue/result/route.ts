/**
 * POST /api/admin/print-queue/result
 * إغلاق حجز الطباعة بنتيجة مؤكدة من المتصفح:
 *   printed — المتصفح أكد انتهاء أمر الطباعة (afterprint)
 *   failed  — فشل/لم يتأكد، فيرجع الطلب للطابور بعد مهلة قصيرة
 * أي إرسال بدون claimId صالح بيترفض (حماية من تكرار API).
 */
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
import { printResultSchema } from "@/lib/validation";
import { PRINT_RETRY_DELAY_MS } from "@/lib/print-queue";

export const instant = false;

const CLAIM_MATCH = (orderId: string, claimId: string) => ({
  _id: orderId,
  printClaimId: claimId,
  printState: "processing" as const,
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireStaff();

    const body = await req.json().catch(() => null);
    const parsed = printResultSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");
    }

    await connectToDatabase();
    const { orderId, claimId, status, error: printError } = parsed.data;
    const now = new Date();

    const update =
      status === "printed"
        ? {
            $set: {
              printState: "printed" as const,
              printedAt: now,
              printedBy: session.adminId,
              printClaimId: "",
              printClaimedAt: null,
              printClaimedBy: "",
              printLastError: "",
              printNextAttemptAt: null,
            },
          }
        : {
            $set: {
              printState: "failed" as const,
              printLastError: printError || "فشلت الطباعة على جهاز الكاشير",
              printNextAttemptAt: new Date(now.getTime() + PRINT_RETRY_DELAY_MS),
              printClaimId: "",
              printClaimedAt: null,
              printClaimedBy: "",
            },
          };

    const updated = await OrderModel.findOneAndUpdate(
      CLAIM_MATCH(orderId, claimId),
      update,
      { returnDocument: "after" },
    ).lean();

    if (!updated) {
      const exists = await OrderModel.exists({ _id: orderId });
      if (!exists) return notFound("الطلب غير موجود");
      return error(
        "CLAIM_LOST",
        "انتهت صلاحية حجز الطباعة (أو استُعيد من جهاز آخر) — راجع حالة الطلب وجرّب تاني",
        409,
      );
    }

    return success(
      toAdminOrder(updated as Parameters<typeof toAdminOrder>[0]),
      status === "printed" ? "تم تسجيل اكتمال الطباعة" : "تم تسجيل فشل الطباعة",
    );
  } catch (e) {
    if (e instanceof AppError)
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    console.error("[POST /api/admin/print-queue/result]", e);
    return serverError();
  }
}
