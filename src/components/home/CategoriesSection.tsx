"use client";

import Image from "next/image";
import type { Category } from "@/types";
import SectionHeading from "./SectionHeading";
// Mock data معلّق — يُستخدم كـ fallback فارغ إذا لم تُمرَّر categories
// import { CATEGORIES } from "@/data/mockData";

interface CategoriesSectionProps {
  categories?: Category[];
}

export default function CategoriesSection({ categories = [] }: CategoriesSectionProps) {
  // أسماء أقسام قديمة محفوظة عشان اللينكات تفضل شغالة زي ما هي
  const slugToSectionId: Record<string, string> = {
    pizza: "pizza",
    chicken: "crepe",
    burger: "sandwiches",
    pasta: "pasta",
    drinks: "drinks",
    desserts: "desserts",
  };

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, slug: string) => {
    const sectionId = slugToSectionId[slug] ?? slug;
    const target = document.getElementById(sectionId);
    if (!target) return; // مفيش قسم بالمنتج — نخلي اللينك يروح للمنيو
    e.preventDefault();
    const headerOffset = 90;
    const elementPosition = target.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
    window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    window.history.pushState(null, "", `#${sectionId}`);
  };

  if (categories.length === 0) return null;

  return (
    <section id="categories" className="w-full bg-[var(--color-page-background)] py-8 sm:py-10 select-none scroll-mt-24">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <SectionHeading title="التصنيفات" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5 lg:gap-5">
          {categories.map((category) => (
            <a key={category.id} href={`#${slugToSectionId[category.slug] ?? category.slug}`}
              onClick={(e) => handleScrollTo(e, category.slug)}
              className="group relative flex aspect-[2.6/1] w-full items-stretch overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] shadow-[0_6px_18px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-primary)]/40 hover:shadow-lg cursor-pointer">
              {/* اسم التصنيف يمين الكارت */}
              <div className="relative flex w-[41%] shrink-0 items-center justify-center px-2 text-center">
                <span className="text-sm font-black leading-tight text-[var(--color-text-primary)] transition-colors group-hover:text-[var(--color-primary)] sm:text-base lg:text-lg">
                  {category.name}
                </span>
              </div>
              {/* صورة التصنيف يسار الكارت مع تلاشٍ أبيض عند حد الاسم */}
              <div className="relative w-[59%] overflow-hidden">
                <Image src={category.image || "/images/logo-rosemary-green.png"} alt={category.name} fill
                  className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                  sizes="(max-width: 1024px) 50vw, 350px" />
                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_left,#ffffff_0%,rgba(255,255,255,0.85)_7%,rgba(255,255,255,0.35)_18%,rgba(255,255,255,0)_38%)]" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
