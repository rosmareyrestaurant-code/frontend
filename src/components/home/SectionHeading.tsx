import { ReactNode } from "react";

interface SectionHeadingProps {
  title: string;
  /** أيقونة اختيارية تظهر على يمين العنوان في RTL */
  icon?: ReactNode;
  /** الأسهم أو أي أدوات على يسار العنوان في RTL */
  actions?: ReactNode;
}

/**
 * رأس موحّد لكل أقسام الصفحة الرئيسية:
 * عنوان كبير بخط أسود سميك مع خط برتقالي مرسوم تحته، مع أيقونة اختيارية.
 */
export default function SectionHeading({
  title,
  icon,
  actions,
}: SectionHeadingProps) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 sm:mb-7">
      <div className="flex min-w-0 items-center gap-2.5">
        {icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fbe9d5] ring-1 ring-[var(--color-primary)]/25 sm:h-10 sm:w-10">
            {icon}
          </span>
        )}
        <h2 className="relative inline-block pb-3.5 text-2xl font-black leading-none tracking-tight text-[var(--color-text-primary)] sm:text-3xl">
          {title}
          <svg
            aria-hidden="true"
            viewBox="0 0 120 12"
            preserveAspectRatio="none"
            className="pointer-events-none absolute bottom-0 right-0 h-2.5 w-full text-[var(--color-primary)]"
          >
            <path
              d="M3 8.5C20 4.5 52 3 117 6.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>
        </h2>
      </div>

      {actions && (
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">{actions}</div>
      )}
    </div>
  );
}
