/**
 * مخطّطات Zod للتحقق من كل المدخلات القادمة من الواجهة.
 * كل ما يصل من العميل يجب أن يمرّ من هنا قبل أي استعلام أو حفظ.
 */
import { z } from "zod";

const EGY_PHONE = /^01[0-5]\d{8}$/;

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/* ─── أحجام وإضافات ──────────────────────────────────────────────── */
export const productSizeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "اسم الحجم مطلوب"),
  detail: z.string().optional(),
  price: z.number().min(0),
  originalPrice: z.number().min(0).optional(),
  isDefault: z.boolean().optional(),
});

export const productAddonSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "اسم الإضافة مطلوب"),
  price: z.number().min(0),
  isDefault: z.boolean().optional(),
});

/* ─── المنتجات ───────────────────────────────────────────────────── */
const baseProductFields = {
  name: z.string().trim().min(2, "اسم المنتج مطلوب"),
  nameEn: z.string().trim().optional(),
  description: z.string().trim().optional(),
  descriptionEn: z.string().trim().optional(),
  image: z.string().trim().min(1, "صورة المنتج مطلوبة"),
  imagePublicId: z.string().trim().optional(),
  category: z.string().trim().min(1, "التصنيف مطلوب"),
  categoryNameAr: z.string().trim().optional(),
  categoryNameEn: z.string().trim().optional(),
  price: z.number().min(0),
  originalPrice: z.number().min(0).optional(),
  sizes: z.array(productSizeSchema).optional(),
  addons: z.array(productAddonSchema).optional(),
  notes: z.string().trim().optional(),
  menuOrder: z.number().int().min(0).optional(),
  isAvailable: z.boolean(),
  isVisible: z.boolean(),
  isFeatured: z.boolean(),
};

