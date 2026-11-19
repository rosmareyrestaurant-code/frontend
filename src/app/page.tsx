import HeroSlider from "@/components/home/HeroSlider";
import PopularSection from "@/components/home/PopularSection";
import CategoriesSection from "@/components/home/CategoriesSection";
import PromoBanners from "@/components/home/PromoBanners";
import DeliveryBanner from "@/components/home/DeliveryBanner";
import ProductSection from "@/components/home/ProductSection";
import {
  PASTA_PRODUCTS,
  PIZZA_PRODUCTS,
  BURGER_PRODUCTS,
  CHICKEN_PRODUCTS,
  DRINK_PRODUCTS,
} from "@/data/mockData";

export default function HomePage() {
  return (
    <main className="flex w-full flex-col pb-4 sm:pb-8">
      {/* 1. السلايدر الرئيسي البصري في أعلى الصفحة */}
      <HeroSlider />

      {/* 2. شريط التصنيفات في كروت أفقية */}
      <CategoriesSection />

      {/* 3. الأكثر طلباً — تحت التصنيفات مباشرة */}
      <PopularSection />

      {/* 4. قسم البيتزا - أول تصنيف */}
      <ProductSection
        id="pizza"
        title="البيتزا"
        products={PIZZA_PRODUCTS}
      />

      {/* 5. قسم الكريب / الدجاج - ثاني تصنيف */}
      <ProductSection
        id="crepe"
        title="كريب"
        products={CHICKEN_PRODUCTS}
      />

      {/* 6. بانرات العروض الخاصة (بين التصنيفين الأولين والأخيرين) */}
      <PromoBanners />

      {/* 7. قسم المكرونة - تالت تصنيف */}
      <ProductSection
        id="pasta"
        title="مكرونة"
        products={PASTA_PRODUCTS}
      />

      {/* 8. قسم السندوتشات - رابع تصنيف */}
      <div id="burger" className="scroll-mt-20 sm:scroll-mt-24" />
      <ProductSection
        id="sandwiches"
        title="سندوتشات"
        products={BURGER_PRODUCTS}
      />

      {/* 9. بانر التوصيل السريع */}
      <DeliveryBanner />

      {/* 10. قسم المشروبات */}
      <ProductSection
        id="drinks"
        title="المشروبات"
        products={DRINK_PRODUCTS}
      />
    </main>
  );
}
