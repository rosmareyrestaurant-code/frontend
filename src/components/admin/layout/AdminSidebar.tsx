"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, ShoppingBag, Package, Grid3x3,
  Megaphone, Flame, Users, Settings, LogOut, X, ExternalLink, MapPin,
  UserCog, Palette,
} from "lucide-react";
import { beginAdminLogout } from "@/hooks/useAdminAuth";
import Logo from "@/components/common/Logo";

const NAV_ITEMS = [
  { label: "الرئيسية",          href: "/dashboard",            icon: LayoutDashboard, adminOnly: true },
  { label: "الطلبات",            href: "/dashboard/orders",     icon: ShoppingBag },
  { label: "المنتجات",           href: "/dashboard/products",   icon: Package, adminOnly: true },
  { label: "التصنيفات",          href: "/dashboard/categories", icon: Grid3x3, adminOnly: true },
  { label: "البنرات",            href: "/dashboard/banners",    icon: Megaphone, adminOnly: true },
  { label: "العروض الترويجية",   href: "/dashboard/offers",     icon: Flame, adminOnly: true },
  { label: "العملاء",            href: "/dashboard/customers",  icon: Users, adminOnly: true },
  { label: "مناطق التوصيل",      href: "/dashboard/delivery-zones", icon: MapPin, adminOnly: true },
  { label: "حساب الكاشير",       href: "/dashboard/cashier",    icon: UserCog, adminOnly: true },
  { label: "هوية الموقع والألوان", href: "/dashboard/theme",    icon: Palette, adminOnly: true },
  { label: "إعدادات المتجر",     href: "/dashboard/settings",   icon: Settings, adminOnly: true },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d?.success) setRole(d.data.role ?? "admin");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const navItems =
    role === "cashier"
      ? NAV_ITEMS.filter((item) => item.href === "/dashboard/orders")
      : role === null
        ? NAV_ITEMS.filter((item) => !item.adminOnly)
        : NAV_ITEMS;

  async function handleLogout() {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } catch { /* ignore */ }
    beginAdminLogout();
    router.push("/login");
    router.refresh();
  }

  const content = (
    <div className="flex h-full flex-col bg-[var(--color-primary)]">
      {/* الشعار */}
      <div className="relative flex shrink-0 flex-col items-center px-5 pb-5 pt-7">
        <button
          onClick={onClose}
          className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-[var(--color-on-primary)] transition-colors hover:bg-white/10 hover:text-[var(--color-on-primary)] lg:hidden"
          aria-label="إغلاق القائمة"
        >
          <X className="h-4 w-4" />
        </button>
        <Logo tone="light" imageClassName="h-16 w-auto object-contain" />
        <p className="mt-1 text-[11px] font-semibold text-[var(--color-on-primary)]">لوحة التحكم</p>
      </div>

      {/* القائمة */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {navItems.map(({ label, href, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-[12px] px-3.5 py-2.5 text-[13.5px] font-bold transition-all ${
                isActive
                  ? "bg-[var(--color-primary-hover)] text-[var(--color-on-primary)]"
                  : "text-[var(--color-on-primary)] hover:bg-white/5 hover:text-[var(--color-on-primary)]"
              }`}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.9} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* أسفل القائمة */}
      <div className="shrink-0 space-y-2 border-t border-[var(--color-primary-hover)] px-3 py-4">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 rounded-[12px] px-3.5 py-2 text-[12px] font-semibold text-[var(--color-on-primary)] transition-colors hover:bg-white/5 hover:text-[var(--color-on-primary)]"
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          <span>زيارة المتجر</span>
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-[12px] border border-[var(--color-primary-border)] px-4 py-2.5 text-[13px] font-bold text-[var(--color-on-primary)] transition-colors hover:bg-white/10"
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
