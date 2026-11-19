"use client";

import { forwardRef, useEffect, useState } from "react";
import { Product } from "@/types";
import ProductCard from "./ProductCard";

interface ProductScrollerProps {
  products: Product[];
  /** عدد المنتجات الأصلية المعروضة في القسم — مش كل المنيو */
  limit?: number;
  label: string;
}

/** عدد الأعمدة الظاهرة في الشاشة: 2 موبايل، 3 تابلت، 4 ديسكتوب، 5 كبير */
function useVisibleColumns() {
  const [columns, setColumns] = useState(2);

  useEffect(() => {
    const queries = [
      { media: window.matchMedia("(min-width: 1280px)"), columns: 5 },
      { media: window.matchMedia("(min-width: 1024px)"), columns: 4 },
      { media: window.matchMedia("(min-width: 640px)"), columns: 3 },
    ];
    const update = () => {
      const match = queries.find((q) => q.media.matches);
      setColumns(match ? match.columns : 2);
    };
    update();
    queries.forEach((q) => q.media.addEventListener("change", update));
    return () => queries.forEach((q) => q.media.removeEventListener("change", update));
  }, []);

  return columns;
}

/**
 * كل تصنيف على كل الشاشات: صفين منتجات تحت بعض، وقابل للسحب أفقياً.
 * لو عدد المنتجات لا يكمل آخر صف، نعيد تدوير نفس المنتجات عشان مفيش خانة فاضية.
 * المسافة بين الصفين 16px عشان الكروت ما تلزقش في بعض.
 */
const ProductScroller = forwardRef<HTMLDivElement, ProductScrollerProps>(
  function ProductScroller({ products, limit = 16, label }, ref) {
    const columns = useVisibleColumns();
    const shown = products.slice(0, limit);
    const rowSize = columns * 2;

    const cards: { product: Product; key: string; duplicate: boolean }[] = [];
    if (shown.length > 0) {
      const pages = Math.ceil(shown.length / rowSize);
      const target = pages * rowSize;
      for (let i = 0; i < target; i += 1) {
        const product = shown[i % shown.length];
        const copy = Math.floor(i / shown.length);
        cards.push({
          product,
          key: `${product.id}-${copy}`,
          duplicate: copy > 0,
        });
      }
    }

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
        {cards.map(({ product, key, duplicate }) => (
          <div key={key} data-duplicate={duplicate || undefined} className="min-w-0">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    );
  },
);

export default ProductScroller;
