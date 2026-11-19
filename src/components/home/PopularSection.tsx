"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight, Flame } from "lucide-react";
import {
  CHICKEN_PRODUCTS,
  PASTA_PRODUCTS,
  PIZZA_PRODUCTS,
  BURGER_PRODUCTS,
  DRINK_PRODUCTS,
} from "@/data/mockData";
import { Product } from "@/types";
import { useCatalogProducts } from "@/hooks/useCatalog";
import ProductScroller from "./ProductScroller";

const ALL_PRODUCTS: Product[] = [
  ...PIZZA_PRODUCTS,
  ...CHICKEN_PRODUCTS,
  ...BURGER_PRODUCTS,
  ...PASTA_PRODUCTS,
  ...DRINK_PRODUCTS,
];

export default function PopularSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const catalog = useCatalogProducts(ALL_PRODUCTS);
  const POPULAR = catalog.filter((p) => p.isPopular);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = Math.max(220, scrollRef.current.clientWidth * 0.85);
    scrollRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="w-full bg-[#0d0b0a] py-8 border-b border-[#1e1915]">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {/* Header + أسهم الـ scroll */}
        <div className="flex items-center justify-between mb-6">
          {/* العنوان */}
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff7a00]/10 text-[#ff7a00] ring-1 ring-[#ff7a00]/20">
              <Flame className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                الأكثر طلباً
              </h2>
              <p className="text-xs text-[#a89f94] mt-0.5">
                الأطباق المفضلة عند عملاؤنا
              </p>
            </div>
          </div>

          {/* أسهم التمرير بهوفر ناعم ومناسب بدون امتلاء */}
          <div className="flex items-center gap-2">
            {/* سهم يمين (للخلف في RTL) */}
            <button
              onClick={() => scroll("right")}
              aria-label="تمرير يميناً"
              className="hidden h-9 w-9 items-center justify-center rounded-full border border-[#2b241e] bg-[#1a1613] text-[#a89f94] transition-all duration-200 hover:border-[#ff7a00] hover:bg-[#ff7a00] hover:text-white hover:scale-105 active:scale-95 shadow-sm sm:flex"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            {/* سهم يسار (للأمام في RTL) */}
            <button
              onClick={() => scroll("left")}
              aria-label="تمرير يساراً"
              className="hidden h-9 w-9 items-center justify-center rounded-full border border-[#2b241e] bg-[#1a1613] text-[#a89f94] transition-all duration-200 hover:border-[#ff7a00] hover:bg-[#ff7a00] hover:text-white hover:scale-105 active:scale-95 shadow-sm sm:flex"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* الموبايل: صفين منتجات تحت بعض في كل سحبة */}
        <ProductScroller
          ref={scrollRef}
          products={POPULAR}
          limit={12}
          label="الأكثر طلباً"
        />
      </div>
    </section>
  );
}
