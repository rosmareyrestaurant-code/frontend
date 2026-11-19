"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import DeliveryTicker from "@/components/layout/DeliveryTicker";
import Footer from "@/components/layout/Footer";
import MobileBottomNav from "@/components/layout/MobileBottomNav";
import { ShopProvider } from "@/context/ShopContext";
import CartDrawer from "@/components/common/CartDrawer";
import FavoritesDrawer from "@/components/common/FavoritesDrawer";
import ProductDetailsModal from "@/components/common/ProductDetailsModal";
import MenuImageModalWrapper from "@/components/common/MenuImageModalWrapper";
import { StoreToastProvider } from "@/components/common/StoreToast";

/**
 * واجهة الموقع (الهيدر / الفوتر / درج السلة ...) للصفحات الخاصة بالعملاء فقط.
 * لوحة التحكم /dashboard ليها شلها الخاص (AdminShell) من غير هيدر أو فوتر الموقع.
 */
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname === "/dashboard" || pathname.startsWith("/dashboard/");

  if (isAdmin) return <>{children}</>;

  return (
    <ShopProvider>
      <StoreToastProvider>
        <DeliveryTicker />
        <Header />
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
