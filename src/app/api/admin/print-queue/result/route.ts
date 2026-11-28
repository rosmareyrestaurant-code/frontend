/**
 * POST /api/admin/print-queue/result
 * إغلاق حجز الطباعة بنتيجة آمنة من المتصفح:
 *   printed     — وصلت إشارة afterprint بعد إرسال أمر الطباعة (دليل برمجي،
 *                 لا يثبت مادياً خروج الورقة؛ القيد موثّق في التقرير)
 *   unconfirmed — أُرسل print() لكن لم تصل إشارة انتهاء واجهة الطباعة
 *   failed      — فشل تجهيز المستند/الإطار قبل استدعاء print()
 * أي إرسال بدون claimId مرتبط بحجز «processing» مرفوض. الحالة القادمة من
 * المتصفح لا تُثق إلا بعد تطابقها مع الحجز الذري، ولا توجد هنا حقول جديدة.
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
import {
  PRINT_RETRY_DELAY_MS,
  PRINT_UNCONFIRMED_PREFIX,
} from "@/lib/print-queue";

export const instant = false;

const CLAIM_MATCH = (orderId: string, claimId: string) => ({
  _id: orderId,
  printClaimId: claimId,
  printState: "processing" as const,
});

const CLEAR_CLAIM = {
  printClaimId: "",
  printClaimedAt: null,
  printClaimedBy: "",
};

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

    const set =
      status === "printed"
        ? {
            // afterprint هو أفضل إشارة متاحة في المتصفح، وليس إثبات خروج ورق.
            printState: "printed" as const,
            printedAt: now,
            printedBy: session.adminId,
            printLastError: "",
            printNextAttemptAt: null,
            ...CLEAR_CLAIM,
          }
        : status === "unconfirmed"
          ? {
              // حالة مستقلة: لا إعادة تلقائية، ولا حجز بعيد، ولا اعتبارها فشل.
              printState: "unconfirmed" as const,
              printLastError: printError?.startsWith(PRINT_UNCONFIRMED_PREFIX)
                ? printError
                : `${PRINT_UNCONFIRMED_PREFIX} ${
                    printError || "أُرسل أمر طباعة ولم تصل إشارة انتهاء الواجهة"
                  }`,
              printNextAttemptAt: null,
              ...CLEAR_CLAIM,
            }
          : {
              // فشل حقيقي قبل print(): مهلة قصيرة وعدد محاولات محدود في dueFilter.
              printState: "failed" as const,
              printLastError: printError || "فشلت الطباعة على جهاز الكاشير",
              printNextAttemptAt: new Date(now.getTime() + PRINT_RETRY_DELAY_MS),
              ...CLEAR_CLAIM,
            };

    const updated = await OrderModel.findOneAndUpdate(
      CLAIM_MATCH(orderId, claimId),
      { $set: set },
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
      status === "printed"
        ? "تم تسجيل الطباعة بعد انتهاء واجهة الطباعة"
        : status === "unconfirmed"
          ? "تم تسجيل الطباعة كغير مؤكدة — لا إعادة تلقائية"
          : "تم تسجيل فشل الطباعة",
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
