import type { Metadata } from "next";
import { Bike, ChefHat, Leaf } from "lucide-react";
import StackedGallery from "@/components/about/StackedGallery";
import { GALLERY_IMAGES } from "@/data/aboutData";

export const metadata: Metadata = {
  title: "عن روزماري | مطعم روزماري",
  description: "تعرّف على روزماري — قصتنا ومكوناتنا الطازجة",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#0b0a09] text-white">

      {/* ══════════════════════════════════════════
          Section 1 — Page Hero
      ══════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-16 sm:py-20 lg:py-24">
        <div
          className="pointer-events-none absolute -top-32 right-0 h-[500px] w-[500px] rounded-full opacity-[0.07]"
          style={{ background: "radial-gradient(circle, #ff7a00 0%, transparent 70%)" }}
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight text-white">
            عن روزماري
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-sm sm:text-base text-[#8c8277] leading-relaxed">
            روزماري — بيتزا وكريب ووجبات بتتعمل طازجة كل يوم. خلينا نعرّفك علينا.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          Section 2 — About + Stacked Gallery
      ══════════════════════════════════════════ */}
      <section className="py-14 sm:py-18 lg:py-20 border-t border-[#141210]">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-2 lg:gap-20 items-center">

            {/* ── الجانب الأيمن: النص ── */}
            <div className="order-1 space-y-7">
              <div>
                <h2 className="text-3xl sm:text-4xl font-black text-white leading-snug">
                  حكايتنا تبدأ
                  <br />
                  <span className="text-[#ff7a00]">من هنا</span>
                </h2>
              </div>

              <div className="space-y-4 text-[#8c8277] text-sm sm:text-base leading-relaxed">
                <p>
                  بدأنا روزماري بفكرة بسيطة: الأكل الحلو مش محتاج بهرجة. وجبة
                  تتعمل بجد، وتوصلك سخنة، وسعرها يستاهل.
                </p>
                <p>
                  بنجيب المكونات طازجة كل يوم، وبنحضّر طلبك بعد ما تطلبه — مش
                  قبلها. مفيش أسرار كبيرة عندنا؛ السر كله في التفاصيل: العجينة
                  تخمر صح، والجبنة تذوب صح، والبطاطس توصلك مقرمشة.
                </p>
                <p>
                  من البيتزا والكريب للسندوتشات والمكرونة والمشروبات — عندنا
                  حاجة تناسب كل مزاج، في أي وقت.
                </p>
              </div>

              <ul className="space-y-3">
                {[
                  { icon: Leaf, text: "مكونات بنجيبها طازجة كل يوم" },
                  { icon: ChefHat, text: "كل وجبة بتتعمل بعد طلبك، مش متحضّرة من قبل" },
                  { icon: Bike, text: "توصيل سريع عشان توصلك سخنة" },
                ].map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#ff7a00]/10 border border-[#ff7a00]/15">
                      <Icon className="h-3.5 w-3.5 text-[#ff7a00]" />
                    </span>
                    <span className="text-sm text-[#c4b9ad] leading-relaxed">
                      {text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* ── الجانب الأيسر: معرض الصور ── */}
            <div className="order-2">
              <StackedGallery images={GALLERY_IMAGES} />
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
