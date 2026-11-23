import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SITE_CONTACT } from "@/data/siteConfig";

export const metadata: Metadata = {
  title: "سياسة الخصوصية",
  description: "كيف يجمع مطعم روزماري بياناتك ويستخدمها ويحميها عند الطلب من الموقع.",
  alternates: { canonical: "/privacy" },
};

const SECTIONS = [
  {
    title: "البيانات التي نجمعها",
    points: [
      "بيانات الطلب: الاسم، رقم الهاتف، عنوان التوصيل، المنطقة، محتوى الطلب والملاحظات.",
      "بيانات الدفع: طريقة الدفع المختارة، وصورة إثبات التحويل عند الدفع بفودافون كاش أو إنستاباي (لا نحتفظ بأي أرقام بطاقات أو كلمات مرور مالية).",
      "بيانات تقنية محدودة: لتحسين الأمان ومتابعة الأعطال، مثل وقت الطلب وعنوان IP لأغراض منع إساءة الاستخدام.",
    ],
  },
  {
    title: "كيف نستخدم هذه البيانات",
    points: [
      "تجهيز طلبك وتوصيله والتواصل معك بخصوصه.",
      "تأكيد عمليات الدفع اليدوي ومراجعة إثبات التحويل.",
      "تحسين تجربة الطلب وخدمة العملاء وإعداد تقارير مبيعات داخلية.",
      "حماية الموقع من الطلبات المزيفة أو الاستخدام المسيء.",
    ],
  },
  {
    title: "مشاركة البيانات",
    points: [
      "لا نبيع بياناتك لأي طرف ثالث.",
      "قد نشارك الاسم والهاتف والعنوان مع فريق التوصيل فقط لتنفيذ الطلب.",
      "قد نستخدم مزودي خدمات تقنيين (استضافة الموقع وقاعدة البيانات وتخزين الصور) لتشغيل الموقع، وهم ملتزمون بعدم استخدام البيانات لأغراض أخرى.",
    ],
  },
  {
    title: "الاحتفاظ بالبيانات",
    points: [
      "نحتفظ بسجل الطلبات للمحاسبة وخدمة العملاء وحل أي خلاف.",
      "يمكنك طلب حذف بياناتك الشخصية أو تصحيحها في أي وقت بالتواصل معنا، ما لم يوجد التزام قانوني بالاحتفاظ بها.",
    ],
  },
  {
    title: "الكوكيز والتخزين المحلي",
    points: [
      "نستخدم التخزين المحلي في متصفحك لحفظ سلة الطلب وآخر طلب، حتى لا تفقد اختياراتك عند تحديث الصفحة.",
      "لا نستخدم كوكيز إعلانية أو تتبعًا لأطراف ثالثة في الوقت الحالي.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[var(--color-page-background)] text-[var(--color-text-secondary)]">
      <section className="pt-10 pb-6 text-center sm:pt-14">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <h1 className="text-3xl font-black leading-tight text-[var(--color-primary)] sm:text-4xl">سياسة الخصوصية</h1>
          <p className="mt-3 text-sm font-semibold text-[var(--color-primary)]">خصوصيتك تهمنا — هنا كل حاجة عن بياناتك</p>
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
            <h2 className="text-lg font-black text-[var(--color-primary)]">التواصل معنا</h2>
            <p className="mt-2 text-sm font-semibold leading-relaxed">
              لأي سؤال عن خصوصية بياناتك أو لطلب حذفها، راسلنا على{" "}
              <span dir="ltr" className="font-black text-[var(--color-primary)]">{SITE_CONTACT.phone}</span>{" "}
              أو <span dir="ltr" className="font-black text-[var(--color-primary)]">{SITE_CONTACT.email}</span>.
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
