"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import ProductCard from "@/components/home/ProductCard";
import type { Category, Product } from "@/types";
import { normalizeArabic } from "@/lib/arabic";
import { getProductPriceRange } from "@/lib/price-range";

// Mock Data معطّلة — الصفحة بتقرأ من الـ API/السيرفر
// import {
//   CHICKEN_PRODUCTS,
//   PIZZA_PRODUCTS,
//   BURGER_PRODUCTS,
//   PASTA_PRODUCTS,
//   DRINK_PRODUCTS,
// } from "@/data/mockData";
//
// const ALL_MOCK_PRODUCTS = [
//   ...PIZZA_PRODUCTS,
//   ...CHICKEN_PRODUCTS,
//   ...BURGER_PRODUCTS,
//   ...PASTA_PRODUCTS,
//   ...DRINK_PRODUCTS,
// ];

const CATEGORY_LABELS: Record<string, string> = {
  pizza: "البيتزا",
  chicken: "كريب",
  burger: "سندوتشات",
  pasta: "مكرونة",
  drinks: "مشروبات",
  desserts: "حلويات",
  extras: "إضافات روزماري",
};

/** يزامن كلمة البحث مع ?q= في الرابط — معزول في Suspense عشان الصفحة تفضل سريعة وثابتة */
function QuerySync({ onQuery }: { onQuery: (q: string) => void }) {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";

  useEffect(() => {
    onQuery(q);
  }, [q, onQuery]);

  return null;
}

export default function MenuClient({ products, categories = [] }: { products: Product[]; categories?: Category[] }) {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc">("default");

  // ترتيب التبويبات بيتبع ترتيب التصنيفات المحفوظ في الداتابيز — نفس ترتيب الرئيسية
  const CATEGORY_TABS = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
    }
    const ordered = categories
      .filter((category) => (counts.get(category.slug) ?? 0) > 0)
      .map((category) => ({ id: category.slug, label: category.name }));
    const known = new Set(ordered.map((tab) => tab.id));
    const extras = Array.from(counts.keys())
      .filter((id) => !known.has(id))
      .map((id) => ({ id, label: CATEGORY_LABELS[id] ?? id }));
    return [{ id: "all", label: "كل الأكلات" }, ...ordered, ...extras];
  }, [products, categories]);

  const filteredProducts = useMemo(() => {
    return products.filter(item => {
      const matchCat = selectedCategory === "all" || item.category === selectedCategory;
      const q = normalizeArabic(search.trim());
      const matchSearch = !q ||
        normalizeArabic(item.name).includes(q) ||
        (item.description ? normalizeArabic(item.description).includes(q) : false);
      return matchCat && matchSearch;
    }).sort((a, b) => {
      if (sortBy === "price-asc") return getProductPriceRange(a).min - getProductPriceRange(b).min;
      if (sortBy === "price-desc") return getProductPriceRange(b).min - getProductPriceRange(a).min;
      return 0;
    });
  }, [selectedCategory, search, sortBy, products]);

  return (
    <div className="min-h-screen bg-[var(--color-page-background)] py-8 sm:py-12">
      <Suspense fallback={null}>
        <QuerySync onQuery={setSearch} />
      </Suspense>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-wide">كل الأكلات والوجبات</h1>
          <p className="text-sm sm:text-base text-[var(--color-text-muted)] leading-relaxed">
            استكشف جميع أصنافنا المميزة من البيتزا الإيطالية، الكريب المقرمش، السندوتشات الغنية، المكرونات، والمشروبات المنعشة.
          </p>
        </div>

        {/* البحث والترتيب */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[var(--color-page-background)] border border-[var(--color-border)] p-4 rounded-2xl shadow-lg">
          <div className="relative w-full md:max-w-md">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ابحث عن وجبة بالاسم أو المكونات..."
              className="w-full rounded-xl bg-[var(--color-page-background)] py-2.5 pl-4 pr-10 text-xs sm:text-sm text-white placeholder-[var(--color-text-muted)] border border-[var(--color-border)] focus:border-[var(--color-primary)] focus:outline-none transition-all" />
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)] pointer-events-none" />
          </div>
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            <span className="text-xs text-[var(--color-text-muted)] flex items-center gap-1.5 shrink-0">
              <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--color-primary)]" /> ترتيب حسب:
            </span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-xl bg-[var(--color-page-background)] border border-[var(--color-border)] text-xs sm:text-sm text-[var(--color-text-primary)] py-2 px-3 focus:border-[var(--color-primary)] focus:outline-none">
              <option value="default">الافتراضي</option>
              <option value="price-asc">السعر: الأقل أولاً</option>
              <option value="price-desc">السعر: الأعلى أولاً</option>
            </select>
          </div>
        </div>

        {/* فلاتر التصنيفات */}
        <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORY_TABS.map(tab => {
            const active = selectedCategory === tab.id;
            return (
              <button key={tab.id} onClick={() => setSelectedCategory(tab.id)}
                className={`shrink-0 flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold transition-all duration-200 ${
                  active ? "bg-[var(--color-primary)] text-white scale-105" : "bg-[var(--color-page-background)] border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white hover:border-[var(--color-primary)]/40"
                }`}>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* الشبكة */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-[var(--color-page-background)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-muted)]">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-white">لا توجد أكلات مطابقة</h3>
            <p className="text-xs sm:text-sm text-[var(--color-text-muted)]">جرب البحث بكلمات أخرى أو اختر تصنيفاً آخر.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pt-2">
            {filteredProducts.map(product => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </div>
    </div>
  );
}
