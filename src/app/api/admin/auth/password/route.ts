import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { AdminModel } from "@/models/Admin";
import { success, badRequest, serverError, AppError } from "@/lib/api-response";
import { requireAdmin, verifyPassword, hashPassword } from "@/lib/auth";
import { changePasswordSchema } from "@/lib/validation";


export const instant = false;
export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAdmin();

    const body = await req.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");
    }

    const { currentPassword, newPassword } = parsed.data;

    await connectToDatabase();
    const admin = await AdminModel.findById(session.adminId);
    if (!admin) return badRequest("الحساب غير موجود", "NOT_FOUND");

    const valid = await verifyPassword(currentPassword, admin.passwordHash);
    if (!valid) return badRequest("كلمة المرور الحالية غير صحيحة", "AUTH_FAILED");

    admin.passwordHash = await hashPassword(newPassword);
    await admin.save();

    return success(null, "تم تغيير كلمة المرور بنجاح");
  } catch (e) {
    if (e instanceof AppError) {
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    }
    console.error("[PATCH /api/admin/auth/password]", e);
    return serverError();
  }
}
