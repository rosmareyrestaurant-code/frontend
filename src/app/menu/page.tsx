"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal } from "lucide-react";
import ProductCard from "@/components/home/ProductCard";
import type { Product } from "@/types";
import { normalizeArabic } from "@/lib/arabic";

// ─── Mock Data fallback مؤقت للتصميم ───────────────────────────────
// TODO: أعِد تعليق هذه الـ import بعد الانتهاء من اختبار التصميم
import {
  CHICKEN_PRODUCTS,
  PIZZA_PRODUCTS,
  BURGER_PRODUCTS,
  PASTA_PRODUCTS,
  DRINK_PRODUCTS,
} from "@/data/mockData";

const ALL_MOCK_PRODUCTS = [
  ...PIZZA_PRODUCTS,
  ...CHICKEN_PRODUCTS,
  ...BURGER_PRODUCTS,
  ...PASTA_PRODUCTS,
  ...DRINK_PRODUCTS,
];
// ────────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  pizza: "البيتزا",
  chicken: "كريب ودجاج",
  burger: "سندوتشات وبرجر",
  pasta: "مكرونات",
  drinks: "مشروبات",
  desserts: "حلويات",
  extras: "إضافات روزماري",
};

function MenuContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [allProducts, setAllProducts] = useState<Product[]>(ALL_MOCK_PRODUCTS);
  const [loading, setLoading] = useState(false); // Mock Data جاهزة — لا loading
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [search, setSearch] = useState(initialQuery);
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc">("default");

  useEffect(() => {
    fetch("/api/products?limit=100")
      .then(r => r.json())
      .then(d => {
        const products: Product[] = d?.data?.products ?? [];
        // استخدم API فقط إذا كانت تحتوي منتجات
        if (d.success && products.length > 0) {
          setAllProducts(products);
        }
        // إذا API فارغ، Mock Data تبقى ظاهرة
      })
      .catch(() => {
        // فشل الـ API — Mock Data ظاهرة بالفعل
      });
  }, []);

  const CATEGORY_TABS = useMemo(() => [
    { id: "all", label: "كل الأكلات", count: allProducts.length },
    ...Array.from(new Set(allProducts.map(p => p.category))).map(id => ({
      id, label: CATEGORY_LABELS[id] ?? id,
      count: allProducts.filter(p => p.category === id).length,
    })),
  ], [allProducts]);

  const filteredProducts = useMemo(() => {
    return allProducts.filter(item => {
      const matchCat = selectedCategory === "all" || item.category === selectedCategory;
      const q = normalizeArabic(search.trim());
      const matchSearch = !q ||
        normalizeArabic(item.name).includes(q) ||
        (item.description ? normalizeArabic(item.description).includes(q) : false);
      return matchCat && matchSearch;
    }).sort((a, b) => {
      if (sortBy === "price-asc") return a.price - b.price;
      if (sortBy === "price-desc") return b.price - a.price;
      return 0;
    });
  }, [selectedCategory, search, sortBy, allProducts]);

  if (loading) return <div className="min-h-screen bg-[#F2F2ED] flex items-center justify-center"><div className="text-[#ff7a00] animate-pulse text-sm">جاري تحميل المنيو...</div></div>;

  if (error) return (
    <div className="min-h-screen bg-[#F2F2ED] flex items-center justify-center">
      <div className="text-center space-y-3">
        <p className="text-red-400 font-bold">{error}</p>
        <p className="text-xs text-[#5a4f45]">تأكد من تشغيل الخادم والاتصال بـ MongoDB</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F2F2ED] py-8 sm:py-12">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-wide">كل الأكلات والوجبات</h1>
          <p className="text-sm sm:text-base text-[#a89f94] leading-relaxed">
            استكشف جميع أصنافنا المميزة من البيتزا الإيطالية، الكريب المقرمش، السندوتشات الغنية، المكرونات، والمشروبات المنعشة.
          </p>
        </div>

        {/* البحث والترتيب */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-[#F2F2ED] border border-[#26201a] p-4 rounded-2xl shadow-lg">
          <div className="relative w-full md:max-w-md">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="ابحث عن وجبة بالاسم أو المكونات..."
              className="w-full rounded-xl bg-[#F2F2ED] py-2.5 pl-4 pr-10 text-xs sm:text-sm text-white placeholder-[#786e64] border border-[#2e2620] focus:border-[#ff7a00] focus:outline-none transition-all" />
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8a8076] pointer-events-none" />
          </div>
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
            <span className="text-xs text-[#a89f94] flex items-center gap-1.5 shrink-0">
              <SlidersHorizontal className="h-3.5 w-3.5 text-[#ff7a00]" /> ترتيب حسب:
            </span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-xl bg-[#F2F2ED] border border-[#2e2620] text-xs sm:text-sm text-[#d1cbc4] py-2 px-3 focus:border-[#ff7a00] focus:outline-none">
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
                  active ? "bg-[#ff7a00] text-white scale-105" : "bg-[#F2F2ED] border border-[#29221c] text-[#a89f94] hover:text-white hover:border-[#ff7a00]/40"
                }`}>
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? "bg-black/25 text-white" : "bg-[#F2F2ED] text-[#786e64]"}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* الشبكة */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-[#F2F2ED] border border-[#2a221b] flex items-center justify-center text-[#736a61]">
              <Search className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-white">لا توجد أكلات مطابقة</h3>
            <p className="text-xs sm:text-sm text-[#8a8076]">جرب البحث بكلمات أخرى أو اختر تصنيفاً آخر.</p>
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

export default function MenuPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F2F2ED] py-20 text-center text-white">جاري تحميل المنيو...</div>}>
      <MenuContent />
    </Suspense>
  );
}
