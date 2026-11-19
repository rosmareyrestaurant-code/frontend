"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Clock, ArrowLeft } from "lucide-react";
import ProductCard from "@/components/home/ProductCard";
import { useShop } from "@/context/ShopContext";
import type { Product } from "@/types";

// ─── Mock Data fallback مؤقت للتصميم ───────────────────────────────
// TODO: أعِد تعليق هذه الـ imports بعد الانتهاء من اختبار التصميم
import { MOCK_ADMIN_OFFERS } from "@/data/admin/offers";
import { PIZZA_PRODUCTS, CHICKEN_PRODUCTS, BURGER_PRODUCTS, PASTA_PRODUCTS } from "@/data/mockData";

const MOCK_DISCOUNTED = [...PIZZA_PRODUCTS, ...CHICKEN_PRODUCTS, ...BURGER_PRODUCTS, ...PASTA_PRODUCTS]
  .filter(p => p.originalPrice && p.originalPrice > p.price);

const MOCK_DEALS: Deal[] = MOCK_ADMIN_OFFERS.map(o => ({
  id: o.id,
  title: o.title,
  subtitle: o.subtitle,
  image: o.image,
  price: o.price,
  originalPrice: o.originalPrice,
  durationMinutes: o.durationMinutes,
}));
// ────────────────────────────────────────────────────────────────────

interface Deal {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  price: number;
  originalPrice: number;
  durationMinutes: number;
}

function buildRows(deals: Deal[]): Deal[][] {
  const rows: Deal[][] = [];
  for (let i = 0; i < deals.length; i += 2) {
    rows.push(deals.slice(i, i + 2));
  }
  return rows;
}

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
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (v: number) => String(v).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

