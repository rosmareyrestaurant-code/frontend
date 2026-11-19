"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { Bell, Menu } from "lucide-react";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":            "الرئيسية",
  "/dashboard/orders":     "إدارة الطلبات",
  "/dashboard/products":   "إدارة المنتجات",
  "/dashboard/popular":    "الأكثر طلباً",
  "/dashboard/categories": "إدارة التصنيفات",
  "/dashboard/banners":    "إدارة البنرات",
  "/dashboard/offers":     "إدارة العروض الترويجية",
  "/dashboard/customers":  "إدارة العملاء",
  "/dashboard/delivery-zones": "مناطق التوصيل",
  "/dashboard/settings":   "إعدادات المتجر",
};

interface AdminTopbarProps {
  onMenuToggle: () => void;
}

export function AdminTopbar({ onMenuToggle }: AdminTopbarProps) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "لوحة التحكم";
  const isHome = pathname === "/dashboard";

  return (
    <header className="sticky top-0 z-30 flex h-[72px] shrink-0 items-center justify-between gap-3 border-b border-[#ECE7DC] bg-[#F6F4EF]/95 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E7E2D6] text-[#6B7264] transition-colors hover:bg-[#ECE9E0] lg:hidden"
          aria-label="فتح القائمة"
        >
          <Menu className="h-4 w-4" />
        </button>
        {!isHome && (
          <h1 className="truncate text-[13px] font-black text-[#333B2E]">{title}</h1>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        <button
          className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#E7E2D6] bg-[#FBF9F6] text-[#6B7264] transition-colors hover:bg-[#EFECE3]"
          aria-label="الإشعارات"
        >
          <Bell className="h-[17px] w-[17px]" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#D9534F] px-1 text-[9px] font-bold text-[#fff]">
            3
          </span>
        </button>

        <div className="flex items-center gap-2.5 rounded-full border border-[#ECE7DC] bg-[#FBF9F6] py-1 pe-1 ps-2.5">
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1 ring-[#D6DCCF]">
            <Image
              src="/images/admin/admin-avatar.png"
              alt="صورة المدير"
              fill
              sizes="32px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-black leading-none text-[#333B2E]">محمد هشام</p>
            <p className="mt-1 text-[10px] font-semibold leading-none text-[#8F9186]">مدير النظام</p>
          </div>
        </div>
      </div>
    </header>
  );
}
