import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: { value: string; positive: boolean };
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-[#ff7a00]",
  trend,
}: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[#2a231d] bg-gradient-to-b from-[#191512] to-[#12100e] p-4 sm:p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#ff7a00]/40 hover:shadow-lg hover:shadow-black/40">
      <div className="pointer-events-none absolute -top-12 -left-12 h-28 w-28 rounded-full bg-[#ff7a00]/10 opacity-60 blur-2xl transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-[#8a8076]">{title}</p>
          <p className="mt-2 text-2xl font-black leading-none tracking-tight text-white sm:text-[28px]">
            {value}
          </p>
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#2f2720] bg-[#1c1714] shadow-inner ${iconColor}`}
        >
          <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
        </div>
      </div>

      <div className="relative mt-3 flex min-h-[18px] flex-wrap items-center gap-2">
        {subtitle && <span className="text-[11px] text-[#8a8076]">{subtitle}</span>}
        {trend && (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
              trend.positive
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            {trend.positive ? "▲" : "▼"} {trend.value}
          </span>
        )}
      </div>
    </div>
  );
}
