"use client";

import { usePathname } from "next/navigation";
import { Menu, Bell, ShieldCheck } from "lucide-react";

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

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-[#1f1a17] bg-[#0e0d0c]/95 backdrop-blur-sm px-4 sm:px-6 shrink-0">
      {/* Right: menu toggle + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl bg-[#1c1613] border border-[#2a231d] text-[#a89f94] hover:text-white transition-colors"
          aria-label="فتح القائمة"
        >
          <Menu className="h-4 w-4" />
        </button>
        <h1 className="text-base font-black text-white">{title}</h1>
      </div>

      {/* Left: actions + admin info */}
      <div className="flex items-center gap-2">
        <button className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-[#1c1613] border border-[#2a231d] text-[#a89f94] hover:text-white transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[#ff7a00]" />
        </button>

        <div className="flex items-center gap-2 rounded-xl bg-[#1c1613] border border-[#2a231d] px-3 py-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#ff7a00]/15 text-[#ff7a00]">
            <ShieldCheck className="h-3.5 w-3.5" />
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-bold text-white leading-none">أ/ محمد هشام</p>
            <p className="text-[10px] text-[#8a8076] leading-none mt-0.5">المدير العام • مسؤول النظام</p>
          </div>
        </div>
      </div>
    </header>
  );
}