export const createProductSchema = z.object({
  ...baseProductFields,
  description: z.string().trim().optional().default(""),
  imagePublicId: z.string().trim().optional().default(""),
  price: z.number().min(0).default(0),
  isAvailable: z.boolean().default(true),
  isVisible: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

export const updateProductSchema = z.object(baseProductFields).partial();

/** استيراد إكسيل: الصورة اختيارية (بتتظبط بعدين من لوحة التحكم) */
export const importProductSchema = createProductSchema.extend({
  image: z.string().trim().optional().default(""),
});

/* ─── التصنيفات ──────────────────────────────────────────────────── */
const baseCategoryFields = {
  nameAr: z.string().trim().min(1, "اسم التصنيف بالعربية مطلوب"),
  nameEn: z.string().trim().optional(),
  slug: z
    .string()
    .trim()
    .min(1)
    .regex(slugRegex, "الـ slug أحرف إنجليزية وأرقام وواصلات فقط"),
  image: z.string().trim().optional(),
  imagePublicId: z.string().trim().optional(),
  description: z.string().trim().optional(),
  sortOrder: z.number().int().min(0),
  isActive: z.boolean(),
  showOnHome: z.boolean(),
};

export const createCategorySchema = z.object({
  ...baseCategoryFields,
  image: z.string().trim().optional().default(""),
  imagePublicId: z.string().trim().optional().default(""),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().default(true),
  showOnHome: z.boolean().default(true),
});
export const updateCategorySchema = z.object(baseCategoryFields).partial();

/** حفظ ترتيب التصنيفات من الداشبورد — قائمة IDs بالترتيب النهائي */
export const reorderCategoriesSchema = z.object({
  ids: z
    .array(z.string().regex(/^[0-9a-fA-F]{24}$/, "معرّف تصنيف غير صحيح"))
    .min(1, "لا يوجد تصنيفات لحفظ ترتيبها")
    .max(300, "عدد التصنيفات أكثر من المسموح")
    .refine((ids) => new Set(ids).size === ids.length, "ترتيب التصنيفات فيه تكرار"),
});

/* ─── البنرات ────────────────────────────────────────────────────── */
const baseBannerFields = {
  title: z.string().trim().min(1, "عنوان البانر مطلوب"),
  description: z.string().trim().optional(),
  image: z.string().trim().min(1, "صورة البانر مطلوبة"),
  imagePublicId: z.string().trim().optional(),
  position: z.enum(["hero", "middle", "delivery"]),
  ctaText: z.string().trim().optional(),
  ctaLink: z.string().trim().optional(),
  startDate: z.string().trim().optional(),
  endDate: z.string().trim().optional(),
  sortOrder: z.number().int().min(0),
  isActive: z.boolean(),
};

export const createBannerSchema = z.object({
  ...baseBannerFields,
  imagePublicId: z.string().trim().optional().default(""),
  position: z.enum(["hero", "middle", "delivery"]).default("hero"),
  sortOrder: z.number().int().min(0).default(1),
  isActive: z.boolean().default(true),
});
export const updateBannerSchema = z.object(baseBannerFields).partial();

/* ─── العروض ─────────────────────────────────────────────────────── */
const baseOfferFields = {
  title: z.string().trim().min(1, "عنوان العرض مطلوب"),
  subtitle: z.string().trim().min(1, "محتويات العرض مطلوبة"),
  image: z.string().trim().min(1, "صورة العرض مطلوبة"),
  imagePublicId: z.string().trim().optional(),
  price: z.number().min(0, "السعر مطلوب"),
  originalPrice: z.number().min(0),
  durationMinutes: z.number().int().min(1),
  sortOrder: z.number().int().min(0),
  isActive: z.boolean(),
};

export const createOfferSchema = z.object({
  ...baseOfferFields,
  imagePublicId: z.string().trim().optional().default(""),
  originalPrice: z.number().min(0).default(0),
  durationMinutes: z.number().int().min(1).default(180),
  sortOrder: z.number().int().min(0).default(1),
  isActive: z.boolean().default(true),
});
export const updateOfferSchema = z.object(baseOfferFields).partial();

/* ─── مناطق التوصيل ──────────────────────────────────────────────── */
const baseDeliveryZoneFields = {
  name: z.string().trim().min(1, "اسم المنطقة مطلوب"),
  days: z.array(z.string()).min(1, "اختر يوم توصيل مجاني واحد على الأقل"),
  isActive: z.boolean(),
  note: z.string().trim().optional(),
};

export const deliveryZoneSchema = z.object({
  ...baseDeliveryZoneFields,
  isActive: z.boolean().default(true),
});
export const updateDeliveryZoneSchema = z.object(baseDeliveryZoneFields).partial();

/* ─── كوبونات الخصم ──────────────────────────────────────────────── */
/** الكود الإنجليزي موحّد بحروف كبيرة في قاعدة البيانات وفي الطلبات */
const couponCodeSchema = z
  .string()
  .trim()
  .min(2, "كود الخصم قصير جداً")
  .max(30, "كود الخصم طويل جداً")
  .regex(/^[A-Za-z0-9_-]+$/, "الكود يجب أن يكون حروفاً لاتينية أو أرقاماً")
  .transform((value) => value.toUpperCase());

const durationDaysSchema = z
  .number()
  .int("المدة يجب أن تكون رقماً صحيحاً")
  .min(1, "المدة يجب أن تكون يوم واحد على الأقل")
  .max(3650, "المدة لا يمكن أن تتجاوز 3650 يوماً")
  .nullable()
  .optional();

const baseCouponFields = {
  code: couponCodeSchema,
  discountPercent: z
    .number()
    .int("نسبة الخصم يجب أن تكون رقماً صحيحاً")
    .min(1, "نسبة الخصم يجب أن تكون 1 على الأقل")
    .max(100, "نسبة الخصم لا يمكن أن تتجاوز 100"),
  description: z.string().trim().max(200).optional(),
  isActive: z.boolean(),
  durationDays: durationDaysSchema,
};

export const createCouponSchema = z.object({
  ...baseCouponFields,
  description: z.string().trim().max(200).optional().default(""),
  isActive: z.boolean().default(true),
  durationDays: durationDaysSchema.default(null),
});
export const updateCouponSchema = z.object(baseCouponFields).partial();
export const validateCouponSchema = z.object({ code: couponCodeSchema });

/* ─── العميل والطلب ──────────────────────────────────────────────── */
export const customerInfoSchema = z.object({
  name: z.string().trim().min(3, "الاسم يجب أن يكون 3 أحرف على الأقل"),
  phone: z
    .string()
    .trim()
    .regex(EGY_PHONE, "رقم غير صحيح — يبدأ بـ 01 ومكوّن من 11 رقم"),
  address: z.string().trim().min(8, "يرجى إدخال عنوان تفصيلي أكثر"),
  notes: z.string().trim().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  areaId: z.string().trim().optional(),
  areaName: z.string().trim().optional(),
});

export const orderItemInputSchema = z.object({
  productId: z.string().trim().min(1),
  quantity: z.number().int().min(1, "الكمية يجب أن تكون 1 على الأقل"),
  sizeId: z.string().trim().optional(),
  addonIds: z.array(z.string().trim()).optional(),
  notes: z.string().trim().optional(),
  /** كوبون مُدخل على هذا المنتج فقط — النسبة يُعاد التحقق منها على السيرفر */
  couponCode: z.string().trim().max(30).optional(),
});

/** الحمولة المرسلة من العميل عند إنشاء طلب (POST /api/orders) */
export const createOrderSchema = z.object({
  items: z.array(orderItemInputSchema).min(1, "السلة فارغة"),
  customer: customerInfoSchema,
  paymentMethod: z.enum(["cash", "vodafone_cash", "instapay"]).optional().default("cash"),
  paymentProofUrl: z.string().trim().url().optional(),
  paymentProofPublicId: z.string().trim().optional(),
  /** رقم مرجع التحويل كما أدخله العميل — اختياري ويظهر على ورقة الطلب للمراجعة */
  transactionReference: z
    .string()
    .trim()
    .min(3, "رقم مرجع التحويل قصير جداً")
    .max(80, "رقم مرجع التحويل طويل جداً")
    .optional(),
  clientOrderId: z.string().trim().min(8, "معرّف الطلب غير صالح").max(80, "معرّف الطلب غير صالح").optional(),
  /** حقل قديم للتوافق مع العملاء القدامى — العملاء الجدد يرسلون الكود داخل كل منتج */
  couponCode: z.string().trim().max(30).optional(),
});

/* ─── إدارة الطلبات ──────────────────────────────────────────────── */
export const updateOrderStatusSchema = z.object({
  status: z.enum(["pending", "delivered", "cancelled"]),
});

/** مراجعة المدير لدفعة تحويل إلكتروني: تأكيد استلام المبلغ أو رفض التحويل */
export const orderPaymentActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("verify"),
    transactionReference: z
      .string()
      .trim()
      .min(3, "اكتب رقم مرجع عملية التحويل")
      .max(80, "رقم المرجع طويل جداً"),
    amount: z
      .number({ error: "المبلغ المستلم غير صحيح" })
      .finite("المبلغ المستلم غير صحيح")
      .positive("المبلغ المستلم غير صحيح"),
  }),
  z.object({
    action: z.literal("reject"),
    reason: z
      .string()
      .trim()
      .min(3, "اكتب سبب رفض التحويل")
      .max(300, "سبب الرفض طويل جداً"),
  }),
]);

