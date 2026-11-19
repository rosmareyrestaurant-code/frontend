"use client";

import Image from "next/image";
import { useShop } from "@/context/ShopContext";
import { Product } from "@/types";

const PROMO_PRODUCTS: Record<number, Product> = {
  1: {
    id: "promo-deal-sandwiches",
    name: "عرض الساندوتشات والبطاطس والكريب",
    description:
      "3 ساندوتشات من اختيارك + باكت بطاطس عائلي مقرمش + كريب حلو — وجبة متكاملة توفيرية تكفي الأصحاب والعيلة.",
    price: 199,
    originalPrice: 280,
    image: "/images/promo/promo-sandwiches-v2.jpg",
    category: "offers",
  },
  2: {
    id: "promo-deal-combo",
    name: "كومبو ميكس روزماري العملاق",
    description:
      "بيتزا لارج من اختيارك + قطع دجاج مقرمش + باكت بطاطس عائلي + كريب حلو + كانز بيبسي مثلج — أقوى عرض ميكس في روزماري.",
    price: 249,
    originalPrice: 340,
    image: "/images/promo/promo-combo-v2.jpg",
    category: "offers",
  },
};

const banners = [
  {
    id: 1,
    image: "/images/promo/promo-sandwiches-v2.jpg",
    alt: "عرض خاص - 3 ساندوتشات + بطاطس + كريب",
    deal: PROMO_PRODUCTS[1],
  },
  {
    id: 2,
    image: "/images/promo/promo-combo-v2.jpg",
    alt: "عرض خاص - كومبو ميكس",
    deal: PROMO_PRODUCTS[2],
  },
];

export default function PromoBanners() {
  const { setSelectedProduct } = useShop();

  return (
    <section className="w-full px-4 py-5 sm:py-6 select-none">
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
        {banners.map((banner) => (
          <button
            key={banner.id}
            type="button"
            onClick={() => setSelectedProduct(banner.deal)}
            aria-label={`عرض تفاصيل ${banner.deal.name}`}
            className="group relative block aspect-[3967/1475] w-full overflow-hidden rounded-2xl border border-[#2a221b] bg-[#14100e] text-right shadow-lg shadow-black/40 transition-all duration-300 hover:border-[#ff7a00]/60 hover:shadow-xl hover:shadow-[#ff7a00]/10 hover:scale-[1.012] active:scale-[0.99] sm:rounded-3xl cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a00]"
          >
            {/* المساحة بنفس نسبة الصور وتملأها بالكامل */}
            <Image
              src={banner.image}
              alt={banner.alt}
              fill
              className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
              sizes="(max-width: 640px) 100vw, 50vw"
            />
          </button>
        ))}
      </div>
    </section>
  );
}
