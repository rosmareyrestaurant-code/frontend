import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SITE_CONTACT } from "@/data/siteConfig";

export const metadata: Metadata = {
  title: "الشروط والأحكام",
  description: "شروط استخدام موقع مطعم روزماري وقواعد الطلب والتوصيل والدفع والإلغاء.",
  alternates: { canonical: "/terms" },
};

const SECTIONS = [
  {
    title: "الطلب والأسعار",
    points: [
      "الأسعار المعروضة بالجنيه المصري وقابلة للتغيير، والسعر المعتمد هو السعر الظاهر في صفحة مراجعة الطلب قبل التأكيد.",
      "حسب المنطقة، قد يُطبق حد أدنى للطلب ورسوم توصيل تظهر بوضوح قبل التأكيد.",
      "قد تكون بعض الأصناف غير متاحة مؤقتًا وفقًا لتوافر المكونات، وسيظهر ذلك في القائمة.",
    ],
  },
  {
    title: "الدفع",
    points: [
      "الدفع المتاح حاليًا: كاش عند الاستلام، فودافون كاش، أو إنستاباي.",
      "في الدفع الإلكتروني يجب رفع صورة إثبات التحويل مع الطلب؛ الطلب بدون إثبات لا يتم تأكيده.",
      "لا يطلب منك الموقع أبدًا بيانات بطاقة بنكية أو أرقامًا سرية.",
    ],
  },
  {
    title: "تأكيد الطلب والتوصيل",
    points: [
      "يصبح الطلب ملزمًا بعد وصول تأكيد الطلب وظهور رقم الطلب.",
      "أوقات التوصيل تقديرية وقد تتأثر بالازدحام أو الأحوال الجوية أو ظروف خارجة عن إرادتنا.",
      "يجب إدخال عنوان صحيح وتفصيلي ورقم هاتف متاح؛ قد يتم تعليق الطلب إذا تعذّر التواصل معك.",
    ],
  },
  {
    title: "الإلغاء والتعديل",
    points: [
      "يمكن إلغاء الطلب طالما حالته «في الانتظار» ولم يبدأ التحضير، بالتواصل معنا.",
      "بعد بدء التحضير أو خروج الطلب للتوصيل، قد لا يكون الإلغاء ممكنًا.",
      "في حال وجود خطأ في الطلب أو صنف ناقص، تواصل معنا فور الاستلام لمعالجته.",
    ],
  },
  {
    title: "الاستخدام المقبول",
    points: [
      "يُمنع استخدام الموقع لإرسال طلبات وهمية أو محتوى مسيء أو محاولة تعطيل الخدمة.",
      "نحتفظ بحق رفض أي طلب أو إيقاف الوصول للموقع في حال إساءة الاستخدام.",
    ],
  },
  {
    title: "المسؤولية والتعديلات",
    points: [
      "نلتزم بتقديم الطلب كما هو موصوف، ولا نتحمل مسؤولية التأخير الناتج عن ظروف قاهرة خارج سيطرتنا.",
      "قد نحدّث هذه الشروط من وقت لآخر، ويسري التحديث من تاريخ نشره على هذه الصفحة.",
      "تخضع هذه الشروط لقوانين جمهورية مصر العربية.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[var(--color-page-background)] text-[var(--color-text-secondary)]">
      <section className="pt-10 pb-6 text-center sm:pt-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h1 className="text-3xl font-black leading-tight text-[var(--color-primary)] sm:text-4xl">الشروط والأحكام</h1>
          <p className="mt-3 text-sm font-semibold text-[var(--color-primary)]">قواعد بسيطة تضمن لك ولينا تجربة طلب مريحة</p>
          <span className="mx-auto mt-4 block h-[3px] w-16 rounded-full bg-[var(--color-text-primary)]" aria-hidden="true" />
        </div>
      </section>

      <section className="pb-14">
        <div className="mx-auto max-w-3xl space-y-8 px-4 sm:px-6">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="text-lg font-black text-[var(--color-primary)]">{section.title}</h2>
              <ul className="mt-3 space-y-2.5">
                {section.points.map((point) => (
                  <li key={point} className="flex gap-2.5 text-sm font-semibold leading-relaxed">
                    <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary-border)]" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <h2 className="text-lg font-black text-[var(--color-primary)]">للتواصل</h2>
            <p className="mt-2 text-sm font-semibold leading-relaxed">
              أي استفسار بخصوص طلب أو هذه الشروط:{" "}
              <span dir="ltr" className="font-black text-[var(--color-primary)]">{SITE_CONTACT.phone}</span>{" "}
              — <span dir="ltr" className="font-black text-[var(--color-primary)]">{SITE_CONTACT.email}</span>
            </p>
            <p className="mt-3 text-xs font-semibold text-[var(--color-text-secondary)]">آخر تحديث: 20 نوفمبر 2026</p>
          </div>

          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-primary)] transition-colors hover:text-[var(--color-text-primary)]">
            <ArrowLeft className="h-4 w-4" /> العودة للرئيسية
          </Link>
        </div>
      </section>
    </main>
  );
}
