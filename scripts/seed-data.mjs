/**
 * seed-data.mjs — يُدخل البيانات الأولية (تصنيفات، إعدادات، مناطق، عروض).
 * آمن: لا يحذف بيانات موجودة، لا يُكرر إنشاء السجلات.
 * التشغيل: npm run seed:data
 */
import mongoose from "mongoose";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import dns from "node:dns";

// السكربتات تعمل محلياً فقط. dns.setServers يحل مشكلة SRV lookup على Windows.
// لا يُشغَّل على الإنتاج (Hostinger VPS)، فالتغيير هنا محلي بس.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, "..", ".env.local");
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}

const uri = process.env.MONGODB_URI;
if (!uri) { console.error("❌ MONGODB_URI غير موجود"); process.exit(1); }

/* ─── Schemas ─────────────────────────────────────────────────────── */
const catSchema = new mongoose.Schema({ nameAr: String, nameEn: String, slug: { type: String, unique: true }, image: String, description: String, sortOrder: Number, isActive: Boolean }, { timestamps: true });
const settingsSchema = new mongoose.Schema({ storeName: String, storeDescription: String, phone: String, email: String, address: String, logoUrl: String, currency: String, deliveryFee: Number, minimumOrder: Number, estimatedDeliveryTime: String, isStoreOpen: Boolean, closedMessage: String, latitude: Number, longitude: Number, googleMapsUrl: String, workingHours: Array, socialLinks: Object, galleryImages: Array }, { timestamps: true });
const zoneSchema = new mongoose.Schema({ name: String, days: [String], isActive: Boolean, note: String }, { timestamps: true });
const offerSchema = new mongoose.Schema({ title: String, subtitle: String, image: String, price: Number, originalPrice: Number, durationMinutes: Number, sortOrder: Number, isActive: Boolean }, { timestamps: true });

const Category = mongoose.models.Category || mongoose.model("Category", catSchema);
const StoreSettings = mongoose.models.StoreSettings || mongoose.model("StoreSettings", settingsSchema);
const DeliveryZone = mongoose.models.DeliveryZone || mongoose.model("DeliveryZone", zoneSchema);
const Offer = mongoose.models.Offer || mongoose.model("Offer", offerSchema);

