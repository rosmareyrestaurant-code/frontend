"use client";

import Image from "next/image";
import { CATEGORIES } from "@/data/mockData";

export default function CategoriesSection() {
  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, slug: string) => {
    e.preventDefault();
    const target = document.getElementById(slug);
    if (target) {
      const headerOffset = 90;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });

      window.history.pushState(null, "", `#${slug}`);
    }
  };

  return (
    <section id="categories" className="w-full bg-[#0b0a09] py-8 sm:py-10 select-none scroll-mt-24">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {/* عنوان القسم */}
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <span className="h-6 w-1.5 rounded-full bg-[#ff7a00]"></span>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
            التصنيفات
          </h2>
        </div>

        {/* تصنيفين في كل صف — صف تحت صف على كل المقاسات */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
          {CATEGORIES.map((category) => (
            <a
              key={category.id}
              href={`#${category.slug}`}
              onClick={(e) => handleScrollTo(e, category.slug)}
              className="group relative flex aspect-[1.75/1] w-full items-center overflow-hidden rounded-2xl bg-[#0d0c0b] border border-[#242018] shadow-lg transition-all duration-300 hover:border-[#ff7a00]/40 hover:shadow-2xl hover:shadow-black cursor-pointer"
            >
              {/* الجانب الأيمن: صورة الطعام تغطي اليمين بالكامل وحتى الحواف */}
              <div className="absolute right-0 top-0 bottom-0 h-full w-[68%] sm:w-[70%] overflow-hidden">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                  sizes="(max-width: 1024px) 50vw, 350px"
                />

                {/* تدرج لوني ناعم يدمج الصورة تدريجياً ناحية اليسار */}
                <div
                  className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,#0d0c0b_0%,#0d0c0b_12%,rgba(13,12,11,0.75)_35%,rgba(13,12,11,0.2)_60%,transparent_80%)]"
                />
              </div>

              {/* الجانب الأيسر: اسم التصنيف مثبت في أقصى يسار الكارت في المنتصف */}
              <div className="absolute left-0 top-0 bottom-0 z-10 flex h-full w-[45%] items-center justify-center p-4 sm:p-5 text-center">
                <span className="text-base font-black leading-tight text-white tracking-wide drop-shadow-md transition-colors duration-200 group-hover:text-[#ff7a00] sm:text-lg">
                  {category.name}
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
