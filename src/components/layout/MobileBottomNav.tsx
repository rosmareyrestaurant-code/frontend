"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, UtensilsCrossed, Tag, Heart, ShoppingBag } from "lucide-react";
import { useShop } from "@/context/ShopContext";

const navItems = [
  { icon: Home,            label: "الرئيسية", href: "/",     action: null },
  { icon: UtensilsCrossed, label: "الأكلات",  href: "/menu", action: null },
  { icon: Tag,             label: "العروض",   href: "/offers", action: null },
  { icon: Heart,           label: "المفضلة", href: null,     action: "favorites" as const },
  { icon: ShoppingBag,     label: "السلة",    href: null,     action: "cart" as const },
];

type Action = "cart" | "favorites" | null;

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { cartCount, favoritesCount, setIsCartOpen, setIsFavoritesOpen } = useShop();

  const getBadge = (action: Action) => {
    if (action === "cart"      && cartCount      > 0) return cartCount;
    if (action === "favorites" && favoritesCount > 0) return favoritesCount;
    return null;
  };

  const getBadgeColor = (action: Action) =>
    action === "favorites" ? "bg-[#ff3b30]" : "bg-[var(--color-primary)]";

  const handleAction = (action: Action) => {
    if (action === "cart")      setIsCartOpen(true);
    if (action === "favorites") setIsFavoritesOpen(true);
  };

  return (
    <nav
      dir="rtl"
      className="fixed bottom-0 inset-x-0 z-50 lg:hidden"
      aria-label="قائمة الموبايل السفلية"
    >
      <div className="rounded-t-2xl border-t border-[var(--color-border)] bg-[var(--color-page-background)]/95 px-1 pt-2 shadow-[0_-8px_30px_rgba(0,0,0,0.45)] backdrop-blur-md pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        <div className="flex items-end justify-around gap-0.5 h-16">
          {navItems.map((item) => {
            const Icon   = item.icon;
            const badge  = getBadge(item.action);
            const isActive = item.href ? pathname === item.href : false;

            const inner = (
              <div className="relative flex flex-col items-center gap-1 w-full">
                <div className="relative">
                  {/* خلفية الأيقونة */}
                  <div
                    className={`
                      relative flex items-center justify-center w-9 h-9
                      rounded-t-xl rounded-b-md border border-b-0 overflow-hidden
                      transition-all duration-200
                      ${isActive
                        ? "bg-[var(--color-primary)]/12 border-[var(--color-primary)]/30"
                        : "bg-[var(--color-page-background)]/60 border-[var(--color-border)]/70"}
                      group-hover:border-[var(--color-primary)]/40 group-active:scale-95
                    `}
                  >
                    <span
                      className="absolute inset-0 bg-[var(--color-primary)] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"
                      aria-hidden="true"
                    />
                    <Icon
                      className={`
                        relative z-10 h-4 w-4 transition-colors duration-200
                        ${isActive ? "text-[var(--color-on-primary)]" : "text-[var(--color-text-muted)]"}
                        group-hover:!text-[var(--color-on-primary)]
                      `}
                      strokeWidth={isActive ? 2.2 : 1.8}
                    />
                  </div>

                  {/* Badge */}
                  {badge !== null && (
                    <span className={`
                      absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center
                      rounded-full text-[8px] font-bold text-[var(--color-on-primary)] z-30 shadow-md
                      ${getBadgeColor(item.action)}
                    `}>
                      {badge}
                    </span>
                  )}
                </div>

                {/* التسمية */}
                <span className={`
                  text-[10px] font-semibold leading-none transition-colors duration-200 mb-1
                  ${isActive ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)]"}
                  group-hover:text-[var(--color-primary)]
                `}>
                  {item.label}
                </span>
              </div>
            );

            const sharedClass = "group flex-1 flex flex-col items-center justify-end py-1 select-none";

            if (item.href) {
              return (
                <Link key={item.label} href={item.href} className={sharedClass}>
                  {inner}
                </Link>
              );
            }

            return (
              <button
                key={item.label}
                onClick={() => handleAction(item.action)}
                className={sharedClass}
                aria-label={item.label}
              >
                {inner}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
