"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import DeliveryTicker from "@/components/layout/DeliveryTicker";
import PageBreadcrumbs from "@/components/layout/PageBreadcrumbs";
import Footer from "@/components/layout/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { ShopProvider } from "@/context/ShopContext";
import CartDrawer from "@/components/common/CartDrawer";
import FavoritesDrawer from "@/components/common/FavoritesDrawer";
import ProductDetailsModal from "@/components/common/ProductDetailsModal";
import MenuImageModalWrapper from "@/components/common/MenuImageModalWrapper";
import { StoreToastProvider } from "@/components/common/StoreToast";
import type { PublicTickerSettings } from "@/lib/storefront";

/**
 * واجهة الموقع (الهيدر / الفوتر / درج السلة ...) للصفحات الخاصة بالعملاء فقط.
 * لوحة التحكم /dashboard ليها شلها الخاص (AdminShell) من غير هيدر أو فوتر الموقع.
 */
export default function SiteChrome({
  children,
  ticker,
}: {
  children: React.ReactNode;
  ticker: PublicTickerSettings;
}) {
  const pathname = usePathname();
  const isAdmin = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  // صفحة اللوجن شاشة مستقلة: من غير هيدر/فوتر/شريط توصيل/درج سلة
  if (isAdmin || pathname === "/login") return <>{children}</>;

  return (
    <ShopProvider>
      <StoreToastProvider>
        <DeliveryTicker initial={ticker} />
        <Header />
        {/* الصفحة الرئيسية ما ليها مسار تنقل — بنخبي الشريط بس بنسيب الكومبوننت mounts عشان سجل المسارات يفضل شغال */}
        <div className={pathname === "/" ? "hidden" : "border-b border-[var(--color-border-subtle)] bg-[var(--color-surface)]"}>
          <div className="mx-auto max-w-[1400px] px-4 py-2 sm:px-6 lg:px-8">
            <PageBreadcrumbs />
          </div>
        </div>
        <div className="flex-1 pb-16 lg:pb-0">{children}</div>
        <Footer />
        <MobileBottomNav />
        <CartDrawer />
        <FavoritesDrawer />
        <ProductDetailsModal />
        <MenuImageModalWrapper />
      </StoreToastProvider>
    </ShopProvider>
  );
}
