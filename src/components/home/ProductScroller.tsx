"use client";

import { forwardRef } from "react";
import { Product } from "@/types";
import ProductCard from "./ProductCard";

interface ProductScrollerProps {
  products: Product[];
  /** عدد المنتجات الأصلية المعروضة في القسم — مش كل المنيو */
  limit?: number;
  label: string;
}

/**
 * كل تصنيف على كل الشاشات: صفين منتجات تحت بعض، وقابل للسحب أفقياً.
 * بنعرض المنتجات الحقيقية فقط — من غير تكرار يربك العميل.
 * المسافة بين الكروت 16px والسحب يلفّ لكل صف كامل.
 */
const ProductScroller = forwardRef<HTMLDivElement, ProductScrollerProps>(
  function ProductScroller({ products, limit = 16, label }, ref) {
    const shown = products.slice(0, limit);

    if (shown.length === 0) return <div ref={ref} aria-label={label} />;

    return (
      <div
        ref={ref}
        role="region"
        aria-label={label}
        className="grid grid-flow-col grid-rows-2 gap-4 overflow-x-auto pt-3.5 pb-4 scroll-smooth snap-x snap-mandatory active:cursor-grabbing
          [grid-auto-columns:calc((100%_-_1rem)/2)]
          sm:[grid-auto-columns:calc((100%_-_2rem)/3)]
          lg:[grid-auto-columns:calc((100%_-_3rem)/4)]
          xl:[grid-auto-columns:calc((100%_-_4rem)/5)]
          [&>*]:snap-none
          max-sm:[&>*:nth-child(4n+1)]:snap-start
          sm:max-lg:[&>*:nth-child(6n+1)]:snap-start
          lg:max-xl:[&>*:nth-child(8n+1)]:snap-start
          xl:[&>*:nth-child(10n+1)]:snap-start
          [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {shown.map((product) => (
          <div key={product.id} className="min-w-0">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    );
  },
);

export default ProductScroller;
