"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePopularProducts } from "@/hooks/usePopularProducts";
import ProductScroller from "./ProductScroller";
import SectionHeading from "./SectionHeading";

export default function PopularSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  // يتحدّث تلقائياً من اختيار الأدمن + المنتجات اللي وصلت 50 طلب في الأسبوع
  const POPULAR = usePopularProducts();

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
        {/* رأس القسم الموحّد + أسهم التمرير */}
        <SectionHeading
          title="الأكثر طلباً"
          actions={
            <>
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
            </>
          }
        />

        {/* الموبايل: صفين منتجات تحت بعض في كل سحبة */}
        <ProductScroller
          ref={scrollRef}
          products={POPULAR}
          limit={POPULAR.length}
          label="الأكثر طلباً"
        />
      </div>
    </section>
  );
}
