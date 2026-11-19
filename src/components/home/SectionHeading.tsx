import { ReactNode } from "react";

interface SectionHeadingProps {
  title: string;
  /** الأسهم أو أي أدوات على يسار العنوان في RTL */
  actions?: ReactNode;
}

/**
 * رأس موحّد لكل أقسام الصفحة الرئيسية:
 * شريط رأسي برتقالي رفيع بجانب العنوان، من غير أي نص فوقه أو خط تحته.
 */
export default function SectionHeading({
  title,
  actions,
}: SectionHeadingProps) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4 sm:mb-7">
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden="true"
          className="h-8 w-[3px] shrink-0 rounded-full bg-gradient-to-b from-[#ffb066] via-[#ff7a00] to-[#e66e00] shadow-[0_0_10px_rgba(255,122,0,0.45)] sm:h-9"
        />
        <h2 className="text-2xl font-black leading-none tracking-tight text-white sm:text-3xl">
          {title}
        </h2>
      </div>

      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  );
}
