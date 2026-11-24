import { Fragment } from "react";
import HeroSlider from "@/components/home/HeroSlider";
import WhyRosemarySection from "@/components/home/WhyRosemarySection";
import PopularSection from "@/components/home/PopularSection";
import CategoriesSection from "@/components/home/CategoriesSection";
import PromoBanners from "@/components/home/PromoBanners";
import ProductSection from "@/components/home/ProductSection";
import { getHomeData } from "@/lib/storefront";
import type { Product } from "@/types";

/** أسماء أقسام قديمة محفوظة عشان اللينكات والبانرات القديمة تفضل شغالة */
const SECTION_ID_ALIAS: Record<string, string> = {
  chicken: "crepe",
  burger: "sandwiches",
};

const LEGACY_SECTIONS = [
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

  // الأقسام بتتبني من ترتيب التصنيفات المحفوظ في الداتابيز — مفيش ترتيب يدوي هنا
  const homeCategories = categories.filter((category) => category.showOnHome !== false);
  const sections =
    homeCategories.length > 0
      ? homeCategories
          .map((category) => ({
            id: SECTION_ID_ALIAS[category.slug] ?? category.slug,
            slug: category.slug,
            title: category.name,
            products: byCategory[category.slug] ?? [],
          }))
          .filter((section) => section.products.length > 0)
      : LEGACY_SECTIONS.map((section) => ({
          ...section,
          products: byCategory[section.slug] ?? [],
        }));

  return (
    <main className="flex w-full flex-col pb-4 sm:pb-8">
      <HeroSlider slides={slides} />
      <WhyRosemarySection />
      <CategoriesSection categories={homeCategories} />
      <PopularSection products={popular} />
      {sections.map(({ id, title, products: sectionProducts }, index) => (
        <Fragment key={id}>
          {index === sections.length - 1 && <PromoBanners />}
          <ProductSection id={id} title={title} products={sectionProducts} />
        </Fragment>
      ))}
    </main>
  );
}
