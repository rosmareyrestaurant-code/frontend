"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ShoppingBag, Package, Grid3x3,
  Megaphone, Flame, Users, Settings, LogOut, X, ExternalLink, MapPin, TrendingUp,
} from "lucide-react";
import Image from "next/image";

const NAV_ITEMS = [
  { label: "الرئيسية",          href: "/dashboard",            icon: LayoutDashboard },
  { label: "الطلبات",            href: "/dashboard/orders",     icon: ShoppingBag },
  { label: "المنتجات",           href: "/dashboard/products",   icon: Package },
  { label: "الأكثر طلباً",       href: "/dashboard/popular",    icon: TrendingUp },
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

  const content = (
    <div className="flex h-full flex-col bg-[#0e0d0c] border-l border-[#1f1a17]">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#1f1a17] shrink-0">
        <div className="flex items-center gap-3">
          <Image src="/images/logo.png" alt="روزماري" width={120} height={40} className="h-9 w-auto object-contain" />
        </div>
        <button
          onClick={onClose}
          className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg text-[#8a8076] hover:text-white hover:bg-[#1c1915] transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-[#5a4f45]">
          القائمة الرئيسية
        </p>
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                isActive
                  ? "bg-[#ff7a00]/15 text-[#ff7a00] border border-[#ff7a00]/25"
                  : "text-[#a89f94] hover:bg-[#1a1512] hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-[#1f1a17] space-y-1 shrink-0">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#a89f94] hover:bg-[#1a1512] hover:text-white transition-all"
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          زيارة المتجر
        </Link>
        <Link
          href="/dashboard/logout"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          تسجيل الخروج
        </Link>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-60 shrink-0 h-screen sticky top-0">
        {content}
      </aside>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={onClose} aria-hidden="true" />
          <aside className="absolute right-0 top-0 h-full w-64">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
