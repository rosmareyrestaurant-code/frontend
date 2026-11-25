/**
 * تعريفات الأنواع المشتركة لمشروع Rozmaly — واجهة العملاء والـ API
 * الأنواع القديمة محفوظة كما هي لكي لا تنكسر الواجهات الحالية أثناء الربط التدريجي.
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: { code: string; message: string };
}

export type ArabicDirection = "rtl" | "ltr";

/* ─── التصنيفات ─────────────────────────────────────────────────── */
export interface Category {
  id: string;
  name: string;
  nameEn?: string;
  slug: string;
  image: string;
  description?: string;
  itemCount?: number;
  /** ترتيب الظهور المحفوظ في الداتابيز — المصدر الوحيد للترتيب */
  sortOrder?: number;
  /** إظهار قسم منتجات التصنيف في الصفحة الرئيسية */
  showOnHome?: boolean;
}

/* ─── أحجام وإضافات المنتج ──────────────────────────────────────── */
export interface ProductSize {
  id: string;
  name: string; // اسم الحجم مثل: صغير، وسط، كبير، سنجل، دبل
  detail?: string; // تفاصيل توضيحية مثل: 24 سم، شخصين، 300 جم
  price: number; // سعر هذا الحجم
  originalPrice?: number;
  isDefault?: boolean;
}

export interface ProductAddon {
  id: string;
  name: string; // اسم الإضافة مثل: جبنة إضافية، صوص حار
  price: number;
  isDefault?: boolean;
}

/* ─── المنتج (واجهة العميل) ─────────────────────────────────────── */
export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  isPopular?: boolean;
  sizes?: ProductSize[];
  addons?: ProductAddon[];
}

/* ─── البانرات والعروض (واجهة العميل) ───────────────────────────── */
export interface OfferBannerData {
  id: string;
  title: string;
  highlightText: string;
  discount: string;
  description?: string;
  image: string;
  buttonText: string;
  buttonLink: string;
  badge?: string;
  theme: "red" | "dark-red" | "orange";
}

export interface HeroSlideData {
  id: string;
  title: string;
  image: string;
  link: string;
  titleLine1?: string;
  titleLine2?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
}

/* ─── العميل والسلة ─────────────────────────────────────────────── */
export interface CustomerInfo {
  name: string;
  phone: string;
  address: string;
  notes: string;
  lat?: number;
  lng?: number;
  /** منطقة التوصيل المختارة (من إعدادات الإدمن) */
  areaId?: string;
  areaName?: string;
}

/** عنصر السلة المخزّن في Session Storage (مراجع فقط — بدون أسعار) */
export interface CartItemInput {
  productId: string;
  quantity: number;
  sizeId?: string;
  addonIds?: string[];
  notes?: string;
  /** كوبون مُدخل على هذا المنتج فقط */
  coupon?: AppliedCoupon;
}

/**
 * عنصر السلة المعروض في الواجهة (بعد hydratation من الـ API).
 * حقل product كائن كامل عشان أي مكوّن موجود يستهلك item.product.price/name/image يظل يعمل.
 */
export interface CartItem {
  product: Product;
  quantity: number;
  sizeId?: string;
  addonIds?: string[];
  notes?: string;
  coupon?: AppliedCoupon;
}

/* ─── حالات الطلب ───────────────────────────────────────────────── */
export type OrderStatus = "pending" | "delivered" | "cancelled";

/** طرق الدفع المتاحة */
export type PaymentMethod = "cash" | "vodafone_cash" | "instapay";

/** snapshot لعنصر داخل الطلب (محفوظ وقت إنشاء الطلب) */
export interface OrderItemSnapshot {
  productId: string;
  productName: string;
  productImage: string;
  selectedSize?: { id: string; name: string; price: number };
  selectedAddons: { id: string; name: string; price: number }[];
  quantity: number;
  unitPrice: number;
  itemTotal: number;
  notes?: string;
  couponCode?: string;
  couponPercent?: number;
  couponDiscount?: number;
}

/** كوبون مُتحقق منه ومحفوظ في جلسة العميل للمعاينة فقط */
export interface AppliedCoupon {
  code: string;
  discountPercent: number;
}

/** الطلب كما يراه العميل من الـ Public API (بيانات محدودة) */
export interface PublicOrder {
  id: string;
  orderNumber: string;
  customer: CustomerInfo;
  items: OrderItemSnapshot[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  couponCode?: string;
  couponPercent?: number;
  couponDiscount?: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentProofUrl?: string;
  paymentStatus: "pending" | "verified" | "paid" | "unpaid" | "rejected";
  transactionReference?: string;
  orderStatus: OrderStatus;
  createdAt: string;
}

/**
 * النوع القديم للطلب المستخدم حالياً في ShopContext وصفحة order-confirmation.
 * محفوظ للتوافق مع الواجهات الحالية؛ سيتم استبداله بـ PublicOrder عند ربط الواجهة.
 */
export interface Order {
  id: string;
  items: CartItem[];
  customer: CustomerInfo;
  subtotal: number;
  discount?: number;
  couponCode?: string;
  couponPercent?: number;
  couponDiscount?: number;
  total: number;
  status: "pending" | "delivered" | "cancelled";
  createdAt: string;
}
