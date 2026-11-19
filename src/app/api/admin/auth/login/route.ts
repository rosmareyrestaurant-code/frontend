import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { AdminModel } from "@/models/Admin";
import {
  success,
  badRequest,
  serverError,
  AppError,
} from "@/lib/api-response";
import {
  verifyPassword,
  signSession,
  setSessionCookie,
} from "@/lib/auth";
import { adminLoginSchema } from "@/lib/validation";
import { rateLimitOrThrow, clientIp } from "@/lib/rate-limit";


export const instant = false;
export async function POST(req: NextRequest) {
  try {
    // 5 محاولات / دقيقتين لكل IP — حماية من brute-force
    rateLimitOrThrow(`login:${clientIp(req)}`, 5, 120_000);

    const body = await req.json();
    const parsed = adminLoginSchema.safeParse(body);
    if (!parsed.success) {
      return badRequest("بريد إلكتروني أو كلمة مرور غير صحيحة");
    }

    const { email, password } = parsed.data;

    await connectToDatabase();

    const admin = await AdminModel.findOne({
      email: email.toLowerCase(),
      isActive: true,
    }).lean();

    // رسالة موحدة — لا نكشف هل المشكلة في الإيميل أم كلمة المرور
    const genericError = "بريد إلكتروني أو كلمة مرور غير صحيحة";

    if (!admin) return badRequest(genericError, "AUTH_FAILED");

    const valid = await verifyPassword(
      password,
      (admin as { passwordHash: string }).passwordHash,
    );
    if (!valid) return badRequest(genericError, "AUTH_FAILED");

    const token = await signSession({
      adminId: String(admin._id),
      email: (admin as { email: string }).email,
      role: (admin as { role: string }).role ?? "admin",
    });

    await setSessionCookie(token);

    return success(
      {
        adminId: String(admin._id),
        name: (admin as { name: string }).name,
        email: (admin as { email: string }).email,
        role: (admin as { role: string }).role ?? "admin",
      },
      "تم تسجيل الدخول بنجاح",
    );
  } catch (e) {
    if (e instanceof AppError) {
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    }
    console.error("[POST /api/admin/auth/login]", e);
    return serverError();
  }
}
