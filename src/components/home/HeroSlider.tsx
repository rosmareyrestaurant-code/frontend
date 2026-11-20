"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import SliderArrow from "@/components/common/SliderArrow";

export interface HeroSlide {
  id: string;
  title: string;
  image: string;
  link: string;
}

/** الشرائح جاية من السيرفر (كاش) — مش بنعمل fetch هنا */
export default function HeroSlider({ slides }: { slides: HeroSlide[] }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  }, [slides.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  }, [slides.length]);

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
    touchStartY.current = event.touches[0]?.clientY ?? null;
    setIsPaused(true);
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const touch = event.changedTouches[0];
    if (!touch) return;

    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;

    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25) {
      if (deltaX < 0) nextSlide();
      else prevSlide();
    }

    touchStartX.current = null;
    touchStartY.current = null;
    setIsPaused(false);
  };

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, nextSlide]);

  if (slides.length === 0) return null;

  return (
    <section
      id="hero"
      aria-label="سلايدر العروض والوجبات الرئيسية"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative w-full overflow-hidden bg-[#F2F2ED] select-none"
    >
      {/* حاوية السلايدر بنسبة 3:1 بالضبط مطابقة لأبعاد صور الهيرو (4096×1364) */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative w-full touch-pan-y overflow-hidden bg-[#F2F2ED]"
        style={{ aspectRatio: "3 / 1" }}
      >
        {slides.map((slide, index) => {
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

        {/* أسهم التنقل الجانبية — بدون خلفية، وتمتلئ بلون أيقونات الموقع من جهة السهم */}
        <SliderArrow
          direction="left"
          onClick={prevSlide}
          ariaLabel="الشريحة السابقة"
          onImage
          iconClassName="h-5 w-5 sm:h-6 sm:w-6"
          className="absolute left-3 top-1/2 z-20 -translate-y-1/2 hidden lg:flex lg:left-6 lg:h-11 lg:w-11 xl:left-8 xl:h-12 xl:w-12"
        />

        <SliderArrow
          direction="right"
          onClick={nextSlide}
          ariaLabel="الشريحة التالية"
          onImage
          iconClassName="h-5 w-5 sm:h-6 sm:w-6"
          className="absolute right-3 top-1/2 z-20 -translate-y-1/2 hidden lg:flex lg:right-6 lg:h-11 lg:w-11 xl:right-8 xl:h-12 xl:w-12"
        />

        {/* مؤشرات الشرائح السفلية */}
        <div className="absolute bottom-3 sm:bottom-5 md:bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full bg-black/50 px-3.5 py-1.5 backdrop-blur-md border border-white/15">
          {slides.map((_, index) => (
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
