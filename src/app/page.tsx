import { Fragment } from "react";
import HeroSlider from "@/components/home/HeroSlider";
import PopularSection from "@/components/home/PopularSection";
import CategoriesSection from "@/components/home/CategoriesSection";
import PromoBanners from "@/components/home/PromoBanners";
import ProductSection from "@/components/home/ProductSection";
import { getHomeData } from "@/lib/storefront";
import type { Product } from "@/types";

const SECTION_ORDER = [
  { id: "pizza",      title: "البيتزا",    slug: "pizza"   },
  { id: "crepe",      title: "كريب",       slug: "chicken" },
  { id: "pasta",      title: "مكرونة",     slug: "pasta"   },
  { id: "sandwiches", title: "سندوتشات",   slug: "burger"  },
  { id: "drinks",     title: "المشروبات",  slug: "drinks"  },
];

export default async function HomePage() {
  const { products, categories, heroBanners } = await getHomeData();

  const byCategory: Record<string, Product[]> = {};
  for (const p of products) {
    if (!byCategory[p.category]) byCategory[p.category] = [];
    byCategory[p.category].push(p);
  }

  const slides = heroBanners.map((b) => ({
    id: b.id,
    title: b.title,
    image: b.image,
    link: b.ctaLink || "#pizza",
  }));

  const popular = products.filter((p) => p.isPopular).slice(0, 20);

  return (
    <main className="flex w-full flex-col pb-4 sm:pb-8">
      <HeroSlider slides={slides} />
      <CategoriesSection categories={categories} />
      <PopularSection products={popular} />
      {SECTION_ORDER.map(({ id, title, slug }, index) => (
        <Fragment key={id}>
          {index === SECTION_ORDER.length - 1 && <PromoBanners />}
          <ProductSection id={id} title={title} products={byCategory[slug] ?? []} />
        </Fragment>
      ))}
    </main>
  );
}
