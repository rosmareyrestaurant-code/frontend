"use client";

import { useState } from "react";
import Image from "next/image";
import { GalleryImage } from "@/data/aboutData";

interface StackedGalleryProps {
  images: GalleryImage[];
}

export default function StackedGallery({ images }: StackedGalleryProps) {
  const [items, setItems] = useState(images);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleNext = () => {
    if (isAnimating || items.length < 2) return;
    setIsAnimating(true);
    setTimeout(() => {
      setItems((prev) => {
        const [first, ...rest] = prev;
        return [...rest, first];
      });
      setIsAnimating(false);
    }, 380);
  };

  // إزاحة وزاوية كل بطاقة خلفية
  const stackStyles: { rotate: string; translateX: string; translateY: string; scale: string }[] = [
    { rotate: "0deg",   translateX: "0px",  translateY: "0px",  scale: "1"    }, // المقدمة
    { rotate: "3deg",   translateX: "14px", translateY: "-10px", scale: "0.95" },
    { rotate: "-2.5deg",translateX: "-10px",translateY: "-18px", scale: "0.9"  },
    { rotate: "1.5deg", translateX: "6px",  translateY: "-26px", scale: "0.85" },
  ];

  return (
    <div className="flex flex-col items-center gap-5 select-none">
      {/* حاوية الكروت المتراكمة */}
      <div className="relative w-full max-w-sm mx-auto" style={{ height: "340px" }}>
        {items.map((img, idx) => {
          if (idx > 3) return null; // نعرض 4 كروت بس
          const style = stackStyles[idx] ?? stackStyles[3];
          const isFront = idx === 0;

          return (
            <div
              key={img.src}
              onClick={isFront ? handleNext : undefined}
              className={`
                absolute inset-0 rounded-2xl overflow-hidden
                border border-[#2a241f]
                shadow-[0_8px_40px_rgba(0,0,0,0.6)]
                transition-all duration-[380ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]
                ${isFront ? "cursor-pointer" : "cursor-default"}
                ${isAnimating && isFront ? "opacity-0 scale-90 -translate-y-4" : "opacity-100"}
              `}
              style={{
                zIndex: items.length - idx,
                transform: `rotate(${style.rotate}) translateX(${style.translateX}) translateY(${style.translateY}) scale(${style.scale})`,
              }}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                sizes="(max-width: 640px) 90vw, 400px"
                className="object-cover"
                priority={isFront}
              />

              {/* طبقة تدرج علوية للعمق */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            </div>
          );
        })}
      </div>

      {/* مؤشر نقاط الصور */}
      <div className="flex items-center gap-2">
        {items.map((img, idx) => (
          <button
            key={img.src}
            onClick={() => {
              if (isAnimating || idx === 0) return;
              setIsAnimating(true);
              setTimeout(() => {
                setItems((prev) => {
                  const arr = [...prev];
                  const [removed] = arr.splice(idx, 1);
                  arr.unshift(removed);
                  return arr;
                });
                setIsAnimating(false);
              }, 300);
            }}
            aria-label={`عرض الصورة ${idx + 1}`}
            className={`rounded-full transition-all duration-300 ${
              idx === 0
                ? "w-6 h-2 bg-[#ff7a00]"
                : "w-2 h-2 bg-[#2d2620] hover:bg-[#ff7a00]/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
