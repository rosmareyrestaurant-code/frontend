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

// ─── عنصر في الطلب ─────────────────────────────────────────────────
export interface AdminOrderItem {
  productId: string;
  productName: string;
  productImage: string;
  price: number;
  quantity: number;
  notes?: string;
}

// ─── طلب الأدمن ────────────────────────────────────────────────────
export interface AdminOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: AdminOrderItem[];
  subtotal: number;
  total: number;
  paymentMethod: "cash";
  status: OrderStatus;
  notes?: string;
  createdAt: string; // ISO string
}

// ─── حجم / قطعة للمنتج ────────────────────────────────────────────
export interface AdminProductSize {
  id: string;
  name: string;       // كبير / وسط / صغير أو قطعة / 2 قطع ...
  detail?: string;
  price: number;
  originalPrice?: number;
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

// ─── عميل الأدمن ───────────────────────────────────────────────────
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
  currency: string;
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
}

// ─── إحصائيات الداشبورد ────────────────────────────────────────────
export interface DashboardStats {
  totalOrders: number;
  newOrders: number;
  totalRevenue: number;
  totalProducts: number;
  totalCustomers: number;
  ordersByStatus: Record<OrderStatus, number>;
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
/** الدفع حالياً كاش فقط */
export const PAYMENT_METHOD_LABELS: Record<AdminOrder["paymentMethod"], string> = {
  cash: "كاش",
};
