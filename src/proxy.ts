/**
 * proxy.ts — يحمي مسارات /dashboard من الوصول بدون جلسة أدمن.
 * يستخدم Jose مباشرة (Edge-compatible) بدون Mongoose.
 * اسم الدالة `proxy` إلزامي في Next.js 16 (تغيير من `middleware`).
 */
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { ADMIN_COOKIE_NAME, DEMO_ADMIN_COOKIE } from "@/lib/constants";

export const config = {
  matcher: ["/dashboard/:path*"],
};

export async function proxy(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  // جلسة تجريبية (مفيش باكند) — نفس فكرة الـ localStorage عند الدخول
  const demoSession = req.cookies.get(DEMO_ADMIN_COOKIE)?.value === "1";

  if (demoSession) {
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    // بدون AUTH_SECRET في بيئة التطوير — السماح بالمرور
    return NextResponse.next();
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(secret), {
      algorithms: ["HS256"],
    });
    return NextResponse.next();
  } catch {
    // توكن منتهي أو غير صالح — إعادة توجيه لصفحة الدخول
    const res = NextResponse.redirect(new URL("/login", req.url));
    res.cookies.set(ADMIN_COOKIE_NAME, "", { path: "/", maxAge: 0 });
    return res;
  }
}
