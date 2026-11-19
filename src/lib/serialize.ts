/**
 * دوال تحويل مستندات Mongoose (lean) إلى أشكال الـ API.
 * نستخدم نفس أسماء حقول الواجهة في الـ DB لتقليل التحويل:
 *   price (سعر حالي) / originalPrice (السعر المشطوب الأعلى) — يقابل basePrice/discountPrice في التعليمات
 *   isVisible — يقابل isActive في التعليمات (ظهور المنتج في المنيو)
 */
import type {
  Product,
  ProductSize,
  ProductAddon,
  Category,
} from "@/types";
import type {
  AdminProduct,
  AdminCategory,
  AdminBanner,
  BannerPosition,
  AdminOffer,
  AdminOrder,
  AdminCustomer,
  StoreSettings,
  OrderStatus,
} from "@/types/admin";
import type { DeliveryZone } from "@/types/delivery";
import type { PublicOrder, OrderItemSnapshot, CustomerInfo } from "@/types";

/* ─── أشكال الـ lean docs (تطابق المخططات) ───────────────────────── */
interface ProductLean {
  _id: { toString(): string };
  name: string;
  nameEn?: string;
  description?: string;
  descriptionEn?: string;
  image: string;
  imagePublicId?: string;
  category: string;
  categoryNameAr?: string;
  categoryNameEn?: string;
  price: number;
  originalPrice?: number;
  sizes?: ProductSize[];
  addons?: ProductAddon[];
  notes?: string;
  menuOrder?: number;
  isAvailable: boolean;
  isVisible: boolean;
  isFeatured: boolean;
  createdAt?: string;
}

interface CategoryLean {
  _id: { toString(): string };
  nameAr: string;
  nameEn?: string;
  slug: string;
  image: string;
  description?: string;
  sortOrder: number;
  isActive: boolean;
}

interface BannerLean {
  _id: { toString(): string };
  title: string;
  description?: string;
  image: string;
  imagePublicId?: string;
  position?: BannerPosition;
  ctaText?: string;
  ctaLink?: string;
  startDate?: string;
  endDate?: string;
  sortOrder: number;
  isActive: boolean;
}

interface OfferLean {
  _id: { toString(): string };
  title: string;
  subtitle: string;
  image: string;
  imagePublicId?: string;
  price: number;
  originalPrice: number;
  durationMinutes: number;
  sortOrder: number;
  isActive: boolean;
  createdAt?: string;
}

