/**
 * proxy.ts — يحمي مسارات /dashboard من الوصول بدون جلسة أدمن.
 * يستخدم Jose مباشرة (Edge-compatible) بدون Mongoose.
 * اسم الدالة `proxy` إلزامي في Next.js 16 (تغيير من `middleware`).
 */
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { ADMIN_COOKIE_NAME } from "@/lib/constants";

export const config = {
  matcher: ["/dashboard/:path*"],
};

export async function proxy(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    // بدون AUTH_SECRET في الإنتاج: امنع الدخول بدل السماح به
    if (process.env.NODE_ENV === "production") {
      return NextResponse.redirect(new URL("/login", req.url));
    }
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
