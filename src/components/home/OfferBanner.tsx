import Image from "next/image";
import Link from "next/link";
import { Flame, ShoppingCart } from "lucide-react";
import { OfferBannerData } from "@/types";

interface OfferBannerProps {
  banner: OfferBannerData;
}

export default function OfferBanner({ banner }: OfferBannerProps) {
  return (
    <section id="offers" className="w-full bg-[var(--color-page-background)] py-6 sm:py-8 select-none">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[var(--color-text-primary)] via-[var(--color-text-primary)] to-[var(--color-text-primary)] border border-[var(--color-primary)]/30 p-6 sm:p-10 lg:p-12 shadow-2xl shadow-black">
          {/* زخارف ضوئية دافئة في الخلفية */}
          <div className="absolute top-0 right-0 -mr-24 -mt-24 h-72 w-72 rounded-full bg-[var(--color-primary)]/15 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-24 -mb-24 h-72 w-72 rounded-full bg-[#ff3b30]/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col-reverse md:flex-row items-center justify-between gap-8 lg:gap-12">
            {/* صورة العرض الجذابة */}
            <div className="relative h-52 sm:h-64 lg:h-72 w-full md:w-1/2 flex items-center justify-center">
              <div className="relative h-full w-full max-w-md overflow-hidden rounded-2xl shadow-2xl border border-white/10 group">
                <Image
                  src={banner.image}
                  alt={banner.title}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>

            {/* تفاصيل العرض والنصوص الترويجية */}
            <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-right space-y-3 sm:space-y-4">
              {banner.badge && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary)]/15 text-[var(--color-primary)] border border-[var(--color-primary)]/30 px-3.5 py-1 text-xs font-bold shadow-sm">
                  <Flame className="h-3.5 w-3.5" />
                  {banner.badge}
                </span>
              )}

              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white leading-tight drop-shadow-md">
                {banner.title}
              </h3>

              <div className="space-y-1">
                <p className="text-2xl sm:text-3xl font-black text-[var(--color-primary)] drop-shadow-sm">
                  {banner.highlightText}
                </p>
                {banner.discount && (
                  <p className="text-sm sm:text-base font-medium text-[var(--color-text-muted)]">
                    {banner.discount}
                  </p>
                )}
              </div>

              <div className="pt-2">
                <Link
                  href={banner.buttonLink}
                  className="inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] px-7 py-3 text-sm sm:text-base font-bold text-white shadow-lg shadow-black/50 transition-all duration-300 hover:scale-105 active:scale-95"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>{banner.buttonText}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
