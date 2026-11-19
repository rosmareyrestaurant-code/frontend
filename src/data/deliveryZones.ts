import { DeliveryZone } from "@/types/delivery";

/**
 * المناطق الافتراضية التي يوصّل إليها المطعم.
 * تُستبدل لاحقاً ببيانات الباك اند؛ الإدمن يعدّلها من /dashboard/delivery-zones.
 */
export const DEFAULT_DELIVERY_ZONES: DeliveryZone[] = [
  {
    id: "zone-marj",
    name: "المرج",
    days: ["saturday"],
    isActive: true,
    note: "توصيل مجاني كل يوم سبت",
  },
  {
    id: "zone-maadi",
    name: "المعادي",
    days: ["sunday", "wednesday"],
    isActive: true,
  },
  {
    id: "zone-nasr",
    name: "مدينة نصر",
    days: ["tuesday"],
    isActive: true,
  },
];