interface OrderLean {
  _id: { toString(): string };
  orderNumber: string;
  accessToken: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  area?: string;
  items: {
    productId: string;
    productName: string;
    productImage: string;
    selectedSize?: { id: string; name: string; price: number };
    selectedAddons: { id: string; name: string; price: number }[];
    unitPrice: number;
    quantity: number;
    itemTotal: number;
    notes?: string;
  }[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentMethod: "cash" | "vodafone_cash" | "instapay";
  paymentProofUrl?: string;
  paymentProofPublicId?: string;
  paymentStatus: "pending" | "paid";
  orderStatus: OrderStatus;
  notes?: string;
  createdAt: string;
}

interface SettingsLean {
  storeName: string;
  storeDescription: string;
  phone: string;
  email: string;
  address: string;
  logoUrl: string;
  currency: string;
  deliveryFee: number;
  minimumOrder: number;
  estimatedDeliveryTime: string;
  isStoreOpen: boolean;
  closedMessage: string;
  vodafoneCashNumber?: string;
  instapayAccount?: string;
  latitude: number;
  longitude: number;
  googleMapsUrl: string;
  workingHours: { day: string; isOpen: boolean; openTime: string; closeTime: string }[];
  socialLinks: { facebook: string; instagram: string; tiktok: string; whatsapp: string };
  galleryImages: { src: string; alt: string }[];
}

interface ZoneLean {
  _id: { toString(): string };
  name: string;
  days: string[];
  isActive: boolean;
  note?: string;
}

const id = (v: { toString(): string }) => String(v);

/* ─── المنتجات ───────────────────────────────────────────────────── */
export function toPublicProduct(doc: ProductLean): Product {
  return {
    id: id(doc._id),
    name: doc.name,
    description: doc.description,
    price: doc.price,
    originalPrice:
      doc.originalPrice && doc.originalPrice > doc.price
        ? doc.originalPrice
        : undefined,
    image: doc.image,
    category: doc.category,
    isPopular: doc.isFeatured,
    sizes: doc.sizes,
    addons: doc.addons,
  };
}

export function toAdminProduct(doc: ProductLean): AdminProduct {
  return {
    id: id(doc._id),
    name: doc.name,
    nameEn: doc.nameEn,
    description: doc.description ?? "",
    descriptionEn: doc.descriptionEn,
    image: doc.image,
    category: doc.category,
    categoryNameAr: doc.categoryNameAr,
    categoryNameEn: doc.categoryNameEn,
    price: doc.price,
    originalPrice: doc.originalPrice,
    sizes: doc.sizes,
    addons: doc.addons,
    notes: doc.notes,
    menuOrder: doc.menuOrder,
    isAvailable: doc.isAvailable,
    isVisible: doc.isVisible,
    isFeatured: doc.isFeatured,
    createdAt: doc.createdAt ?? new Date().toISOString(),
  };
}

/* ─── التصنيفات ──────────────────────────────────────────────────── */
export function toPublicCategory(
  doc: CategoryLean,
  itemCount?: number,
): Category {
  return {
    id: id(doc._id),
    name: doc.nameAr,
    nameEn: doc.nameEn,
    slug: doc.slug,
    image: doc.image,
    description: doc.description,
    itemCount,
  };
}

export function toAdminCategory(
  doc: CategoryLean,
  productCount = 0,
): AdminCategory {
  return {
    id: id(doc._id),
    nameAr: doc.nameAr,
    nameEn: doc.nameEn ?? "",
    slug: doc.slug,
    image: doc.image,
    description: doc.description,
    sortOrder: doc.sortOrder,
    isActive: doc.isActive,
    productCount,
  };
}

/* ─── البنرات ────────────────────────────────────────────────────── */
export function toPublicBanner(doc: BannerLean) {
  return {
    id: id(doc._id),
    title: doc.title,
    description: doc.description,
    image: doc.image,
    position: doc.position ?? "hero",
    ctaText: doc.ctaText,
    ctaLink: doc.ctaLink,
    startDate: doc.startDate,
    endDate: doc.endDate,
    sortOrder: doc.sortOrder,
  };
}

export function toAdminBanner(doc: BannerLean): AdminBanner {
  return {
    id: id(doc._id),
    title: doc.title,
    description: doc.description,
    image: doc.image,
    position: doc.position,
    ctaText: doc.ctaText,
    ctaLink: doc.ctaLink,
    startDate: doc.startDate,
    endDate: doc.endDate,
    sortOrder: doc.sortOrder,
    isActive: doc.isActive,
  };
}

/* ─── العروض ─────────────────────────────────────────────────────── */
export function toPublicOffer(doc: OfferLean) {
  return {
    id: id(doc._id),
    title: doc.title,
    subtitle: doc.subtitle,
    image: doc.image,
    price: doc.price,
    originalPrice: doc.originalPrice,
    durationMinutes: doc.durationMinutes,
    sortOrder: doc.sortOrder,
  };
}

export function toAdminOffer(doc: OfferLean): AdminOffer {
  return {
    id: id(doc._id),
    title: doc.title,
    subtitle: doc.subtitle,
    image: doc.image,
    price: doc.price,
    originalPrice: doc.originalPrice,
    durationMinutes: doc.durationMinutes,
    sortOrder: doc.sortOrder,
    isActive: doc.isActive,
    createdAt: doc.createdAt,
  };
}

/* ─── الطلبات ────────────────────────────────────────────────────── */
export function toAdminOrder(doc: OrderLean): AdminOrder {
  return {
    id: id(doc._id),
    orderNumber: doc.orderNumber,
    customerName: doc.customerName,
    customerPhone: doc.customerPhone,
    customerAddress: doc.customerAddress,
    area: doc.area,
    items: doc.items.map((i) => ({
      productId: i.productId,
      productName: i.productName,
      productImage: i.productImage,
      selectedSize: i.selectedSize,
      selectedAddons: i.selectedAddons,
      price: i.unitPrice,
      quantity: i.quantity,
      itemTotal: i.itemTotal,
      notes: i.notes,
    })),
    subtotal: doc.subtotal,
    deliveryFee: doc.deliveryFee,
    discount: doc.discount,
    total: doc.total,
    paymentMethod: doc.paymentMethod,
    paymentProofUrl: doc.paymentProofUrl || undefined,
    paymentProofPublicId: doc.paymentProofPublicId || undefined,
    paymentStatus: doc.paymentStatus,
    status: doc.orderStatus,
    notes: doc.notes,
    createdAt: doc.createdAt,
  };
}

/** الطلب كما يراه العميل: بيانات محدودة + لا يحتوي على حالة الدفع أو بيانات إدارية */
export function toPublicOrder(doc: OrderLean): PublicOrder {
  const customer: CustomerInfo = {
    name: doc.customerName,
    phone: doc.customerPhone,
    address: doc.customerAddress,
    notes: doc.notes ?? "",
    areaName: doc.area,
  };
  const items: OrderItemSnapshot[] = doc.items.map((i) => ({
    productId: i.productId,
    productName: i.productName,
    productImage: i.productImage,
    selectedSize: i.selectedSize,
    selectedAddons: i.selectedAddons,
    quantity: i.quantity,
    unitPrice: i.unitPrice,
    itemTotal: i.itemTotal,
    notes: i.notes,
  }));
  return {
    id: id(doc._id),
    orderNumber: doc.orderNumber,
    accessToken: doc.accessToken,
    customer,
    items,
    subtotal: doc.subtotal,
    deliveryFee: doc.deliveryFee,
    discount: doc.discount,
    total: doc.total,
    paymentMethod: doc.paymentMethod,
    paymentProofUrl: doc.paymentProofUrl || undefined,
    orderStatus: doc.orderStatus,
    createdAt: doc.createdAt,
  };
}

/* ─── العميل (مُشتق من الطلبات) ─────────────────────────────────── */
export function toAdminCustomer(
  phone: string,
  name: string,
  addresses: string[],
  ordersCount: number,
  totalSpent: number,
  firstOrderAt: string,
  lastOrderAt: string,
): AdminCustomer {
  return {
    id: phone,
    name,
    phone,
    addresses,
    ordersCount,
    totalSpent,
    firstOrderAt,
    lastOrderAt,
  };
}

/* ─── الإعدادات ──────────────────────────────────────────────────── */
export function toStoreSettings(doc: SettingsLean): StoreSettings {
  return {
    storeName: doc.storeName,
    storeDescription: doc.storeDescription,
    phone: doc.phone,
    email: doc.email,
    address: doc.address,
    logoUrl: doc.logoUrl,
    currency: doc.currency,
    deliveryFee: doc.deliveryFee,
    minimumOrder: doc.minimumOrder,
    estimatedDeliveryTime: doc.estimatedDeliveryTime,
    isStoreOpen: doc.isStoreOpen,
    closedMessage: doc.closedMessage,
    vodafoneCashNumber: doc.vodafoneCashNumber ?? "",
    instapayAccount: doc.instapayAccount ?? "",
    latitude: doc.latitude,
    longitude: doc.longitude,
    googleMapsUrl: doc.googleMapsUrl,
    workingHours: doc.workingHours,
    socialLinks: doc.socialLinks,
    galleryImages: doc.galleryImages,
  };
}

/** الإعدادات العامة للعميل (نفس الشكل تقريباً — لا أسرار) */
export function toPublicSettings(doc: SettingsLean) {
  return toStoreSettings(doc);
}

/* ─── مناطق التوصيل ─────────────────────────────────────────────── */
export function toDeliveryZone(doc: ZoneLean): DeliveryZone {
  return {
    id: id(doc._id),
    name: doc.name,
    days: doc.days as DeliveryZone["days"],
    isActive: doc.isActive,
    note: doc.note,
  };
}
