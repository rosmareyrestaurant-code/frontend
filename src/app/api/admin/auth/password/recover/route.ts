/**
 * POST /api/admin/auth/password/recover
 * يغيّر كلمة مرور الأدمن من داخل جلسة نشطة من غير معرفة الكلمة الحالية،
 * بشرط إدخال رمز استعادة من 4 أرقام يعرفه الأدمن فقط (ADMIN_RESET_PIN).
 */
import { NextRequest } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { connectToDatabase } from "@/lib/mongodb";
import { AdminModel } from "@/models/Admin";
import { success, badRequest, serverError, AppError } from "@/lib/api-response";
import { requireAdmin, hashPassword } from "@/lib/auth";
import { recoverPasswordSchema } from "@/lib/validation";
import { rateLimitOrThrow, clientIp } from "@/lib/rate-limit";

export const instant = false;
export async function POST(req: NextRequest) {
  try {
    rateLimitOrThrow(`account:recover:${clientIp(req)}`, 5, 15 * 60_000);

    const session = await requireAdmin();

    const body = await req.json();
    const parsed = recoverPasswordSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");
    }

    const expectedPin = process.env.ADMIN_RESET_PIN?.trim() ?? "";
    if (!/^\d{4}$/.test(expectedPin)) {
      return Response.json(
        {
          success: false,
          error: {
            code: "PIN_NOT_CONFIGURED",
            message: "رمز الاستعادة غير مضبوط على السيرفر — تواصل مع مسؤول النظام",
          },
        },
        { status: 503 },
      );
    }

    const given = Buffer.from(parsed.data.pin);
    const expected = Buffer.from(expectedPin);
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
      return badRequest("رمز الاستعادة غير صحيح", "AUTH_FAILED");
    }

    await connectToDatabase();
    const admin = await AdminModel.findById(session.adminId);
    if (!admin) return badRequest("الحساب غير موجود", "NOT_FOUND");

    admin.passwordHash = await hashPassword(parsed.data.newPassword);
    await admin.save();

    return success(null, "تم تحديث كلمة المرور بنجاح");
  } catch (e) {
    if (e instanceof AppError) {
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    }
    console.error("[POST /api/admin/auth/password/recover]", e);
    return serverError();
  }
}
