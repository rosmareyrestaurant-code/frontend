"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import ProductScroller from "@/components/home/ProductScroller";
import { useShop } from "@/context/ShopContext";
import {
  PIZZA_PRODUCTS,
  CHICKEN_PRODUCTS,
  BURGER_PRODUCTS,
  PASTA_PRODUCTS,
  DRINK_PRODUCTS,
} from "@/data/mockData";
import { Product } from "@/types";

const ALL_FOOD: Product[] = [
  ...PIZZA_PRODUCTS,
  ...CHICKEN_PRODUCTS,
  ...BURGER_PRODUCTS,
  ...PASTA_PRODUCTS,
  ...DRINK_PRODUCTS,
];

// استخراج الوجبات التي عليها خصم فقط
const DISCOUNTED_PRODUCTS = ALL_FOOD.filter(
  (p) => p.originalPrice && p.originalPrice > p.price
);

interface Deal {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  /** نسبة الصورة الأصلية عشان تظهر كاملة بدون قص */
  aspect: number;
  price: number;
  originalPrice: number;
  durationMinutes: number;
}

// ستة عروض بنفس التصميم، معروضين تحت بعض بترتيب 2، 1، 2، 1 ...
const DEALS: Deal[] = [
  {
    id: "deal-family",
    title: "كومبو العائلة الكبير",
    subtitle: "بيتزا لارج + كريب حلو + بطاطس عائلي + كانز مشروبات مثلجة — وجبة تكفي الجميع",
    image: "/images/hero/hero-pizza.jpg",
    aspect: 3 / 1,
    price: 269,
    originalPrice: 389,
    durationMinutes: 152,
  },
  {
    id: "deal-sandwiches",
    title: "عرض الساندوتشات والبطاطس والكريب",
    subtitle: "3 ساندوتشات من اختيارك + باكت بطاطس عائلي + كريب حلو",
    image: "/images/promo/promo-sandwiches-v2.jpg",
    aspect: 3967 / 1475,
    price: 199,
    originalPrice: 280,
    durationMinutes: 245,
  },
  {
    id: "deal-combo",
    title: "كومبو ميكس روزماري العملاق",
    subtitle: "بيتزا لارج + قطع دجاج مقرمش + بطاطس + كريب + كانز بيبسي مثلج",
    image: "/images/promo/promo-combo-v2.jpg",
    aspect: 3967 / 1475,
    price: 249,
    originalPrice: 340,
    durationMinutes: 318,
  },
  {
    id: "deal-burger",
    title: "كومبو البرجر المقرمش",
    subtitle: "برجر لحم مشوي + بطاطس مقرمشة + مشروب — وجبة سريعة تشبع",
    image: "/images/hero/hero-burger.jpg",
    aspect: 3 / 1,
    price: 129,
    originalPrice: 175,
    durationMinutes: 97,
  },
  {
    id: "deal-crepe",
    title: "كريب اليوم الحلو",
    subtitle: "كريب محشي بالدجاج أو الشوكولاتة + بطاطس + صوص روزماري المميز",
    image: "/images/hero/hero-crepe.jpg",
    aspect: 3 / 1,
    price: 99,
    originalPrice: 135,
    durationMinutes: 186,
  },
  {
    id: "deal-pasta",
    title: "مكرونة روزماري + مشروب",
    subtitle: "مكرونة بصوص البيستو أو الشيدر + كانز مثلج — اختيار خفيف ولذيذ",
    image: "/images/hero/hero-pasta.jpg",
    aspect: 3 / 1,
    price: 119,
    originalPrice: 160,
    durationMinutes: 274,
  },
];

function discountPercent(deal: Deal) {
  return Math.round(
    ((deal.originalPrice - deal.price) / deal.originalPrice) * 100
  );
}

// ترتيب العروض: صف من اثنين، ثم صف من واحد، ثم اثنين ... وهكذا
function buildRows(deals: Deal[]): Deal[][] {
  const rows: Deal[][] = [];
  let index = 0;
  let perRow = 2;

  while (index < deals.length) {
    rows.push(deals.slice(index, index + perRow));
    index += perRow;
    perRow = perRow === 2 ? 1 : 2;
  }

  return rows;
}

// تحويل العرض إلى منتج عشان يفتح فيه نفس موديل تفاصيل الوجبة
function dealToProduct(deal: Deal): Product {
  return {
    id: `offer-${deal.id}`,
    name: deal.title,
    description: `${deal.subtitle} — عرض حصري من روزماري.`,
    price: deal.price,
    originalPrice: deal.originalPrice,
    image: deal.image,
    category: "offers",
  };
}

