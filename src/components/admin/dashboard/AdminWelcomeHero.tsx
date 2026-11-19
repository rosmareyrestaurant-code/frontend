"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  PlusCircle,
  FolderPlus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface AdminWelcomeHeroProps {
  pendingOrdersCount?: number;
  adminName?: string;
}

export function AdminWelcomeHero({
  pendingOrdersCount = 0,
  adminName = "أ/ محمد هشام",
}: AdminWelcomeHeroProps) {
  const [greeting, setGreeting] = useState("أهلاً بك");
  const [currentDateStr, setCurrentDateStr] = useState("");
  const [currentTimeStr, setCurrentTimeStr] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hour = now.getHours();

      // لو بالنهار صباح الخير، ولو بالليل مساء الخير
      if (hour >= 5 && hour < 12) {
        setGreeting("صباح الخير");
      } else {
        setGreeting("مساء الخير");
      }

      // التاريخ الحالي بدقة بالتقويم واللغة العربية
      try {
        const dateFormatted = new Intl.DateTimeFormat("ar-EG", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(now);
        setCurrentDateStr(dateFormatted);

        // الساعة الحالية المباشرة مع الثواني بتوقيت الجهاز
        const timeFormatted = new Intl.DateTimeFormat("ar-EG", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }).format(now);
        setCurrentTimeStr(timeFormatted);
      } catch {
        setCurrentDateStr(now.toLocaleDateString("ar-EG"));
        setCurrentTimeStr(now.toLocaleTimeString("ar-EG"));
      }
    };

    updateTime();
    // تحديث كل ثانية لعرض الساعة الحالية الحية
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#33281f] bg-gradient-to-br from-[#1b1511] via-[#14100e] to-[#0d0b0a] p-5 sm:p-7 shadow-2xl shadow-black/60">
      {/* توهج ضوئي جمالي في الخلفية */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-[#ff7a00]/12 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-[#ef4444]/10 blur-3xl" />

      {/* خط علوي نيون دقيق */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-[#ff7a00]/60 to-transparent" />

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        {/* الجانب الأيمن: الترحيب بالاسم والبيانات المباشرة */}
        <div className="space-y-3 max-w-2xl">
          {/* العنوان الترحيبي الرئيسي المباشر بالاسم: صباح الخير / مساء الخير */}
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight flex flex-wrap items-center gap-2">
              <span>{greeting}،</span>
              <span className="bg-gradient-to-r from-white via-[#f3ede7] to-[#d6c7b9] bg-clip-text text-transparent">
                {adminName}
              </span>
              <span className="text-2xl sm:text-3xl">👋</span>
            </h1>

            <p className="mt-1.5 text-xs sm:text-sm text-[#a89e94] leading-relaxed">
              أهلاً بك في مقر قيادة مطعم روزماري. تابع المبيعات، راجع طلبات الزبائن لحظة بلحظة، وقم بإدارة قائمة الوجبات والتصنيفات بكل سهولة.
            </p>
          </div>

          {/* التاريخ الحالي والساعة الحالية والتنبيهات المباشرة */}
          <div className="flex flex-wrap items-center gap-2.5 pt-1 text-[11px] sm:text-xs text-[#8a8076]">
            {currentDateStr && (
              <div className="flex items-center gap-1.5 rounded-lg bg-[#1a1410] border border-[#2b221a] px-2.5 py-1 text-[#b5aba0]">
                <Calendar className="h-3.5 w-3.5 text-[#ff7a00]" />
                <span className="font-semibold text-white">{currentDateStr}</span>
              </div>
            )}

            {currentTimeStr && (
              <div className="flex items-center gap-1.5 rounded-lg bg-[#1a1410] border border-[#2b221a] px-2.5 py-1 text-[#b5aba0]">
                <Clock className="h-3.5 w-3.5 text-[#ff7a00]" />
                <span>الساعة الحالية:</span>
                <span dir="ltr" className="font-mono font-bold text-white tracking-wider mr-1">
                  {currentTimeStr}
                </span>
              </div>
            )}

            {pendingOrdersCount > 0 ? (
              <div className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 text-amber-300 font-bold">
                <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
                <span>يوجد {pendingOrdersCount} طلب بانتظار التأكيد</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>جميع الطلبات محدثة</span>
              </div>
            )}
          </div>
        </div>

        {/* الجانب الأيسر: الإجراءات السريعة الثلاثة بنفس الستايل الموحد */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 sm:items-center lg:items-stretch shrink-0 lg:min-w-[210px]">
          {/* زر 1: إدارة الطلبات */}
          <Link
            href="/dashboard/orders"
            className="flex items-center justify-between gap-2.5 rounded-xl bg-[#201914] border border-[#33261c] px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-[#281f19] hover:border-[#ff7a00]/50 transition-all duration-200 active:scale-95 shadow-sm group"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-[#ff7a00] group-hover:scale-110 transition-transform" />
              <span>إدارة الطلبات</span>
            </div>
            {pendingOrdersCount > 0 ? (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#ff7a00]/20 text-[10px] font-black text-[#ff7a00] border border-[#ff7a00]/30 px-1.5">
                {pendingOrdersCount}
              </span>
            ) : null}
          </Link>

          {/* زر 2: إضافة وجبة جديدة للمنيو */}
          <Link
            href="/dashboard/products"
            className="flex items-center gap-2 rounded-xl bg-[#201914] border border-[#33261c] px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-[#281f19] hover:border-[#ff7a00]/50 transition-all duration-200 active:scale-95 shadow-sm group"
          >
            <PlusCircle className="h-4 w-4 text-[#ff7a00] group-hover:scale-110 transition-transform" />
            <span>إضافة وجبة جديدة</span>
          </Link>

          {/* زر 3: إضافة تصنيف جديد */}
          <Link
            href="/dashboard/categories"
            className="flex items-center gap-2 rounded-xl bg-[#201914] border border-[#33261c] px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-[#281f19] hover:border-[#ff7a00]/50 transition-all duration-200 active:scale-95 shadow-sm group"
          >
            <FolderPlus className="h-4 w-4 text-[#ff7a00] group-hover:scale-110 transition-transform" />
            <span>إضافة تصنيف جديد</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
