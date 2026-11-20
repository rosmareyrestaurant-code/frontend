/**
 * PATCH /api/admin/auth/email — تغيير بريد دخول الأدمن.
 * يتطلب كلمة المرور الحالية، ويعيد إصدار جلسة جديدة بالبريد المحدّث.
 */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { AdminModel } from "@/models/Admin";
import { success, badRequest, serverError, AppError } from "@/lib/api-response";
import {
  requireAdmin,
  verifyPassword,
  signSession,
  setSessionCookie,
} from "@/lib/auth";
import { changeEmailSchema } from "@/lib/validation";
import { rateLimitOrThrow, clientIp } from "@/lib/rate-limit";

export const instant = false;
export async function PATCH(req: NextRequest) {
  try {
    rateLimitOrThrow(`account:email:${clientIp(req)}`, 5, 60_000);

    const session = await requireAdmin();

    const body = await req.json();
    const parsed = changeEmailSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");
    }

    const { currentPassword, newEmail } = parsed.data;

    await connectToDatabase();
    const admin = await AdminModel.findById(session.adminId);
    if (!admin) return badRequest("الحساب غير موجود", "NOT_FOUND");

    const valid = await verifyPassword(currentPassword, admin.passwordHash);
    if (!valid) return badRequest("كلمة المرور الحالية غير صحيحة", "AUTH_FAILED");

    if (newEmail === admin.email) {
      return badRequest("البريد الجديد هو نفس البريد الحالي");
    }

    const taken = await AdminModel.exists({
      email: newEmail,
      _id: { $ne: admin._id },
    });
    if (taken) return badRequest("هذا البريد مستخدم بالفعل لحساب آخر", "EMAIL_TAKEN");

    admin.email = newEmail;
    await admin.save();

    // جلسة جديدة بالبريد الجديد — الجلسة القديمة تفضل صالحة بنفس adminId
    const token = await signSession({
      adminId: String(admin._id),
      email: newEmail,
      role: admin.role ?? "admin",
    });
    await setSessionCookie(token);

    return success({ email: newEmail }, "تم تحديث البريد الإلكتروني بنجاح");
  } catch (e) {
    if (e instanceof AppError) {
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    }
    if ((e as { code?: number })?.code === 11000) {
      return badRequest("هذا البريد مستخدم بالفعل لحساب آخر", "EMAIL_TAKEN");
    }
    console.error("[PATCH /api/admin/auth/email]", e);
    return serverError();
  }
}
