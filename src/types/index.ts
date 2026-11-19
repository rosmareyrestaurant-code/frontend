/**
 * تعريفات الأنواع المشتركة لمشروع Rosemary
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export type ArabicDirection = "rtl" | "ltr";

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  itemCount?: number;
}

export interface ProductSize {
  id: string;
  name: string;        // اسم الحجم مثل: صغير، وسط، كبير، سنجل، دبل
  detail?: string;      // تفاصيل توضيحية مثل: 24 سم، شخصين، 300 جم
  price: number;       // سعر هذا الحجم
  originalPrice?: number;
  isDefault?: boolean;
}

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
}

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

/** بيانات العميل في فورم الشيكاوت */
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

/** بيانات الطلب المكتمل */
export interface Order {
  id: string;
  items: import("@/context/ShopContext").CartItem[];
  customer: CustomerInfo;
  subtotal: number;
  total: number;
  status: "pending" | "confirmed" | "cancelled";
  createdAt: string;
}