/** قرار مراجعة الدفع من تفاصيل الطلب — الموظف والوقت يُحدَّدان على السيرفر */
export const paymentReviewSchema = z.object({
  decision: z.enum(["paid", "unpaid"]),
  /** مطلوب فقط عند تغيير قرار محفوظ سابقاً */
  override: z.boolean().optional().default(false),
});

/** تعديل بيانات العميل فقط (للأدمن) */
export const updateOrderSchema = z.object({
  customerName: z.string().trim().optional(),
  customerPhone: z.string().trim().optional(),
  customerAddress: z.string().trim().optional(),
  area: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  cashierNote: z.string().trim().max(500).optional(),
});

/* ─── طابور الطباعة ──────────────────────────────────────────────── */
export const printClaimSchema = z.object({
  orderId: z.string().trim().min(1, "معرّف الطلب مطلوب"),
  /** true = طباعة يدوية من زر الكاشير (تسمح بإعادة طباعة طلب مطبوع) */
  manual: z.boolean().optional().default(false),
});

export const printResultSchema = z.object({
  orderId: z.string().trim().min(1, "معرّف الطلب مطلوب"),
  claimId: z.string().trim().min(1, "معرّف الحجز مطلوب"),
  /*
   * printed مقبول فقط كإشارة afterprint مرتبطة بحجز صالح؛ السيرفر يتحقق من
   * claimId/الحالة، ولا يمكن لطلب عابر تغيير حالة طلب مطبوع.
   */
  status: z.enum(["printed", "unconfirmed", "failed"]),
  error: z.string().trim().max(300).optional(),
});

