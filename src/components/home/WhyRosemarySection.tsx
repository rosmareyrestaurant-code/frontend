import { Bike, ChefHat, Leaf } from "lucide-react";

const BENEFITS = [
  {
    icon: Leaf,
    title: "مكونات طازجة",
    description: "نستخدم أجود المكونات يومياً",
  },
  {
    icon: ChefHat,
    title: "تحضير عند الطلب",
    description: "كل وجبة بتتحضّر طازجة لك",
  },
  {
    icon: Bike,
    title: "توصيل سريع",
    description: "توصيل ساخن في أقرب وقت",
  },
];

export default function WhyRosemarySection() {
  return (
    <section
      aria-labelledby="why-rosemary-title"
      className="w-full bg-[var(--color-page-background)] pt-5 sm:pt-6"
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="mb-3 flex items-center justify-center gap-2 lg:justify-start">
          <span aria-hidden="true" className="h-px w-6 bg-[var(--color-primary-border)]" />
          <h2
            id="why-rosemary-title"
            className="text-xs font-black tracking-wide text-[var(--color-text-secondary)] sm:text-sm"
          >
            ليه روزماري؟
          </h2>
          <span aria-hidden="true" className="h-px w-6 bg-[var(--color-primary-border)]" />
        </div>

        <div className="overflow-hidden rounded-2xl border border-[var(--color-primary-border)]/50 bg-[linear-gradient(115deg,var(--color-surface-elevated)_0%,var(--color-primary-soft)_100%)] px-2 py-4 shadow-[0_10px_28px_-24px_rgba(38,53,43,0.55)] sm:px-5 sm:py-5">
          <div className="grid grid-cols-3">
            {BENEFITS.map(({ icon: Icon, title, description }, index) => (
              <div
                key={title}
                className={`flex min-w-0 flex-col items-center px-1.5 text-center sm:px-4 ${
                  index > 0 ? "border-s border-[var(--color-border)]" : ""
                }`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface-elevated)] text-[var(--color-primary)] ring-1 ring-[var(--color-primary-border)]/60 sm:h-10 sm:w-10">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.9} />
                </span>
                <p className="mt-2.5 text-[11px] font-black leading-snug text-[var(--color-text-primary)] sm:text-[13px]">
                  {title}
                </p>
                <p className="mt-1 text-[9px] leading-relaxed text-[var(--color-text-muted)] sm:text-[11px]">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
