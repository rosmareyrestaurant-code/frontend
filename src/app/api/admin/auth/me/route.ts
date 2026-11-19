/**
 * GET /api/admin/auth/me
 * يرجع بيانات الأدمن المسجّل دخوله، أو 401 لو ما في جلسة.
 * تستخدمها الواجهة عند تحميل لوحة التحكم للتحقق من الجلسة.
 */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { AdminModel } from "@/models/Admin";
import { success, unauthorized, serverError } from "@/lib/api-response";
import { getSession } from "@/lib/auth";


export const instant = false;
export async function GET(_req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return unauthorized();

    await connectToDatabase();
    const admin = await AdminModel.findById(session.adminId)
      .select("-passwordHash")
      .lean();

    if (!admin || !(admin as { isActive: boolean }).isActive) {
      return unauthorized("الجلسة انتهت، سجّل الدخول مجدداً");
    }

    return success({
      adminId: String(admin._id),
      name: (admin as { name: string }).name,
      email: (admin as { email: string }).email,
      role: (admin as { role: string }).role ?? "admin",
    });
  } catch (e) {
    console.error("[GET /api/admin/auth/me]", e);
    return serverError();
  }
}
