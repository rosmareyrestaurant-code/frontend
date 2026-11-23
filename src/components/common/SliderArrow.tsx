"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface SliderArrowProps {
  /** اتجاه السهم — والاتجاه نفسه بيحدد جهة امتلاء الهاوفر */
  direction: "left" | "right";
  onClick: () => void;
  ariaLabel: string;
  /** تظهر فوق الصور: أيقونة بيضاء بدون خلفية */
  onImage?: boolean;
  /** مقاسات/إظهار الزر (h-9 w-9 sm:h-10 ...) */
  className?: string;
  /** مقاس الأيقونة */
  iconClassName?: string;
}

/**
 * سهم سلايدر موحّد: بدون خلفية، وعند الهاوفر يتملى بلون أيقونات الموقع
 * من جهة السهم نفسها (سهم يمين من اليمين، سهم شمال من الشمال).
 */
export default function SliderArrow({
  direction,
  onClick,
  ariaLabel,
  onImage = false,
  className = "",
  iconClassName = "h-4 w-4",
}: SliderArrowProps) {
  const Icon = direction === "left" ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={`group/arrow flex shrink-0 items-center justify-center overflow-hidden rounded-full border bg-transparent transition-colors duration-200 active:scale-95 ${
        onImage
          ? "border-white/50 text-[#fff] hover:border-[var(--color-icon)]"
          : "border-[var(--color-primary-border)] text-[var(--color-icon)] hover:border-[var(--color-icon)]"
      } ${className}`}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-0 rounded-full bg-[var(--color-icon)] transition-transform duration-300 ease-out ${
          direction === "left"
            ? "left-0 -translate-x-full group-hover/arrow:translate-x-0"
            : "right-0 translate-x-full group-hover/arrow:translate-x-0"
        }`}
      />
      <Icon
        className={`relative z-10 transition-colors duration-200 group-hover/arrow:text-[#fff] ${iconClassName} ${
          onImage ? "drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)]" : ""
        }`}
      />
    </button>
  );
}
