import { AdminOrder } from "@/types/admin";

/** helper: ينشئ item بالحقول الجديدة المطلوبة بشكل موحّد */
const item = (
  productId: string,
  productName: string,
  productImage: string,
  price: number,
  quantity: number,
  notes?: string,
) => ({
  productId,
  productName,
  productImage,
  price,
  quantity,
  itemTotal: price * quantity,
  selectedAddons: [] as { id: string; name: string; price: number }[],
  ...(notes ? { notes } : {}),
});

export const MOCK_ORDERS: AdminOrder[] = [
  {
    id: "RZ-001", orderNumber: "RZ-001",
    customerName: "محمد أحمد السيد", customerPhone: "01012345678",
    customerAddress: "حدائق الزيتون، شارع النصر، عمارة 12، شقة 3",
    items: [
      item("piz-1", "بيتزا بيبروني سوبريم", "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=200&q=80", 110, 2),
      item("drk-2", "كوكاكولا مثلجة", "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=200&q=80", 20, 2),
    ],
    subtotal: 260, deliveryFee: 0, discount: 0, total: 260,
    paymentMethod: "cash", paymentStatus: "pending", status: "delivered",
    createdAt: "2026-11-18T10:30:00Z",
  },
  {
    id: "RZ-002", orderNumber: "RZ-002",
    customerName: "سارة محمود علي", customerPhone: "01198765432",
    customerAddress: "مدينة نصر، شارع عباس العقاد، برج الياسمين، دور 5",
    items: [
      item("chk-5", "كريب كرانشي سوبريم", "https://images.unsplash.com/photo-1519676867240-f03562e64548?auto=format&fit=crop&w=200&q=80", 85, 1),
      item("chk-1", "أجنحة دجاج حارة", "https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=200&q=80", 79, 1),
      item("drk-4", "موهيتو ليمون ونعناع", "https://images.unsplash.com/photo-1551024601-bec78aea704b?auto=format&fit=crop&w=200&q=80", 30, 2, "بدون ثلج"),
    ],
    subtotal: 224, deliveryFee: 0, discount: 0, total: 224,
    paymentMethod: "instapay", paymentStatus: "pending", status: "pending",
    paymentProofUrl: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=600&q=80",
    notes: "الرجاء الاتصال قبل التوصيل",
    createdAt: "2026-11-18T11:15:00Z",
  },
  {
    id: "RZ-003", orderNumber: "RZ-003",
    customerName: "كريم الشريف", customerPhone: "01155544433",
    customerAddress: "الرحاب، المدينة 2، شارع الألفي، فيلا 45",
    items: [
      item("brg-2", "دبل تشيز برجر", "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=200&q=80", 125, 1),
      item("pas-1", "مكرونة ألفريدو", "https://images.unsplash.com/photo-1621996346565-e3d5d6281745?auto=format&fit=crop&w=200&q=80", 74, 1),
    ],
    subtotal: 199, deliveryFee: 0, discount: 0, total: 199,
    paymentMethod: "cash", paymentStatus: "pending", status: "pending",
    createdAt: "2026-11-18T11:45:00Z",
  },
  {
    id: "RZ-004", orderNumber: "RZ-004",
    customerName: "يوسف علي حسن", customerPhone: "01066778899",
    customerAddress: "عباسية، شارع رمسيس، أمام البنك الأهلي",
    items: [
      item("brg-5", "ساندوتش فاهيتا لحم", "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=200&q=80", 110, 3),
      item("drk-1", "عصير مانجو طبيعي", "https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&w=200&q=80", 29, 3),
    ],
    subtotal: 417, deliveryFee: 0, discount: 0, total: 417,
    paymentMethod: "cash", paymentStatus: "pending", status: "pending",
    createdAt: "2026-11-18T12:00:00Z",
  },
  {
    id: "RZ-005", orderNumber: "RZ-005",
    customerName: "منى إبراهيم", customerPhone: "01222334455",
    customerAddress: "زهراء المعادي، شارع 9، عمارة الورود، شقة 15",
    items: [
      item("piz-3", "بيتزا باربيكيو تشيكن", "https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=200&q=80", 115, 1),
    ],
    subtotal: 115, deliveryFee: 0, discount: 0, total: 115,
    paymentMethod: "cash", paymentStatus: "pending", status: "pending",
    createdAt: "2026-11-18T12:20:00Z",
  },
  {
    id: "RZ-006", orderNumber: "RZ-006",
    customerName: "أحمد رضا", customerPhone: "01033445566",
    customerAddress: "الهرم، شارع البحر الأعظم، عمارة 7",
    items: [
      item("pas-5", "مكرونة نجرسكو دجاج", "https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=200&q=80", 88, 2),
      item("drk-5", "سموذي فراولة مثلج", "https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=200&q=80", 35, 1),
    ],
    subtotal: 211, deliveryFee: 0, discount: 0, total: 211,
    paymentMethod: "cash", paymentStatus: "pending", status: "cancelled",
    notes: "العميل ألغى الطلب",
    createdAt: "2026-11-18T09:00:00Z",
  },
  {
    id: "RZ-007", orderNumber: "RZ-007",
    customerName: "نورا الجمال", customerPhone: "01177889900",
    customerAddress: "الدقي، شارع جامعة الدول، برج المحروسة",
    items: [
      item("chk-2", "قطع دجاج مقرمش", "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=200&q=80", 89, 1),
      item("piz-5", "بيتزا ميكس جبن إكسترا", "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=200&q=80", 105, 1),
      item("drk-6", "آيس كوفي كراميل", "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=200&q=80", 38, 2),
    ],
    subtotal: 270, deliveryFee: 0, discount: 0, total: 270,
    paymentMethod: "cash", paymentStatus: "pending", status: "delivered",
    createdAt: "2026-11-18T08:30:00Z",
  },
  {
    id: "RZ-008", orderNumber: "RZ-008",
    customerName: "خالد عبد الله", customerPhone: "01099887766",
    customerAddress: "المقطم، شارع الهضبة، قطعة 10",
    items: [
      item("brg-1", "برجر روزماري كلاسيك", "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=200&q=80", 95, 2),
      item("drk-3", "عصير برتقال فريش", "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=200&q=80", 25, 2),
    ],
    subtotal: 240, deliveryFee: 0, discount: 0, total: 240,
    paymentMethod: "cash", paymentStatus: "pending", status: "pending",
    createdAt: "2026-11-18T12:35:00Z",
  },
];
