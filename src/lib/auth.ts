/**
 * مصادقة الأدمن: جلسة JWT موقّعة داخل HttpOnly Cookie.
 * بسيطة وآمنة بدرجة مناسبة لمشروع مطعم (طبقة واحدة، دور واحد: admin).
 */
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { ADMIN_COOKIE_NAME, SESSION_MAX_AGE } from "./constants";
import { AppError } from "./api-response";
import { connectToDatabase } from "./mongodb";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE,
};

function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new AppError(
      "SERVER_ERROR",
      "AUTH_SECRET غير مضبوط على السيرفر",
      500,
    );
  }
  return new TextEncoder().encode(secret);
}

export interface AdminSession {
  adminId: string;
  email: string;
  role: string;
}

/** يشfusc كلمة المرور باستخدام bcrypt */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

/** يتحقق من كلمة المرور مقابل الـ hash */
export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** ينشئ توكن الجلسة الموقّع */
export async function signSession(payload: AdminSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getAuthSecret());
}

/** يتحقق من توكن الجلسة ويرجع الحمولة أو null */
export async function verifySession(
  token: string,
): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, getAuthSecret(), {
      algorithms: ["HS256"],
    });
    if (
      typeof payload.adminId !== "string" ||
      typeof payload.email !== "string"
    ) {
      return null;
    }
    return {
      adminId: payload.adminId,
      email: payload.email,
      role: typeof payload.role === "string" ? payload.role : "admin",
    };
  } catch {
    return null;
  }
}

/** يقرأ الجلسة من الكوكي الحالي (أو null) */
export async function getSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

/** يضبط كوكي الجلسة (يُستدعى داخل Route Handler) */
export async function setSessionCookie(token: string): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE_NAME, token, COOKIE_OPTIONS);
}

/** يحذف كوكي الجلسة (يُستدعى داخل Route Handler) */
export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE_NAME, "", { path: "/", maxAge: 0 });
}

/** شكل الأدمن بعد التحقق (بدون كلمة المرور) */
export interface AdminLean {
  _id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

/**
 * يتأكد من وجود جلسة موظف صالحة وفعّالة (مدير أو كاشير).
 * يُرمى AppError(401) لو لا توجد جلسة أو الحساب غير فعّال.
 */
export async function requireStaff(): Promise<AdminSession> {
  const session = await getSession();
  if (!session) {
    throw new AppError("UNAUTHORIZED", "يجب تسجيل الدخول للوصول", 401);
  }
  // تحقق إضافي أن الحساب ما زال فعّالاً (بدون كشف تفاصيل حساسة)
  await connectToDatabase();
  const { AdminModel } = await import("@/models");
  const admin = await AdminModel.findById(session.adminId).lean();
  if (!admin || !admin.isActive) {
    await clearSessionCookie();
    throw new AppError("UNAUTHORIZED", "الجلسة غير صالحة، سجّل الدخول مجدداً", 401);
  }
  const { email, role } = admin as unknown as { email: string; role?: string };
  return {
    adminId: session.adminId,
    email,
    role: role || "admin",
  };
}

/**
 * نفس التحقق لكن للمدير فقط — بيانات إدارة المتجر مش متاحة لحساب الكاشير.
 * يُستدعى في بداية Route Handler محمي.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await requireStaff();
  if (session.role !== "admin") {
    throw new AppError("FORBIDDEN", "هذه الصفحة متاحة للمدير فقط", 403);
  }
  return session;
}
