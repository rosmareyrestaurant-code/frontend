import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: { value: string; positive: boolean };
  spark?: number[];
}

const DEFAULT_SPARK = [4, 6, 5, 7, 6, 8, 7, 9];

function Sparkline({ data }: { data: number[] }) {
  const w = 120;
  const h = 40;
  const pad = 3;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const points = data.map((v, i) => {
    const x = pad + (i * (w - pad * 2)) / (data.length - 1);
    const y = h - pad - ((v - min) / span) * (h - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const line = `M${points.join(" L")}`;
  const area = `${line} L${w - pad},${h} L${pad},${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-10 w-16 text-[#96A78F] sm:w-20 2xl:w-24" aria-hidden="true">
      <path d={area} fill="currentColor" opacity="0.16" />
      <path d={line} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = "text-[#50604D]",
  trend,
  spark = DEFAULT_SPARK,
}: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-[18px] border border-[#EDE9E0] bg-[#FBF9F6] p-4 shadow-[0_14px_30px_-24px_rgba(38,53,43,0.45)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 text-[12px] font-bold text-[#8F9186]">{title}</p>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#DEE3D5] text-[#50604D]">
          <Icon className={`h-5 w-5 ${iconColor}`} strokeWidth={1.9} />
        </span>
      </div>

      <p className="mt-2 truncate text-[24px] font-black leading-none tracking-tight text-[#333B2E] sm:text-[27px] xl:text-[21px] 2xl:text-[27px]">
        {value}
      </p>

      <div className="mt-4 flex items-end justify-between gap-2">
        <div className="min-w-0">
          {subtitle && <p className="text-[11px] text-[#9A9C90]">{subtitle}</p>}
          {trend && (
            <span className={`text-[11px] font-bold ${trend.positive ? "text-[#5E9464]" : "text-[#C25B4F]"}`}>
              {trend.positive ? "↑" : "↓"} {trend.value}
            </span>
          )}
        </div>
        <Sparkline data={spark} />
      </div>
    </div>
  );
}
