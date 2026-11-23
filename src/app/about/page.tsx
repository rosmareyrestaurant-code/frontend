"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bike, ChefHat, Leaf } from "lucide-react";
import StackedGallery from "@/components/about/StackedGallery";

// ─── Mock Data fallback مؤقت للتصميم ───────────────────────────────
// TODO: أعِد تعليق هذا بعد الانتهاء من اختبار التصميم
import { GALLERY_IMAGES } from "@/data/aboutData";
// ────────────────────────────────────────────────────────────────────

const DEFAULT_GALLERY = GALLERY_IMAGES;

const FEATURES = [
  { icon: Leaf, text: "مكونات طازجة دائماً" },
  { icon: ChefHat, text: "مذاق لا يُقاوم" },
  { icon: Bike, text: "توصيل سريع لكل أنحاء مصر" },
];

export default function AboutPage() {
  const [gallery, setGallery] = useState(DEFAULT_GALLERY);

  useEffect(() => {
    fetch("/api/settings/public").then(r => r.json()).then(d => {
      if (d.success) {
        const s = d.data;
        if (s.galleryImages?.length) setGallery(s.galleryImages);
      }
    }).catch(() => {});
  }, []);

  return (
    <main className="min-h-screen bg-[var(--color-page-background)] text-[var(--color-primary)]">
      {/* ─── الهيرو: من نحن ─── */}
      <section className="pt-10 pb-6 text-center sm:pt-14 lg:pt-16">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-black leading-tight text-[var(--color-primary)] sm:text-5xl lg:text-[54px]">
            من نحن
          </h1>
          <p className="mt-3 text-sm font-semibold text-[var(--color-primary)] sm:text-base lg:text-lg">
            قصة روزماري .. نكهة مختلفة
          </p>
          <span
            className="mx-auto mt-4 block h-[3px] w-16 rounded-full bg-[var(--color-text-primary)]"
            aria-hidden="true"
          />
        </div>
      </section>

      {/* ─── الحكاية: صورة + نص ─── */}
      <section className="py-10 sm:py-14">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
            {/* النص — يمين الصفحة في RTL */}
            <div className="order-1">
              <h2 className="text-3xl font-black leading-[1.2] text-[var(--color-primary)] sm:text-4xl lg:text-[50px]">
                حكايتنا تبدأ
                <br />
                من هنا
              </h2>
              <span
                className="mt-5 block h-[3px] w-24 rounded-full bg-[var(--color-text-primary)]"
                aria-hidden="true"
              />

              <div className="mt-7 space-y-5 text-sm font-bold leading-relaxed text-[var(--color-text-secondary)] sm:text-base lg:text-lg">
                <p>
                  روزماري هو موقع مصري لطلب الطعام أونلاين، متخصص في البيتزا
                  والبرجر والكريب والباستا.
                </p>
                <p>
                  نحن نؤمن أن الطعام ليس مجرد وجبة، بل تجربة ممتعة تجمع العائلة
                  والأصدقاء بأفضل نكهة وأعلى جودة.
                </p>
              </div>

              <ul className="mt-8 space-y-4">
                {FEATURES.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-center gap-3.5">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[var(--color-primary-border)] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]">
                      <Icon className="h-5 w-5 text-[var(--color-primary)]" strokeWidth={1.9} />
                    </span>
                    <span className="text-base font-bold text-[var(--color-primary)] sm:text-lg">
                      {text}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-9">
                <Link
                  href="/menu"
                  className="inline-flex items-center gap-3 rounded-full bg-[var(--color-primary)] px-8 py-3.5 text-sm font-bold text-[var(--color-on-primary)] shadow-[0_10px_24px_rgba(86,98,74,0.35)] transition-all duration-200 hover:bg-[var(--color-primary)] hover:scale-[1.02] active:scale-95 sm:text-base"
                >
                  <span>اعرف المزيد</span>
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </Link>
              </div>
            </div>

            {/* الصورة — يسار الصفحة في RTL */}
            <div className="order-2">
              <StackedGallery images={gallery} />
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