function formatCountdown(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function DealBanner({ deal, onOrder }: { deal: Deal; onOrder: () => void }) {
  const initialSeconds = deal.durationMinutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  // عدّاد تنازلي حي يبدأ من مدة العرض ويتوقف عند الصفر
  useEffect(() => {
    const deadline = Date.now() + initialSeconds * 1000;
    const tick = () => {
      setSecondsLeft(Math.max(0, Math.round((deadline - Date.now()) / 1000)));
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [initialSeconds]);

  const expired = secondsLeft <= 0;

  return (
    <div className="group relative rounded-[28px] border border-[#2a221b] bg-[#14100e] shadow-xl shadow-black/40 transition-all duration-300 hover:border-[#ff7a00]/50">
      {/* عدّاد العرض: نصه فوق البانر ونصه جوه — اكبر وأوضح */}
      <span className="absolute -top-[20px] left-1/2 z-20 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-gradient-to-r from-[#ff7a00] to-[#e66e00] px-5 py-2 text-sm font-black text-white shadow-lg shadow-black/50 ring-2 ring-[#0b0a09]">
        <Clock className="h-4 w-4 text-white" />
        <span>{expired ? "انتهى العرض" : "ينتهي خلال"}</span>
        {!expired && (
          <span dir="ltr" className="font-mono text-base tracking-wider text-white">
            {formatCountdown(secondsLeft)}
          </span>
        )}
      </span>

      {/* صورة العرض: بنسبة الصورة الأصلية عشان تظهر كاملة بدون قص على كل الشاشات */}
      <div
        className="relative w-full overflow-hidden rounded-t-[28px] bg-[#15110e]"
        style={{ aspectRatio: deal.aspect }}
      >
        <Image
          src={deal.image}
          alt={deal.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 45vw, 650px"
        />
      </div>

      {/* تفاصيل العرض: صفي title/خصم ثم سعر/زر — بدون ازدحام على الموبايل */}
      <div className="relative flex flex-col gap-4 rounded-b-[28px] bg-gradient-to-t from-[#110e0c] via-[#14100e] to-transparent p-5 sm:p-7">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="mb-1.5 text-lg font-bold text-white transition-colors group-hover:text-[#ff7a00] sm:text-2xl">
              {deal.title}
            </h2>
            <p className="max-w-2xl text-xs leading-relaxed text-[#a89f94] sm:text-sm">
              {deal.subtitle}
            </p>
          </div>

          <span className="shrink-0 rounded-full bg-gradient-to-r from-[#dc2626] to-[#ff7a00] px-3 py-1 text-[11px] font-black text-white shadow-md shadow-black/30">
            خصم {discountPercent(deal)}%
          </span>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1 text-xl font-black text-[#ff7a00] sm:text-2xl">
              <span>{deal.price}</span>
              <span className="text-xs text-[#a89f94]">ج.م</span>
            </div>
            <span className="text-xs text-[#736a61] line-through">
              {deal.originalPrice} ج.م
            </span>
          </div>

          <button
            type="button"
            onClick={onOrder}
            className="w-full rounded-xl bg-gradient-to-r from-[#ff7a00] to-[#e66e00] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-black/40 transition-all hover:scale-105 active:scale-95 sm:w-auto sm:px-6"
          >
            اطلب العرض
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OffersPage() {
  const { setSelectedProduct } = useShop();

  return (
    <div className="min-h-screen bg-[#0b0a09] py-8 sm:py-12 select-none">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 space-y-12">
        {/* رأس الصفحة */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-wide">
            أقوى عروض الأكل من روزماري
          </h1>
          <p className="text-sm sm:text-base text-[#a89f94] leading-relaxed">
            استمتع بألذ الأكلات مع خصومات حقيقية تصل إلى 31% على وجبات الكومبو والسندوتشات والبيتزا.
          </p>
        </div>

        {/* ترتيب العروض: صف اتنين، صف واحد، صف اتنين، وهكذا */}
        <section className="space-y-12 sm:space-y-10">
          {buildRows(DEALS).map((row, rowIndex) => (
            <div
              key={rowIndex}
              className={
                row.length === 2
                  ? "grid grid-cols-1 gap-12 sm:gap-6 md:grid-cols-2"
                  : "grid grid-cols-1"
              }
            >
              {row.map((deal) => (
                <DealBanner
                  key={deal.id}
                  deal={deal}
                  onOrder={() => setSelectedProduct(dealToProduct(deal))}
                />
              ))}
            </div>
          ))}
        </section>

        {/* شبكة الوجبات الفردية التي عليها تخفيض */}
        <section className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="h-6 w-1.5 rounded-full bg-[#ff7a00]" />
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
                وجبات فردية بخصومات خاصة
              </h2>
            </div>
            <Link
              href="/menu"
              className="text-xs sm:text-sm font-bold text-[#ff7a00] hover:underline"
            >
              عرض كل المنيو &larr;
            </Link>
          </div>

          <ProductScroller
            products={DISCOUNTED_PRODUCTS}
            limit={DISCOUNTED_PRODUCTS.length}
            label="وجبات فردية بخصومات خاصة"
          />
        </section>
      </div>
    </div>
  );
}