/* ─── المصادقة ───────────────────────────────────────────────────── */
export const adminLoginSchema = z.object({
  email: z.string().trim().email("بريد إلكتروني غير صحيح"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});

export const cashierAccountSchema = z.object({
  name: z.string().trim().min(2, "اسم الكاشير مطلوب").max(60, "الاسم طويل جداً"),
  email: z.string().trim().email("بريد إلكتروني غير صحيح"),
  password: z
    .string()
    .max(72, "كلمة المرور طويلة جداً")
    .refine((v) => v === "" || v.length >= 8, "كلمة المرور 8 أحرف على الأقل"),
  isActive: z.boolean(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8, "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل"),
  })
  .refine((d) => d.currentPassword !== d.newPassword, {
    message: "كلمة المرور الجديدة يجب أن تكون مختلفة",
    path: ["newPassword"],
  });

export const recoverPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل")
      .max(72, "كلمة المرور طويلة جدًا"),
    confirmPassword: z.string().min(1, "أكّد كلمة المرور الجديدة"),
    pin: z
      .string()
      .trim()
      .regex(/^\d{4}$/, "رمز الاستعادة لازم يكون 4 أرقام"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "تأكيد كلمة المرور غير مطابق",
    path: ["confirmPassword"],
  });

export const changeEmailSchema = z.object({
  currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
  newEmail: z.string().trim().toLowerCase().email("بريد إلكتروني غير صحيح").max(254),
});

export const updateAdminProfileSchema = z.object({
  name: z.string().trim().min(2, "الاسم قصير جدًا").max(60, "الاسم طويل جدًا"),
  avatar: z
    .union([z.literal(""), z.string().trim().url("رابط الصورة غير صحيح").max(500)])
    .optional()
    .default(""),
});

/* ─── إعدادات المتجر ─────────────────────────────────────────────── */
const workingHourSchema = z.object({
  day: z.string(),
  isOpen: z.boolean(),
  openTime: z.string(),
  closeTime: z.string(),
});

const socialLinksSchema = z.object({
  facebook: z.string().trim().optional(),
  instagram: z.string().trim().optional(),
  tiktok: z.string().trim().optional(),
  whatsapp: z.string().trim().optional(),
});

const galleryImageSchema = z.object({
  src: z.string().trim(),
  alt: z.string().trim().optional().default(""),
});

/** لون HEX فقط — الفاضي معناه «اترك القيمة المشتقة تلقائياً» (للإعدادات المتقدمة) */
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const hexOrEmpty = z
  .string()
  .trim()
  .refine((v) => v === "" || HEX_COLOR.test(v), "لون HEX غير صحيح")
  .max(7, "لون HEX غير صحيح");

const hexRequired = z
  .string()
  .trim()
  .regex(HEX_COLOR, "لون HEX غير صحيح — لازم يبدأ بـ # ويتبعه 6 أرقام أو حروف مثل #50604D");

const themeColorsSchema = z.object({
  primary: hexRequired,
  icon: hexRequired,
  background: hexRequired,
  primaryHover: hexOrEmpty.optional(),
  primaryActive: hexOrEmpty.optional(),
  iconHover: hexOrEmpty.optional(),
  textPrimary: hexOrEmpty.optional(),
  surface: hexOrEmpty.optional(),
  surfaceSecondary: hexOrEmpty.optional(),
  surfaceElevated: hexOrEmpty.optional(),
  border: hexOrEmpty.optional(),
});

export const storeSettingsSchema = z.object({
  storeName: z.string().trim().optional(),
  storeDescription: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  email: z.string().trim().email().or(z.literal("")).optional(),
  address: z.string().trim().optional(),
  logoUrl: z.string().trim().optional(),
  logoPublicId: z.string().trim().optional(),
  tickerMessage: z.string().trim().max(160, "نص الشريط طويل جداً").optional(),
  tickerIcon: z.string().trim().max(12, "الأيقونة طويلة جداً").optional(),
  tickerEnabled: z.boolean().optional(),
  tickerIconPosition: z.enum(["start", "end"]).optional(),
  theme: themeColorsSchema.partial().optional(),
  currency: z.string().trim().optional(),
  deliveryFee: z.number().min(0).optional(),
  minimumOrder: z.number().min(0).optional(),
  estimatedDeliveryTime: z.string().trim().optional(),
  isStoreOpen: z.boolean().optional(),
  closedMessage: z.string().trim().optional(),
  vodafoneCashNumber: z.string().trim().optional(),
  instapayAccount: z.string().trim().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  googleMapsUrl: z.string().trim().optional(),
  workingHours: z.array(workingHourSchema).optional(),
  socialLinks: socialLinksSchema.optional(),
  galleryImages: z.array(galleryImageSchema).optional(),
});
