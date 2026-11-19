"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, ShoppingBag, Package, Grid3x3,
  Megaphone, Flame, Users, Settings, LogOut, X, ExternalLink, MapPin,
} from "lucide-react";
import { beginAdminLogout } from "@/hooks/useAdminAuth";

const NAV_ITEMS = [
  { label: "الرئيسية",          href: "/dashboard",            icon: LayoutDashboard },
  { label: "الطلبات",            href: "/dashboard/orders",     icon: ShoppingBag },
  { label: "المنتجات",           href: "/dashboard/products",   icon: Package },
  { label: "التصنيفات",          href: "/dashboard/categories", icon: Grid3x3 },
  { label: "البنرات",            href: "/dashboard/banners",    icon: Megaphone },
  { label: "العروض الترويجية",   href: "/dashboard/offers",     icon: Flame },
  { label: "العملاء",            href: "/dashboard/customers",  icon: Users },
  { label: "مناطق التوصيل",      href: "/dashboard/delivery-zones", icon: MapPin },
  { label: "إعدادات المتجر",     href: "/dashboard/settings",   icon: Settings },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } catch { /* ignore */ }
    beginAdminLogout();
    router.push("/login");
    router.refresh();
  }

  const content = (
    <div className="flex h-full flex-col bg-[#50604D]">
      {/* الشعار */}
      <div className="relative flex shrink-0 flex-col items-center px-5 pb-5 pt-7">
        <button
          onClick={onClose}
          className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-[#D6DDD0] transition-colors hover:bg-white/10 hover:text-[#fff] lg:hidden"
          aria-label="إغلاق القائمة"
        >
          <X className="h-4 w-4" />
        </button>
        <Image
          src="/images/logo-rosemary-cream.png"
          alt="روزماري"
          width={180}
          height={93}
          className="h-16 w-auto object-contain"
        />
        <p className="mt-1 text-[11px] font-semibold text-[#C9D2C4]">لوحة التحكم</p>
      </div>

      {/* القائمة */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-[12px] px-3.5 py-2.5 text-[13.5px] font-bold transition-all ${
                isActive
                  ? "bg-[#788B73] text-[#fff]"
                  : "text-[#D6DDD0] hover:bg-white/5 hover:text-[#fff]"
              }`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.9} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* أسفل القائمة */}
      <div className="shrink-0 space-y-2 border-t border-[#435243] px-3 py-4">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-[12px] px-3.5 py-2 text-[12px] font-semibold text-[#C9D2C4] transition-colors hover:bg-white/5 hover:text-[#fff]"
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          <span>زيارة المتجر</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-[12px] border border-[#86947F] px-4 py-2.5 text-[13px] font-bold text-[#F1F3EC] transition-colors hover:bg-white/10"
        >
          <LogOut className="h-4 w-4" />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 lg:block">{content}</aside>
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />
          <aside className="absolute right-0 top-0 h-full w-64">{content}</aside>
        </div>
      )}
    </>
  );
}
