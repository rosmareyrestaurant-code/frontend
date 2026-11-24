/**
 * ثوابت مشتركة للـ Backend (أسماء الكوكيز، حالات الطلب، تصنيفات افتراضية، حدود الرفع...).
 * لا تحتوي على أي أسرار.
 */
import type { OrderStatus } from "@/types/admin";

export const ADMIN_COOKIE_NAME = "rozmaly_admin";
/** كوكيز الجلسة التجريبية (لما مفيش باكند/قاعدة بيانات موصولة) */
export const DEMO_ADMIN_COOKIE = "rosemary_demo_session";
/** مدة الجلسة: 7 أيام بالثواني */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "delivered",
  "cancelled",
];

/** Pagination الافتراضي لاستعلامات الإدارة */
export const PAGINATION = {
  defaultPage: 1,
  defaultLimit: 20,
  maxLimit: 500,
} as const;

/**
 * التصنيفات الأساسية للعميل (كما هي متفق عليها) + التصنيفات الإضافية.
 * لا يُعتمد Mock Categories الخاص بالأدمن كمصدر نهائي؛ التصنيفات تُدار في الـ DB.
 */
export const PRIMARY_CATEGORY_SLUGS = ["pizza", "burger", "crepe", "pasta"] as const;
export const EXTRA_CATEGORY_SLUGS = ["drinks", "desserts", "extras"] as const;

/** حدود رفع الصور */
export const IMAGE_UPLOAD = {
  maxBytes: 8 * 1024 * 1024, // 8MB
  allowedMime: ["image/jpeg", "image/png", "image/webp"],
  folders: {
    products: "rozmaly/products",
    categories: "rozmaly/categories",
    banners: "rozmaly/banners",
    offers: "rozmaly/offers",
    branding: "rozmaly/branding",
    about: "rozmaly/about",
    payments: "rozmaly/payments",
    admins: "rozmaly/admins",
  },
} as const;

/** مفاتيح Session Storage للسلة والمفضلة (مع إصدار لتسهيل الترحيل لاحقاً) */
export const STORAGE_KEYS = {
  cart: "rozmaly_cart",
  favorites: "rozmaly_favorites",
  coupon: "rozmaly_coupon",
  lastOrder: "rozmaly_last_order",
  version: 1,
} as const;
