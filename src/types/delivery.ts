/**
 * أنواع وأدوات مناطق التوصيل المجاني.
 * تُستخدم في لوحة التحكم وفي موقع العملاء من نفس المصدر.
 */

export const DELIVERY_DAYS = [
  { key: "saturday",  label: "السبت" },
  { key: "sunday",    label: "الأحد" },
  { key: "monday",    label: "الاثنين" },
  { key: "tuesday",   label: "الثلاثاء" },
  { key: "wednesday", label: "الأربعاء" },
  { key: "thursday",  label: "الخميس" },
  { key: "friday",    label: "الجمعة" },
] as const;

export type DeliveryDayKey = (typeof DELIVERY_DAYS)[number]["key"];

export interface DeliveryZone {
  id: string;
  /** اسم المنطقة كما يظهر للعميل */
  name: string;
  /** الأيام اللي التوصيل فيها مجاني لهذه المنطقة */
  days: DeliveryDayKey[];
  isActive: boolean;
  /** ملاحظة اختيارية تظهر للإدمن فقط */
  note?: string;
}

export type DeliveryZoneInput = Omit<DeliveryZone, "id">;

const DAY_BY_JS_INDEX: DeliveryDayKey[] = [
  "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday",
];

/** تحويل يوم النظام (0 = الأحد) إلى مفتاح يوم التوصيل */
export function getDayKey(date: Date): DeliveryDayKey {
  return DAY_BY_JS_INDEX[date.getDay()];
}

export function getTodayKey(): DeliveryDayKey {
  return getDayKey(new Date());
}

export function dayLabel(key: DeliveryDayKey): string {
  return DELIVERY_DAYS.find((d) => d.key === key)?.label ?? key;
}

/** صياغة الأيام بشكل مقروء: السبت / السبت والاثنين / السبت والاثنين والخميس */
export function formatDays(days: DeliveryDayKey[]): string {
  const labels = DELIVERY_DAYS.filter((d) => days.includes(d.key)).map((d) => d.label);
  if (labels.length === 0) return "كل الأيام";
  if (labels.length === 1) return labels[0];
  return `${labels.slice(0, -1).join("، ")} و${labels[labels.length - 1]}`;
}