function DealBanner({ deal, onOrder }: { deal: Deal; onOrder: () => void }) {
  const initialSeconds = deal.durationMinutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  useEffect(() => {
    const deadline = Date.now() + initialSeconds * 1000;
    const tick = () => setSecondsLeft(Math.max(0, Math.round((deadline - Date.now()) / 1000)));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [initialSeconds]);
  const expired = secondsLeft <= 0;

  return (
    <div className="group relative rounded-[28px] border border-[#e3ded2] bg-white shadow-[0_14px_34px_rgba(24,24,14,0.10)] transition-all duration-300 hover:shadow-[0_18px_44px_rgba(24,24,14,0.16)]">
      {/* العداد — في نفس مكانه أعلى منتصف البانر */}
      <span className="absolute -top-5 left-1/2 z-20 inline-flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#56624A] px-4 py-1.5 text-[11px] font-black text-[#fff] shadow-lg ring-4 ring-[#F2F2ED] sm:gap-2 sm:text-sm">
        <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        <span>{expired ? "انتهى العرض" : "ينتهي خلال:"}</span>
        {!expired && (
          <span dir="ltr" className="font-mono tracking-wider">{formatCountdown(secondsLeft)}</span>
        )}
      </span>

      <div className="relative flex min-h-[210px] overflow-hidden rounded-[28px] sm:min-h-[250px]">
        {/* الجانب النصي — يمين البانر في RTL */}
        <div className="relative z-10 flex w-[56%] shrink-0 flex-col justify-center gap-2 px-4 py-7 sm:gap-3 sm:px-7 lg:px-9">
          {/* العنوان الكبير */}
          <h2 className="text-xl font-black leading-none text-[#2F3A2E] sm:text-3xl lg:text-4xl">
            عرض خاص
          </h2>

          {/* كبسولة الوصف */}
          <div className="max-w-[220px] rounded-[22px] bg-[#56624A] px-4 py-2 text-center sm:max-w-[260px] sm:py-2.5">
            <p className="line-clamp-3 text-[11px] font-bold leading-snug text-[#fff] sm:text-sm">
              {deal.subtitle}
            </p>
          </div>

          {/* تفاصيل العرض */}
          <p className="line-clamp-2 text-[10px] font-black leading-snug text-[#2F3A2E] sm:text-xs">
            {deal.title}
          </p>

          <button
            type="button"
            onClick={onOrder}
            className="mt-1 inline-flex w-fit flex-row-reverse items-center gap-2 rounded-full bg-[#56624A] px-4 py-2 text-[11px] font-bold text-[#fff] shadow-md transition-all duration-200 hover:scale-[1.03] hover:bg-[#4A5540] active:scale-95 sm:px-5 sm:py-2.5 sm:text-sm"
          >
            <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>اطلب العرض</span>
          </button>
        </div>

        {/* صورة العرض — يسار البانر مع انحناء أبيض ناعم عند الحد */}
        <div className="relative min-w-0 flex-1 overflow-hidden bg-white">
          <Image
            src={deal.image}
            alt={deal.title}
            fill
            className="object-cover"
            sizes="(max-width:640px) 44vw,(max-width:1024px) 25vw,360px"
          />
          {/* حد أبيض منحني بين الصورة والنص */}
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-y-0 right-0 h-full w-12 text-[#fff] sm:w-16"
            fill="currentColor"
          >
            <path d="M100 0 H62 C42 12 74 34 52 52 C32 70 72 88 60 100 H100 Z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default function OffersPage() {
  const { setSelectedProduct } = useShop();
  const [deals, setDeals] = useState<Deal[]>(MOCK_DEALS);
  const [discountedProducts, setDiscountedProducts] = useState<Product[]>(MOCK_DISCOUNTED);
  const [loading] = useState(false); // Mock Data جاهزة

  useEffect(() => {
    Promise.all([
      fetch("/api/offers").then(r => r.json()),
      fetch("/api/products?limit=100").then(r => r.json()),
    ]).then(([offersData, productsData]) => {
      const apiDeals: Deal[] = offersData?.data ?? [];
      const products: Product[] = productsData?.data?.products ?? [];

      // استخدم API فقط إذا كانت تحتوي بيانات
      if (apiDeals.length > 0) setDeals(apiDeals);
      const discounted = products.filter(p => p.originalPrice && p.originalPrice > p.price);
      if (discounted.length > 0) setDiscountedProducts(discounted);
    }).catch(() => {
      // فشل الـ API — Mock Data ظاهرة بالفعل
    });
  }, []);

  if (loading) return <div className="min-h-screen bg-[#F2F2ED] flex items-center justify-center"><div className="text-[#ff7a00] animate-pulse">جاري التحميل...</div></div>;

  return (
    <div className="min-h-screen bg-[#F2F2ED] py-8 sm:py-12 select-none">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-wide">أقوى عروض الأكل من روزماري</h1>
          <p className="text-sm sm:text-base text-[#a89f94] leading-relaxed">استمتع بألذ الأكلات مع خصومات حقيقية على وجبات الكومبو والسندوتشات والبيتزا.</p>
        </div>

        {deals.length > 0 ? (
          <section className="space-y-12 sm:space-y-10">
            {buildRows(deals).map((row, rowIndex) => (
              <div key={rowIndex} className={row.length === 2 ? "grid grid-cols-1 gap-12 sm:gap-6 md:grid-cols-2" : "grid grid-cols-1"}>
                {row.map(deal => (
                  <DealBanner key={deal.id} deal={deal} onOrder={() => setSelectedProduct(dealToProduct(deal))} />
                ))}
              </div>
            ))}
          </section>
        ) : (
          <div className="text-center py-16 text-[#5a4f45]">لا توجد عروض متاحة حالياً</div>
        )}

        {discountedProducts.length > 0 && (
          <section className="space-y-6 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="h-6 w-1.5 rounded-full bg-[#ff7a00]" />
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide">وجبات فردية بخصومات خاصة</h2>
              </div>
              <Link href="/menu" className="text-xs sm:text-sm font-bold text-[#ff7a00] hover:underline">عرض كل المنيو &larr;</Link>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5 lg:gap-6">
              {discountedProducts.map(product => <ProductCard key={product.id} product={product} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
