"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Product } from "@/types";
import { useCatalogProducts } from "@/hooks/useCatalog";
import ProductScroller from "./ProductScroller";

interface ProductSectionProps {
  id?: string;
  title: string;
  products: Product[];
}

export default function ProductSection({
  id,
  title,
  products,
}: ProductSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // منتجات الأدمن المضافة/المستوردة من الإكسيل بتظهر هنا في قسمها
  const allProducts = useCatalogProducts(products);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = Math.max(220, scrollRef.current.clientWidth * 0.85);
    scrollRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section
      id={id}
      className="w-full bg-[#0b0a09] py-8 sm:py-10 scroll-mt-20 sm:scroll-mt-24 transition-all"
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {/* شريط رأس القسم: العنوان وزر عرض الكل + أسهم التمرير */}
        <div className="flex items-center justify-between mb-6">
          {/* عنوان القسم */}
          <div className="flex items-center gap-3">
            <span className="h-6 w-1.5 rounded-full bg-[#ff7a00]"></span>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
              {title}
            </h2>
          </div>

          {/* الإجراءات: أسهم التمرير فقط */}
          <div className="flex items-center gap-2">
            {/* سهم يمين (للخلف في RTL) */}
            <button
              onClick={() => scroll("right")}
              aria-label={`تمرير ${title} يميناً`}
              className="hidden h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-[#2b241e] bg-[#1a1613] text-[#a89f94] transition-all duration-200 hover:border-[#ff7a00] hover:bg-[#ff7a00] hover:text-white hover:scale-105 active:scale-95 shadow-sm sm:flex"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            {/* سهم يسار (للأمام في RTL) */}
            <button
              onClick={() => scroll("left")}
              aria-label={`تمرير ${title} يساراً`}
              className="hidden h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-[#2b241e] bg-[#1a1613] text-[#a89f94] transition-all duration-200 hover:border-[#ff7a00] hover:bg-[#ff7a00] hover:text-white hover:scale-105 active:scale-95 shadow-sm sm:flex"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* الموبايل: صفين تحت بعض في كل خطوة سحب (4 منتجات) — الديسكتوب: صف واحد */}
        <ProductScroller
          ref={scrollRef}
          products={allProducts}
          limit={16}
          label={`منتجات ${title}`}
        />
      </div>
    </section>
  );
}
