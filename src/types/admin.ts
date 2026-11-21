/**
 * أنواع TypeScript الخاصة بلوحة تحكم الإدارة
 * مستقلة عن أنواع واجهة العملاء
 */

// ─── حالات الطلب ───────────────────────────────────────────────────
export type OrderStatus = "pending" | "delivered" | "cancelled";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "في الانتظار",
  delivered: "تم التسليم",
  cancelled: "ملغي",
};

export const ORDER_STATUS_COLORS: Record<
  OrderStatus,
  { bg: string; text: string; border: string }
> = {
  pending: { bg: "#facc15/15", text: "#facc15", border: "#facc15/30" },
  delivered: { bg: "#22c55e/15", text: "#22c55e", border: "#22c55e/30" },
  cancelled: { bg: "#f87171/15", text: "#f87171", border: "#f87171/30" },
};

/** الحالات التي يُسمح للعميل بإلغاء الطلب عندها */
export const CUSTOMER_CANCELABLE_STATUSES: OrderStatus[] = ["pending"];

/** انتقالات الحالة المسموح بها (للأدمن) */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

// ─── طريقة الدفع ───────────────────────────────────────────────────
export type PaymentMethod = "cash" | "vodafone_cash" | "instapay";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "كاش عند الاستلام",
  vodafone_cash: "فودافون كاش",
  instapay: "إنستاباي",
};

// ─── عنصر في الطلب ─────────────────────────────────────────────────
export interface AdminOrderAddon {
  id: string;
  name: string;
  price: number;
}

export interface AdminOrderItem {
  productId: string;
  productName: string;
  productImage: string;
  selectedSize?: { id: string; name: string; price: number };
  selectedAddons?: AdminOrderAddon[];
  price: number; // سعر الوحدة بعد الحجم والإضافات
  quantity: number;
  itemTotal?: number;
  notes?: string;
}

// ─── طلب الأدمن ────────────────────────────────────────────────────
export interface AdminOrder {
  id: string;
  orderNumber?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  area?: string;
  items: AdminOrderItem[];
  subtotal: number;
  deliveryFee?: number;
  discount?: number;
  total: number;
  paymentMethod: PaymentMethod;
  /** رابط صورة التحويل (فودافون كاش / إنستاباي) */
  paymentProofUrl?: string;
  paymentProofPublicId?: string;
  paymentStatus?: "pending" | "paid";
  status: OrderStatus;
  notes?: string;
  createdAt: string; // ISO string
}

// ─── حجم / قطعة للمنتج ────────────────────────────────────────────
export interface AdminProductSize {
  id: string;
  name: string; // كبير / وسط / صغير أو قطعة / 2 قطع ...
  detail?: string;
  price: number;
  originalPrice?: number;
  isDefault?: boolean;
}

// ─── إضافة للمنتج ─────────────────────────────────────────────────
export interface AdminProductAddon {
  id: string;
  name: string;
  price: number;
  isDefault?: boolean;
}

// ─── منتج الأدمن ───────────────────────────────────────────────────
export interface AdminProduct {
  id: string;
  name: string;
  description: string;
  image: string;
  category: string;
  price: number;
  originalPrice?: number;
  /** الأحجام أو القطع — فاضية يعني المنتج سعره واحد */
  sizes?: AdminProductSize[];
  /** الإضافات الاختيارية المتاحة للمنتج */
  addons?: AdminProductAddon[];
  /** بيانات ملف الإكسيل الأصلية عشان التصدير يرجع بنفس الشكل */
  nameEn?: string;
  categoryNameAr?: string;
  categoryNameEn?: string;
  descriptionEn?: string;
  notes?: string;
  menuOrder?: number;
  isAvailable: boolean;
  isVisible: boolean;
  isFeatured: boolean;
  createdAt: string;
}

// ─── تصنيف الأدمن ──────────────────────────────────────────────────
export interface AdminCategory {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  image: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
  productCount: number;
}

// ─── بانر الأدمن ───────────────────────────────────────────────────
export type BannerPosition = "hero" | "middle" | "delivery";

export interface AdminBanner {
  id: string;
  title: string;
  description?: string;
  image: string;
  position?: BannerPosition;
  ctaText?: string;
  ctaLink?: string;
  startDate?: string;
  endDate?: string;
  sortOrder: number;
  isActive: boolean;
}

// ─── عرض الأدمن (عروض صفحة العروض) ─────────────────────────────────
export interface AdminOffer {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  price: number;
  originalPrice: number;
  durationMinutes: number;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
}

// ─── عميل الأدمن (مُشتق من الطلبات) ────────────────────────────────
export interface AdminCustomer {
  id: string;
  name: string;
  phone: string;
  addresses: string[];
  ordersCount: number;
  totalSpent: number;
  firstOrderAt: string;
  lastOrderAt: string;
}

// ─── إعدادات المتجر ────────────────────────────────────────────────
export interface StoreSettings {
  storeName: string;
  storeDescription: string;
  phone: string;
  email: string;
  address: string;
  logoUrl: string;
  /** جملة الشريط العلوي — لو فاضية يظهر نص مناطق التوصيل الافتراضي */
  tickerMessage?: string;
  /** أيقونة الشريط: مفتاح جاهز (truck…) أو إيموجي/حرف */
  tickerIcon?: string;
  currency: string;
  deliveryFee?: number;
  minimumOrder?: number;
  estimatedDeliveryTime?: string;
  isStoreOpen?: boolean;
  closedMessage?: string;
  /** رقم استلام فودافون كاش */
  vodafoneCashNumber?: string;
  /** حساب استلام إنستاباي (IPA أو رقم محفظة) */
  instapayAccount?: string;
  latitude?: number;
  longitude?: number;
  googleMapsUrl?: string;
  workingHours: {
    day: string;
    isOpen: boolean;
    openTime: string;
    closeTime: string;
  }[];
  socialLinks: {
    facebook: string;
    instagram: string;
    tiktok: string;
    whatsapp: string;
  };
  /** صور معرض صفحة «من نحن» */
  galleryImages?: { src: string; alt: string }[];
}

// ─── إحصائيات الداشبورد ────────────────────────────────────────────
export interface TopProductStat {
  id: string;
  name: string;
  image: string;
  count: number;
  revenue: number;
}

export interface MonthlySalesPoint {
  /** بصيغة YYYY-MM */
  month: string;
  label: string;
  orders: number;
  revenue: number;
}

export interface DashboardStats {
  totalOrders: number;
  newOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalCustomers: number;
  ordersByStatus: Record<OrderStatus, number>;
  recentOrders: AdminOrder[];
  topProducts: TopProductStat[];
  salesByDay: { date: string; total: number }[];
  monthlySales: MonthlySalesPoint[];
  thisMonth: { orders: number; revenue: number; avgOrderValue: number };
}

// ─── نوع فلتر الطلبات ──────────────────────────────────────────────
export interface OrderFilters {
  search: string;
  status: OrderStatus | "all";
  dateFrom: string;
  dateTo: string;
}

// ─── نوع فلتر المنتجات ─────────────────────────────────────────────
export interface ProductFilters {
  search: string;
  category: string;
  isAvailable: "all" | "true" | "false";
  isVisible: "all" | "true" | "false";
  sortBy: "name" | "price" | "createdAt";
  sortOrder: "asc" | "desc";
}

// ─── طريقة الدفع ───────────────────────────────────────────────────
/** الدفع: كاش عند الاستلام أو تحويل فودافون كاش / إنستاباي */
