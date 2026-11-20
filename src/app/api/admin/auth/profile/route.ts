/**
 * PATCH /api/admin/auth/profile — تعديل اسم وصورة الأدمن من الهيدر.
 */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { AdminModel } from "@/models/Admin";
import { success, badRequest, serverError, AppError } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import { updateAdminProfileSchema } from "@/lib/validation";

export const instant = false;
export async function PATCH(req: NextRequest) {
  try {
    const session = await requireAdmin();

    const body = await req.json();
    const parsed = updateAdminProfileSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");
    }

    const { name, avatar } = parsed.data;

    await connectToDatabase();
    const admin = await AdminModel.findById(session.adminId);
    if (!admin) return badRequest("الحساب غير موجود", "NOT_FOUND");

    admin.name = name;
    admin.avatar = avatar;
    await admin.save();

    return success({ name: admin.name, avatar: admin.avatar }, "تم تحديث بيانات الحساب بنجاح");
  } catch (e) {
    if (e instanceof AppError) {
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    }
    console.error("[PATCH /api/admin/auth/profile]", e);
    return serverError();
  }
}
