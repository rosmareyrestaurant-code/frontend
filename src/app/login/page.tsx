"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  DoorOpen,
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { signInAdmin } from "@/hooks/useAdminAuth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("أدخل البريد الإلكتروني وكلمة المرور أولاً");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data?.error?.message ?? "تعذر تسجيل الدخول، تأكد من البريد وكلمة المرور");
        return;
      }
      signInAdmin();
      router.replace(data.data?.role === "cashier" ? "/dashboard/orders" : "/dashboard");
    } catch {
      setError("تعذر الاتصال بالسيرفر، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F2F2ED]" dir="rtl">
      {/* صورة الخلفية */}
      <Image
        src="/images/admin/login-bg.png"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[35%_center]"
      />

      {/* تفتيح ناحية الكارت */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-l from-[#F2F2ED] via-[#F2F2ED]/55 to-transparent"
      />

      <div className="relative z-10 flex min-h-screen flex-col px-4 pb-8 pt-6 sm:px-8 sm:pt-8 lg:px-16">
        {/* الشعار */}
        <div className="flex flex-col items-center gap-2">
          <Link href="/" aria-label="روزماري - الصفحة الرئيسية">
            <Image
              src="/images/logo-rosemary-green.png"
              alt="Rozmaly"
              width={200}
              height={104}
              loading="eager"
              style={{ width: "auto" }}
              className="h-16 object-contain sm:h-20"
            />
          </Link>
          <div className="flex w-full max-w-[260px] items-center gap-3">
            <span className="h-px flex-1 bg-[#C6CDC0]" />
            <span className="whitespace-nowrap text-[11px] font-bold text-[#526B58] sm:text-xs">
              لوحة تحكم بالإدارة
            </span>
            <span className="h-px flex-1 bg-[#C6CDC0]" />
          </div>
        </div>

        {/* كارت الدخول — على اليمين في الديسكتوب */}
        <div className="flex flex-1 items-center justify-center lg:justify-start">
          <div className="mt-8 w-full max-w-[400px] rounded-[26px] border border-[#E7EAE0] bg-white p-6 shadow-[0_34px_70px_-34px_rgba(38,53,43,0.55)] sm:p-8">
            <div className="text-center">
              <h1 className="text-2xl font-black text-[#2F3A2E] sm:text-[28px]">
                تسجيل الدخول
              </h1>
              <p className="mt-1.5 text-xs font-semibold text-[#8A8279] sm:text-sm">
                مرحبًا بك في Rozmaly
              </p>
              <span
                className="mx-auto mt-3 block h-[3px] w-14 rounded-full bg-[#56624A]"
                aria-hidden="true"
              />
            </div>

            {error && (
              <p className="mt-5 rounded-xl border border-[#E8C9C9] bg-[#FBEFEF] px-4 py-2.5 text-center text-xs font-bold text-[#C2453F]">
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              <div className="space-y-1.5">
                <label
                  htmlFor="admin-email"
                  className="block text-right text-[13px] font-bold text-[#3B4A39]"
                >
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <input
                    id="admin-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="admin@rosemary.com"
                    dir="ltr"
                    className="w-full rounded-full border border-[#DFE3D9] bg-white py-3 pe-11 ps-5 text-sm text-[#2F3A2E] placeholder-[#A29C93] transition-colors focus:border-[#56624A] focus:outline-none focus:ring-2 focus:ring-[#56624A]/15"
                  />
                  <Mail className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#56624A]" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="admin-password"
                  className="block text-right text-[13px] font-bold text-[#3B4A39]"
                >
                  كلمة المرور
                </label>
                <div className="relative">
                  <input
                    id="admin-password"
                    type={showPass ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    dir="ltr"
                    className="w-full rounded-full border border-[#DFE3D9] bg-white py-3 pe-11 ps-11 text-sm text-[#2F3A2E] placeholder-[#A29C93] transition-colors focus:border-[#56624A] focus:outline-none focus:ring-2 focus:ring-[#56624A]/15"
                  />
                  <LockKeyhole className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#56624A]" />
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    aria-label={showPass ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                    className="absolute left-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#56624A] transition-colors hover:bg-[#EFF2EB]"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-[#5E7054] py-3 text-sm font-bold text-[#fff] shadow-[0_16px_28px_-18px_rgba(94,112,84,0.95)] transition-all hover:bg-[#526247] active:scale-[0.99] disabled:scale-100 disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>جاري تسجيل الدخول...</span>
                  </>
                ) : (
                  <>
                    <span>دخول</span>
                    <ShieldCheck className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* فاصل */}
            <div className="flex items-center gap-3 py-4">
              <span className="h-px flex-1 bg-[#E4E7DE]" />
              <span className="text-xs font-bold text-[#8A8279]">أو</span>
              <span className="h-px flex-1 bg-[#E4E7DE]" />
            </div>

            {/* العودة للموقع */}
            <Link
              href="/"
              className="flex items-center justify-center gap-2 rounded-full border border-[#D8DDD1] py-3 text-sm font-bold text-[#3B4A39] transition-all hover:border-[#56624A] hover:bg-[#F4F6F1]"
            >
              <DoorOpen className="h-4 w-4" />
              <span>العودة لموقع روزماري</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
