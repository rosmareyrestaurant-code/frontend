"use client";

import { useRef } from "react";
import { Flame } from "lucide-react";
import type { Product } from "@/types";
import SliderArrow from "@/components/common/SliderArrow";
import ProductScroller from "./ProductScroller";
import SectionHeading from "./SectionHeading";

/** المنتجات المميزة جاية من السيرفر (كاش) — مفيش fetch هنا */
export default function PopularSection({ products }: { products: Product[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = Math.max(220, scrollRef.current.clientWidth * 0.85);
    scrollRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  if (products.length === 0) return null;

  return (
    <section className="w-full bg-[#F2F2ED] py-8 border-b border-[#1e1915]">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {/* رأس القسم الموحّد + أسهم التمرير */}
        <SectionHeading
          title="الأكثر طلباً"
          icon={<Flame className="h-[18px] w-[18px] fill-[#ef7a2a] text-[#ef7a2a] sm:h-5 sm:w-5" />}
          actions={
            <>
              {/* سهم يمين (للخلف في RTL) — يتملّى من اليمين عند الهاوفر */}
              <SliderArrow
                direction="right"
                onClick={() => scroll("right")}
                ariaLabel="تمرير يميناً"
                className="relative hidden h-9 w-9 sm:flex sm:h-10 sm:w-10"
              />
              {/* سهم يسار (للأمام في RTL) — يتملّى من الشمال عند الهاوفر */}
              <SliderArrow
                direction="left"
                onClick={() => scroll("left")}
                ariaLabel="تمرير يساراً"
                className="relative hidden h-9 w-9 sm:flex sm:h-10 sm:w-10"
              />
            </>
          }
        />

        {/* الموبايل: صفين منتجات تحت بعض في كل سحبة */}
        <ProductScroller
          ref={scrollRef}
          products={products}
          limit={products.length}
          label="الأكثر طلباً"
        />
      </div>
    </section>
  );
}
