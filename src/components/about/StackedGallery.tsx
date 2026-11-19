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

  return (
    <div className="mx-auto flex w-full max-w-[560px] select-none flex-col items-center">
      <div className="relative w-full pb-6 pt-4">
        {/* الخلفية الزيتية المائلة خلف الصورة */}
        <div
          aria-hidden="true"
          className="absolute inset-x-5 inset-y-6 rotate-[4deg] rounded-[38px] bg-[#A9B7A2] shadow-[0_18px_40px_rgba(86,98,74,0.16)]"
        />

        {/* بطاقة الصورة — مائلة عكس الخلفية */}
        <div className="relative aspect-[5/4] w-full">
          {items.map((img, idx) => {
            const isFront = idx === 0;
            return (
              <div
                key={img.src}
                onClick={isFront ? handleNext : undefined}
                className={`
                  absolute inset-0 -rotate-[2deg] overflow-hidden rounded-[28px]
                  shadow-[0_28px_55px_-18px_rgba(38,53,43,0.45)]
                  transition-all duration-[380ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]
                  ${isFront ? "cursor-pointer" : "cursor-default pointer-events-none"}
                  ${isAnimating && isFront ? "opacity-0 scale-95 -translate-y-2" : "opacity-100"}
                `}
                style={{ zIndex: items.length - idx }}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(max-width: 640px) 92vw, 560px"
                  className="object-cover"
                  priority={isFront}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* مؤشر الصور */}
      <div className="mt-4 flex items-center gap-2">
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
                ? "h-2 w-6 bg-[#56624A]"
                : "h-2 w-2 bg-[#C3CEBB] hover:bg-[#A9B7A2]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
