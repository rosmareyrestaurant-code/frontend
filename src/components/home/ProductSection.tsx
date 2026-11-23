"use client";

import { useRef } from "react";
import { Product } from "@/types";
// تعديلات الأدمن بقت جاية من الـ API نفسه
// import { useCatalogProducts } from "@/hooks/useCatalog";
import SliderArrow from "@/components/common/SliderArrow";
import ProductScroller from "./ProductScroller";
import SectionHeading from "./SectionHeading";

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
  const allProducts = products;

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
      className="w-full bg-[var(--color-page-background)] py-8 sm:py-10 scroll-mt-20 sm:scroll-mt-24 transition-all"
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {/* رأس القسم الموحّد: شريط برتقالي + كلمة تمهيدية + العنوان + أسهم التمرير */}
        <SectionHeading
          title={title}
          actions={
            <>
              {/* سهم يمين (للخلف في RTL) — يتملّى من اليمين عند الهاوفر */}
              <SliderArrow
                direction="right"
                onClick={() => scroll("right")}
                ariaLabel={`تمرير ${title} يميناً`}
                className="relative hidden h-9 w-9 sm:flex sm:h-10 sm:w-10"
              />
              {/* سهم يسار (للأمام في RTL) — يتملّى من الشمال عند الهاوفر */}
              <SliderArrow
                direction="left"
                onClick={() => scroll("left")}
                ariaLabel={`تمرير ${title} يساراً`}
                className="relative hidden h-9 w-9 sm:flex sm:h-10 sm:w-10"
              />
            </>
          }
        />

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
