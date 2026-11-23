"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Coffee, Dessert, IceCreamCone, Sparkles } from "lucide-react";

const SWEET_TAGS = [
  { label: "كريب نوتيلا", Icon: IceCreamCone },
  { label: "وافل شوكولاتة", Icon: Dessert },
  { label: "ميلك شيك", Icon: Coffee },
];

export default function SweetsSection() {
  return (
    <section className="w-full select-none px-4 py-5 sm:py-6">
      <div className="mx-auto max-w-[1400px]">
        <div className="relative overflow-hidden rounded-2xl bg-[var(--color-primary)] shadow-2xl shadow-black/30 sm:rounded-3xl">
          {/* زخارف الخلفية */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-[#F0DFC0]/15" />
            <div className="absolute -right-8 -top-8 h-44 w-44 rounded-full border border-[#F0DFC0]/10" />
            <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full border border-[#F0DFC0]/10" />
            <div
              className="absolute inset-0 opacity-[0.10]"
              style={{
                backgroundImage: "radial-gradient(#F0DFC0 1px, transparent 1px)",
                backgroundSize: "22px 22px",
              }}
            />
          </div>

          <div className="relative z-10 grid items-center gap-7 p-5 sm:p-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:p-10">
            {/* النص */}
            <div className="text-center lg:text-right">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#F0DFC0]/35 bg-[#F0DFC0]/10 px-3 py-1 text-[11px] font-bold text-[#F3E6CC]">
                <Sparkles className="h-3.5 w-3.5" />
                جديد في روزمالي
              </span>

              <p className="mt-4 text-[10px] font-black uppercase tracking-[0.35em] text-[#F0DFC0]/70">
                Rozmaly Sweets
              </p>

              <h2 className="relative mt-1 inline-block text-3xl font-black leading-tight text-[#fff] sm:text-4xl lg:text-[42px]">
                حلو روزمالي
                <svg
                  aria-hidden="true"
                  viewBox="0 0 160 14"
                  preserveAspectRatio="none"
                  className="absolute -bottom-2 right-0 h-3 w-full text-[#F0DFC0]"
                >
                  <path
                    d="M4 9C28 4 78 3 156 7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </h2>

              <p className="mx-auto mt-4 max-w-md text-xs font-semibold leading-relaxed text-[var(--color-primary-soft)] sm:text-sm lg:mx-0">
                تشكيلة حلويات روزماري الجديدة — كريب نوتيلا ووافل شوكولاتة وميلك شيك بارد،
                بتتعمل طازة كل يوم بمزاج روزماري.
              </p>

              <div className="mt-4 flex flex-wrap justify-center gap-2 lg:justify-start">
                {SWEET_TAGS.map(({ label, Icon }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#F0DFC0]/25 bg-[#fff]/8 px-3 py-1.5 text-[11px] font-bold text-[var(--color-primary-soft)]"
                  >
                    <Icon className="h-3.5 w-3.5 text-[#F0DFC0]" />
                    {label}
                  </span>
                ))}
              </div>

              <Link
                href="/menu"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#F0DFC0] px-6 py-3 text-sm font-black text-[var(--color-primary)] shadow-lg shadow-black/25 transition-all hover:scale-[1.02] hover:bg-[#F7EBD6] active:scale-95"
              >
                اطلب الحلو دلوقتي
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>

            {/* الصورة */}
            <div className="relative mx-auto w-full max-w-[440px] lg:max-w-none">
              <div
                aria-hidden="true"
                className="absolute inset-0 translate-x-3 translate-y-3 rounded-[26px] border border-[#F0DFC0]/25"
              />
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[24px] shadow-[0_24px_50px_-20px_rgba(0,0,0,0.55)] ring-1 ring-[#F0DFC0]/25">
                <Image
                  src="/images/promo/sweets-rozmaly.jpg"
                  alt="حلو روزمالي — كريب نوتيلا ووافل شوكولاتة وميلك شيك"
                  fill
                  sizes="(max-width: 1024px) 90vw, 620px"
                  className="object-cover object-center"
                />
              </div>

              {/* ختم "طازة كل يوم" */}
              <div className="absolute -bottom-5 right-5 flex h-20 w-20 -rotate-6 flex-col items-center justify-center rounded-full bg-[#F0DFC0] text-[var(--color-primary)] shadow-xl ring-4 ring-[var(--color-primary)]">
                <Sparkles className="h-4 w-4" />
                <span className="mt-0.5 text-[11px] font-black leading-none">طازة</span>
                <span className="mt-0.5 text-[10px] font-bold leading-none">كل يوم</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
