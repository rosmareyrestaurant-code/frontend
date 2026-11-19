/**
 * POST /api/upload/payment/sign
 * توقيع رفع عام (بدون أدمن) لصورة إثبات التحويل عند تأكيد الطلب.
 * مقيد بعدد محاولات لتقليل إساءة الاستخدام، والمجلد ثابت.
 */
import { NextRequest } from "next/server";
import { success, badRequest, serverError, AppError } from "@/lib/api-response";
import { signUpload, isCloudinaryConfigured } from "@/lib/cloudinary";
import { rateLimitOrThrow, clientIp } from "@/lib/rate-limit";


export const instant = false;
export async function POST(req: NextRequest) {
  try {
    rateLimitOrThrow(`payment-proof:${clientIp(req)}`, 6, 60_000);

    if (!isCloudinaryConfigured()) {
      return badRequest(
        "رفع صور التحويل غير متاح حالياً — جرّب الدفع كاش أو حاول لاحقاً",
        "CLOUDINARY_NOT_CONFIGURED",
      );
    }

    return success(signUpload("rozmaly/payments"));
  } catch (e) {
    if (e instanceof AppError)
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    console.error("[POST /api/upload/payment/sign]", e);
    return serverError();
  }
}
