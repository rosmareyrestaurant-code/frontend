import {
  Truck,
  Bike,
  Megaphone,
  BadgePercent,
  Sparkles,
  Clock3,
  Gift,
  Flame,
  type LucideIcon,
} from "lucide-react";

export interface TickerIconOption {
  key: string;
  label: string;
  Icon: LucideIcon;
}

/** أيقونات جاهزة يقدر الأدمن يختار منها للشريط العلوي */
export const TICKER_ICON_OPTIONS: TickerIconOption[] = [
  { key: "truck", label: "عربية توصيل", Icon: Truck },
  { key: "bike", label: "دليفري", Icon: Bike },
  { key: "megaphone", label: "إعلان", Icon: Megaphone },
  { key: "percent", label: "خصم", Icon: BadgePercent },
  { key: "sparkles", label: "عروض", Icon: Sparkles },
  { key: "clock", label: "مواعيد", Icon: Clock3 },
  { key: "gift", label: "هدية", Icon: Gift },
  { key: "flame", label: "ساخن", Icon: Flame },
];

export function findTickerIcon(value: string | undefined): TickerIconOption | undefined {
  const key = (value ?? "").trim().toLowerCase();
  return TICKER_ICON_OPTIONS.find((option) => option.key === key);
}

/** بيرجّع الأيقونة الجاهزة، أو النص اللي المستخدم كتبه (إيموجي)، أو null */
export function resolveTickerIcon(value: string | undefined): {
  Icon: LucideIcon | null;
  text: string;
} {
  const option = findTickerIcon(value);
  if (option) return { Icon: option.Icon, text: "" };
  return { Icon: null, text: (value ?? "").trim() };
}
