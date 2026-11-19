/**
 * POST /api/admin/upload/sign
 * يولّد توقيع رفع Cloudinary للمتصفح.
 * المتصفح يرفع الصورة مباشرة إلى Cloudinary بالتوقيع، بدون أن يمر الـ binary data عبر السيرفر.
 * الـ API_SECRET لا يُرسل للمتصفح أبداً.
 */
import { NextRequest } from "next/server";
import { success, badRequest, serverError, AppError } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import { signUpload, isCloudinaryConfigured } from "@/lib/cloudinary";
import { IMAGE_UPLOAD } from "@/lib/constants";
import { z } from "zod";


export const instant = false;
const bodySchema = z.object({
  folder: z.enum([
    "rozmaly/products",
    "rozmaly/categories",
    "rozmaly/banners",
    "rozmaly/offers",
    "rozmaly/branding",
    "rozmaly/about",
    "rozmaly/payments",
  ]),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();

    if (!isCloudinaryConfigured()) {
      return badRequest(
        "Cloudinary غير مضبوط على السيرفر، أضف المتغيرات في .env.local",
        "CLOUDINARY_NOT_CONFIGURED",
      );
    }

    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success)
      return badRequest("مجلد الرفع غير صحيح");

    const { folder } = parsed.data;
    // التحقق أن الـ folder ضمن المجلدات المسموح بها
    const allowed = Object.values(IMAGE_UPLOAD.folders) as string[];
    if (!allowed.includes(folder))
      return badRequest("مجلد الرفع غير مسموح به");

    const sig = signUpload(folder);
    return success(sig);
  } catch (e) {
    if (e instanceof AppError)
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    console.error("[POST /api/admin/upload/sign]", e);
    return serverError();
  }
}
