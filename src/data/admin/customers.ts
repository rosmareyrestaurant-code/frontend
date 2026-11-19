import { AdminCustomer } from "@/types/admin";

export const MOCK_ADMIN_CUSTOMERS: AdminCustomer[] = [
  { id: "cust-1", name: "محمد أحمد السيد",   phone: "01012345678", addresses: ["حدائق الزيتون، شارع النصر، عمارة 12، شقة 3"], ordersCount: 12, totalSpent: 2840, firstOrderAt: "2026-08-01T00:00:00Z", lastOrderAt: "2026-11-18T10:30:00Z" },
  { id: "cust-2", name: "سارة محمود علي",     phone: "01198765432", addresses: ["مدينة نصر، شارع عباس العقاد، برج الياسمين"],    ordersCount: 8,  totalSpent: 1960, firstOrderAt: "2026-09-15T00:00:00Z", lastOrderAt: "2026-11-18T11:15:00Z" },
  { id: "cust-3", name: "كريم الشريف",         phone: "01155544433", addresses: ["الرحاب، المدينة 2، شارع الألفي، فيلا 45"],       ordersCount: 5,  totalSpent: 1120, firstOrderAt: "2026-10-01T00:00:00Z", lastOrderAt: "2026-11-18T11:45:00Z" },
  { id: "cust-4", name: "يوسف علي حسن",       phone: "01066778899", addresses: ["عباسية، شارع رمسيس"],                             ordersCount: 15, totalSpent: 3540, firstOrderAt: "2026-07-20T00:00:00Z", lastOrderAt: "2026-11-18T12:00:00Z" },
  { id: "cust-5", name: "منى إبراهيم",         phone: "01222334455", addresses: ["زهراء المعادي، شارع 9، عمارة الورود، شقة 15"],    ordersCount: 3,  totalSpent: 490,  firstOrderAt: "2026-11-01T00:00:00Z", lastOrderAt: "2026-11-18T12:20:00Z" },
  { id: "cust-6", name: "أحمد رضا",             phone: "01033445566", addresses: ["الهرم، شارع البحر الأعظم، عمارة 7"],            ordersCount: 7,  totalSpent: 1650, firstOrderAt: "2026-09-01T00:00:00Z", lastOrderAt: "2026-11-18T09:00:00Z" },
  { id: "cust-7", name: "نورا الجمال",          phone: "01177889900", addresses: ["الدقي، شارع جامعة الدول، برج المحروسة"],         ordersCount: 20, totalSpent: 4800, firstOrderAt: "2026-06-10T00:00:00Z", lastOrderAt: "2026-11-18T08:30:00Z" },
  { id: "cust-8", name: "خالد عبد الله",        phone: "01099887766", addresses: ["المقطم، شارع الهضبة، قطعة 10"],                  ordersCount: 4,  totalSpent: 920,  firstOrderAt: "2026-10-15T00:00:00Z", lastOrderAt: "2026-11-18T12:35:00Z" },
];