/* ─── Seed Data ───────────────────────────────────────────────────── */
const CATEGORIES = [
  { nameAr: "بيتزا", nameEn: "Pizza", slug: "pizza", image: "/images/categories/pizza.jpg", sortOrder: 1, isActive: true },
  { nameAr: "كريب ودجاج", nameEn: "Crepe", slug: "chicken", image: "/images/categories/crepe.jpg", sortOrder: 2, isActive: true },
  { nameAr: "سندوتشات", nameEn: "Sandwiches", slug: "burger", image: "/images/categories/sandwiches.jpg", sortOrder: 3, isActive: true },
  { nameAr: "مكرونات", nameEn: "Pasta", slug: "pasta", image: "/images/categories/pasta.jpg", sortOrder: 4, isActive: true },
  { nameAr: "مشروبات", nameEn: "Drinks", slug: "drinks", image: "https://images.unsplash.com/photo-1546173159-315724a31696?w=400", sortOrder: 5, isActive: true },
  { nameAr: "حلويات", nameEn: "Desserts", slug: "desserts", image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400", sortOrder: 6, isActive: false },
];

const ZONES = [
  { name: "المرج", days: ["saturday"], isActive: true, note: "توصيل مجاني كل يوم سبت" },
  { name: "المعادي", days: ["sunday", "wednesday"], isActive: true },
  { name: "مدينة نصر", days: ["tuesday"], isActive: true },
];

const OFFERS = [
  { title: "كومبو العائلة الكبير", subtitle: "بيتزا لارج + كريب حلو + بطاطس عائلي + كانز مشروبات مثلجة", image: "/images/hero/hero-pizza.jpg", price: 269, originalPrice: 389, durationMinutes: 180, sortOrder: 1, isActive: true },
  { title: "عرض الساندوتشات والبطاطس والكريب", subtitle: "3 ساندوتشات من اختيارك + باكت بطاطس عائلي + كريب حلو", image: "/images/promo/promo-sandwiches-v2.jpg", price: 199, originalPrice: 280, durationMinutes: 180, sortOrder: 2, isActive: true },
  { title: "كومبو ميكس روزماري العملاق", subtitle: "بيتزا لارج + قطع دجاج مقرمش + بطاطس + كريب + كانز بيبسي مثلج", image: "/images/promo/promo-combo-v2.jpg", price: 249, originalPrice: 340, durationMinutes: 180, sortOrder: 3, isActive: true },
  { title: "كومبو البرجر المقرمش", subtitle: "برجر لحم مشوي + بطاطس مقرمشة + مشروب — وجبة سريعة تشبع", image: "/images/hero/hero-burger.jpg", price: 129, originalPrice: 175, durationMinutes: 180, sortOrder: 4, isActive: true },
];

const SETTINGS = {
  storeName: "روزماري",
  storeDescription: "مطعم روزماري — وجهتك لأشهى الوجبات الطازجة",
  phone: "01005526838",
  email: "info@rozmaly.com",
  address: "حدائق الزيتون الشرقية، أمام محطة المترو، القاهرة",
  logoUrl: "/images/logo.png",
  currency: "EGP",
  deliveryFee: 0,
  minimumOrder: 0,
  estimatedDeliveryTime: "30-45",
  isStoreOpen: true,
  closedMessage: "",
  latitude: 0,
  longitude: 0,
  googleMapsUrl: "https://maps.google.com",
  workingHours: [
    { day: "الأحد",    isOpen: true, openTime: "10:00", closeTime: "00:00" },
    { day: "الاثنين",  isOpen: true, openTime: "10:00", closeTime: "00:00" },
    { day: "الثلاثاء", isOpen: true, openTime: "10:00", closeTime: "00:00" },
    { day: "الأربعاء", isOpen: true, openTime: "10:00", closeTime: "00:00" },
    { day: "الخميس",   isOpen: true, openTime: "10:00", closeTime: "01:00" },
    { day: "الجمعة",   isOpen: true, openTime: "12:00", closeTime: "01:00" },
    { day: "السبت",    isOpen: true, openTime: "10:00", closeTime: "01:00" },
  ],
  socialLinks: {
    facebook: "https://facebook.com/rosemary",
    instagram: "https://instagram.com/rosemary",
    tiktok: "https://tiktok.com/@rosemary",
    whatsapp: "https://wa.me/201005526838",
  },
  galleryImages: [
    { src: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800", alt: "داخل مطعم روزماري" },
    { src: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800", alt: "بيتزا روزماري الطازجة" },
    { src: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800", alt: "برجر روزماري" },
    { src: "https://images.unsplash.com/photo-1621996346565-e3d5d6281745?w=800", alt: "باستا روزماري" },
  ],
};

/* ─── Main ────────────────────────────────────────────────────────── */
try {
  console.log("🔄 جاري الاتصال...");
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log("✅ MongoDB متصل");

  // Categories — upsert بالـ slug
  let catNew = 0, catSkip = 0;
  for (const cat of CATEGORIES) {
    const exists = await Category.findOne({ slug: cat.slug });
    if (exists) { catSkip++; continue; }
    await Category.create(cat);
    catNew++;
  }
  console.log(`📂 التصنيفات: ${catNew} جديد، ${catSkip} موجود`);

  // Store Settings — upsert
  const existingSettings = await StoreSettings.findOne();
  if (!existingSettings) {
    await StoreSettings.create(SETTINGS);
    console.log("⚙️ إعدادات المتجر: تم الإنشاء");
  } else {
    console.log("⚙️ إعدادات المتجر: موجودة، تم التخطي");
  }

  // Delivery Zones — upsert بالاسم
  let zoneNew = 0, zoneSkip = 0;
  for (const z of ZONES) {
    const exists = await DeliveryZone.findOne({ name: z.name });
    if (exists) { zoneSkip++; continue; }
    await DeliveryZone.create(z);
    zoneNew++;
  }
  console.log(`🚚 مناطق التوصيل: ${zoneNew} جديد، ${zoneSkip} موجود`);

  // Offers — upsert بالعنوان
  let offerNew = 0, offerSkip = 0;
  for (const o of OFFERS) {
    const exists = await Offer.findOne({ title: o.title });
    if (exists) { offerSkip++; continue; }
    await Offer.create(o);
    offerNew++;
  }
  console.log(`🔥 العروض: ${offerNew} جديد، ${offerSkip} موجود`);

  await mongoose.disconnect();
  console.log("\n✅ Seed اكتمل بنجاح");
  process.exit(0);
} catch (err) {
  console.error("❌ خطأ:", err?.message ?? err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
}
