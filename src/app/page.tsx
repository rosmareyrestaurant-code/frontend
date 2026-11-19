"use client";

import { Fragment, useEffect, useState } from "react";
import HeroSlider from "@/components/home/HeroSlider";
import PopularSection from "@/components/home/PopularSection";
import CategoriesSection from "@/components/home/CategoriesSection";
import PromoBanners from "@/components/home/PromoBanners";
import ProductSection from "@/components/home/ProductSection";
import type { Product, Category } from "@/types";

// Mock Data معطّلة — الصفحة بتقرأ كل حاجة من الـ API
// import {
//   CATEGORIES as MOCK_CATEGORIES,
//   CHICKEN_PRODUCTS,
//   PIZZA_PRODUCTS,
//   BURGER_PRODUCTS,
//   PASTA_PRODUCTS,
//   DRINK_PRODUCTS,
// } from "@/data/mockData";
//
// const MOCK_BY_CATEGORY: Record<string, Product[]> = {
//   chicken: CHICKEN_PRODUCTS,
//   pizza: PIZZA_PRODUCTS,
//   burger: BURGER_PRODUCTS,
//   pasta: PASTA_PRODUCTS,
//   drinks: DRINK_PRODUCTS,
// };

const SECTION_ORDER = [
  { id: "pizza",      title: "البيتزا",    slug: "pizza"   },
  { id: "crepe",      title: "كريب",       slug: "chicken" },
  { id: "pasta",      title: "مكرونة",     slug: "pasta"   },
  { id: "sandwiches", title: "سندوتشات",   slug: "burger"  },
  { id: "drinks",     title: "المشروبات",  slug: "drinks"  },
];

export default function HomePage() {
  const [byCategory, setByCategory] = useState<Record<string, Product[]>>({});
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/products?limit=500").then(r => r.json()),
      fetch("/api/categories").then(r => r.json()),
    ]).then(([productsData, categoriesData]) => {
      const products: Product[] = productsData?.data?.products ?? [];
      const cats: Category[] = categoriesData?.data ?? [];

      const grouped: Record<string, Product[]> = {};
      for (const p of products) {
        if (!grouped[p.category]) grouped[p.category] = [];
        grouped[p.category].push(p);
      }
      setByCategory(grouped);
      setCategories(cats);
    }).catch(() => {});
  }, []);

  return (
    <main className="flex w-full flex-col pb-4 sm:pb-8">
      <HeroSlider />
      <CategoriesSection categories={categories} />
      <PopularSection />
      {SECTION_ORDER.map(({ id, title, slug }, index) => (
        <Fragment key={id}>
          {index === SECTION_ORDER.length - 1 && <PromoBanners />}
          <ProductSection id={id} title={title} products={byCategory[slug] ?? []} />
        </Fragment>
      ))}
    </main>
  );
}
