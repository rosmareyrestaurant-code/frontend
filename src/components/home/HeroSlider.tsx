"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { HERO_SLIDES } from "@/data/mockData";

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === HERO_SLIDES.length - 1 ? 0 : prev + 1));
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === 0 ? HERO_SLIDES.length - 1 : prev - 1));
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  return (
    <section
      id="hero"
      aria-label="سلايدر العروض والوجبات الرئيسية"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full overflow-hidden bg-[#0b0a09] select-none"
    >
      {/* حاوية السلايدر بنسبة 3:1 بالضبط مطابقة لأبعاد صور الهيرو (4096×1364) */}
      <div className="relative w-full overflow-hidden bg-[#0d0c0b]" style={{ aspectRatio: "3 / 1" }}>
        {HERO_SLIDES.map((slide, index) => {
          const isActive = index === currentSlide;

          return (
            <div
              key={slide.id}
              className={`absolute inset-0 h-full w-full transition-opacity duration-700 ease-in-out ${
                isActive ? "opacity-100 z-10" : "opacity-0 pointer-events-none z-0"
              }`}
            >
              {/* عرض البانر بكامل عرض الصفحة 100vw */}
              <Link
                href={slide.link}
                aria-label={slide.title}
                className="block relative h-full w-full cursor-pointer"
              >
                <Image
                  src={slide.image}
                  alt={slide.title}
                  fill
                  priority={index === 0}
                  className="h-full w-full object-cover object-center"
                  sizes="100vw"
                />
              </Link>
            </div>
          );
        })}

        {/* أسهم التنقل الجانبية بتأثير هوفر ناعم وطبيعي بدون امتلاء */}
        <button
          onClick={prevSlide}
          aria-label="الشريحة السابقة"
          className="absolute left-3 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white/90 shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-[#ff7a00] hover:bg-[#ff7a00] hover:text-white active:scale-95 lg:left-6 lg:flex lg:h-11 lg:w-11 xl:left-8 xl:h-12 xl:w-12"
        >
          <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        <button
          onClick={nextSlide}
          aria-label="الشريحة التالية"
          className="absolute right-3 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white/90 shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-[#ff7a00] hover:bg-[#ff7a00] hover:text-white active:scale-95 lg:right-6 lg:flex lg:h-11 lg:w-11 xl:right-8 xl:h-12 xl:w-12"
        >
          <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        {/* مؤشرات الشرائح السفلية */}
        <div className="absolute bottom-3 sm:bottom-5 md:bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full bg-black/50 px-3.5 py-1.5 backdrop-blur-md border border-white/15">
          {HERO_SLIDES.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              aria-label={`الانتقال إلى الشريحة ${index + 1}`}
              className={`transition-all duration-300 ${
                index === currentSlide
                  ? "w-7 h-1.5 sm:h-2 bg-[#ff7a00] rounded-full shadow-sm"
                  : "w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/70 hover:bg-white rounded-full"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
