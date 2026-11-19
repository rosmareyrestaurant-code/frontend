/**
 * seed-menu.mjs — يسطّب منيو Rosemary_Menu.xlsx في الداتابيز.
 * - 5 تصنيفات أساسية فقط: بيتزا، كريب، سندوتشات، مكرونة، مشروبات.
 * - باقي التصنيفات بتتعطّل (isActive=false) بدون حذف.
 * - المنتجات بتتوزّع على الخمس تصنيفات وبتتحدّث بالـ slug (آمن للتشغيل أكثر من مرة).
 * - صور المنتجات مؤقتة (صور التصنيفات) لحد ما تترفع الصور الحقيقية.
 * التشغيل: node scripts/seed-menu.mjs
 */
import mongoose from "mongoose";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import dns from "node:dns";

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

const menu = JSON.parse(readFileSync(join(__dirname, "..", "vibe_images", "menu-full.json"), "utf8"));
if (!Array.isArray(menu) || menu.length === 0) { console.error("❌ menu-full.json فاضي"); process.exit(1); }

/* ─── Schemas ─────────────────────────────────────────────────────── */
const prodSizeSchema = new mongoose.Schema({ id: String, name: String, detail: String, price: Number, originalPrice: Number, isDefault: Boolean }, { _id: false });
const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  nameEn: { type: String, default: "", trim: true },
  slug: { type: String, lowercase: true, trim: true, index: true, sparse: true },
  description: { type: String, default: "" },
  descriptionEn: { type: String, default: "" },
  image: { type: String, default: "" },
  imagePublicId: { type: String, default: "" },
  category: { type: String, required: true, index: true },
  categoryNameAr: { type: String, default: "" },
  categoryNameEn: { type: String, default: "" },
  price: { type: Number, default: 0, min: 0 },
  originalPrice: { type: Number, min: 0 },
  sizes: [prodSizeSchema],
  addons: [new mongoose.Schema({ id: String, name: String, price: Number, isDefault: Boolean }, { _id: false })],
  notes: { type: String, default: "" },
  menuOrder: { type: Number, default: 0 },
  isAvailable: { type: Boolean, default: true, index: true },
  isVisible: { type: Boolean, default: true, index: true },
  isFeatured: { type: Boolean, default: false, index: true },
}, { timestamps: true });
const categorySchema = new mongoose.Schema({ nameAr: String, nameEn: String, slug: { type: String, unique: true }, image: String, imagePublicId: String, description: String, sortOrder: Number, isActive: Boolean }, { timestamps: true });
const bannerSchema = new mongoose.Schema({ title: String, description: String, image: String, imagePublicId: String, position: String, ctaText: String, ctaLink: String, startDate: String, endDate: String, sortOrder: Number, isActive: Boolean }, { timestamps: true });

const Product = mongoose.models.Product || mongoose.model("Product", productSchema);
const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);
const Banner = mongoose.models.Banner || mongoose.model("Banner", bannerSchema);

/* ─── التصنيفات الأساسية الخمسة ──────────────────────────────────── */
const MAIN_CATEGORIES = [
  { slug: "pizza",   nameAr: "بيتزا",      nameEn: "Pizza",      image: "/images/categories/cat-pizza-special.jpg", sortOrder: 1 },
  { slug: "chicken", nameAr: "كريب",       nameEn: "Crepe",      image: "/images/categories/cat-crepe.jpg",         sortOrder: 2 },
  { slug: "burger",  nameAr: "سندوتشات",   nameEn: "Sandwiches", image: "/images/categories/cat-sandwiches.jpg",    sortOrder: 3 },
  { slug: "pasta",   nameAr: "مكرونة",     nameEn: "Pasta",      image: "/images/categories/cat-pasta.jpg",         sortOrder: 4 },
  { slug: "drinks",  nameAr: "مشروبات",    nameEn: "Drinks",     image: "/images/categories/cat-drinks.jpg",        sortOrder: 5 },
];

/* تصنيف الإكسيل → التصنيف الأساسي + صورة مؤقتة للمنتج */
const SHEET_MAP = {
  "بيتزا سبيشال روزماري":       { slug: "pizza",   image: "/images/categories/cat-pizza-special.jpg" },
  "بيتزا روزماري":              { slug: "pizza",   image: "/images/categories/cat-pizza-rosemary.jpg" },
  "بيتزا ميكس روزماري":         { slug: "pizza",   image: "/images/categories/cat-pizza-mix.jpg" },
  "إضافات روزماري - أصناف":     { slug: "pizza",   image: "/images/categories/cat-extras.jpg" },
  "كريب روزماري":               { slug: "chicken", image: "/images/categories/cat-crepe.jpg" },
  "كريب فراخ":                  { slug: "chicken", image: "/images/categories/cat-chicken-crepe.jpg" },
  "ميكس كريب روزماري":          { slug: "chicken", image: "/images/categories/cat-mix-crepe.jpg" },
  "حلو روزماري":                { slug: "chicken", image: "/images/categories/cat-desserts.jpg" },
  "سندوتشات روزماري":           { slug: "burger",  image: "/images/categories/cat-sandwiches.jpg" },
  "سندوتشات برجر":              { slug: "burger",  image: "/images/categories/cat-burgers.jpg" },
  "ميكس سندوتشات":              { slug: "burger",  image: "/images/categories/cat-mix-sandwiches.jpg" },
  "إضافات روزماري - جانبية":    { slug: "burger",  image: "/images/categories/cat-sides.jpg" },
  "باستا روزماري":              { slug: "pasta",   image: "/images/categories/cat-pasta.jpg" },
  "مشروبات":                    { slug: "drinks",  image: "/images/categories/cat-drinks.jpg" },
};

const SIZE_NAMES = ["كبيرة", "وسط", "صغيرة"];
const slugify = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function buildSizes(p) {
  const prices = [p.p1, p.p2, p.p3];
  const sizes = [];
  prices.forEach((price, i) => {
    if (price > 0) sizes.push({ id: `size-${i + 1}`, name: SIZE_NAMES[i], price, isDefault: false });
  });
  if (sizes.length > 1) {
    const preferred = sizes.find((s) => s.name === "وسط") ?? sizes[0];
    preferred.isDefault = true;
  }
  return sizes;
}

/* ─── Main ────────────────────────────────────────────────────────── */
try {
  console.log("🔄 جاري الاتصال...");
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000 });
  console.log(`✅ متصل: ${mongoose.connection.name}`);

  // 1) التصنيفات الخمسة
  const mainBySlug = new Map(MAIN_CATEGORIES.map((c) => [c.slug, c]));
  for (const c of MAIN_CATEGORIES) {
    await Category.findOneAndUpdate(
      { slug: c.slug },
      { $set: { nameAr: c.nameAr, nameEn: c.nameEn, image: c.image, sortOrder: c.sortOrder, isActive: true } },
      { upsert: true, new: true },
    );
  }
  const deactivated = await Category.updateMany(
    { slug: { $nin: MAIN_CATEGORIES.map((c) => c.slug) } },
    { $set: { isActive: false } },
  );
  console.log(`📂 التصنيفات: 5 أساسية مفعّلة، ${deactivated.modifiedCount} تصنيف إضافي معطّل (بدون حذف)`);

  // 2) المنتجات
  let added = 0, updated = 0;
  for (const p of menu) {
    const map = SHEET_MAP[p.catAr];
    if (!map) { console.warn(`⚠️ تصنيف غير معروف: ${p.catAr} — تم تخطي ${p.nameAr}`); continue; }
    const main = mainBySlug.get(map.slug);
    const sizes = buildSizes(p);
    const defaultPrice = sizes.find((s) => s.isDefault)?.price ?? sizes[0]?.price ?? p.p1 ?? 0;
    const fields = {
      name: p.nameAr,
      nameEn: p.nameEn || "",
      slug: `${slugify(p.nameEn) || "item"}-${p.n}`,
      description: p.descAr || "",
      descriptionEn: p.descEn || "",
      category: main.slug,
      categoryNameAr: main.nameAr,
      categoryNameEn: main.nameEn,
      price: defaultPrice,
      sizes: sizes.length ? sizes : undefined,
      notes: p.notes || "",
      menuOrder: p.n,
      isAvailable: true,
      isVisible: true,
    };
    const existing = await Product.findOne({ slug: fields.slug });
    if (existing) {
      await Product.updateOne(
        { _id: existing._id },
        { $set: { ...fields, ...(existing.image ? {} : { image: map.image }) } },
      );
      updated++;
    } else {
      await Product.create({ ...fields, image: map.image, isFeatured: false });
      added++;
    }
  }
  console.log(`🍽️ المنتجات: ${added} جديد، ${updated} تحديث`);

  // 3) اختيار مبدئي للمنتجات المميزة (تظهر في «الأكثر طلباً») لو مفيش ولا منتج مميز
  const featuredCount = await Product.countDocuments({ isFeatured: true });
  if (featuredCount === 0) {
    await Product.updateMany(
      { menuOrder: { $in: [1, 2, 3, 6, 14, 15, 30, 46, 56, 103] } },
      { $set: { isFeatured: true } },
    );
    console.log("⭐ المنتجات المميزة: 10 منتجات مبدئية");
  }

  // 4) بانرات الهيرو (لو مفيش ولا بانر) عشان السلايدر يبقى من الداتابيز
  const bannerCount = await Banner.countDocuments();
  if (bannerCount === 0) {
    const HERO = [
      { title: "بيتزا روزماري بطعم مختلف", image: "/images/hero/hero-pizza-green.jpg", ctaLink: "#pizza" },
      { title: "كريب دجاج بطعم لا يُقاوم", image: "/images/hero/hero-crepe-green.jpg", ctaLink: "#crepe" },
      { title: "سندوتشات بمذاق لا يُقاوم", image: "/images/hero/hero-sandwiches-green.jpg", ctaLink: "#sandwiches" },
      { title: "مكرونات متنوعة بأشهى النكهات", image: "/images/hero/hero-pasta-green.jpg", ctaLink: "#pasta" },
      { title: "برجر ميد نايت كلاسيك", image: "/images/hero/hero-burger-green.jpg", ctaLink: "#sandwiches" },
    ];
    await Banner.insertMany(
      HERO.map((b, i) => ({ ...b, position: "hero", sortOrder: i + 1, isActive: true })),
    );
    console.log("🖼️ بانرات الهيرو: 5 بانر جديد");
  } else {
    console.log(`🖼️ بانرات الهيرو: ${bannerCount} موجود، تم التخطي`);
  }

  const totalProducts = await Product.countDocuments({ isVisible: true });
  console.log(`\n✅ Seed اكتمل — ${totalProducts} منتج ظاهر في المنيو`);
  await mongoose.disconnect();
  process.exit(0);
} catch (err) {
  console.error("❌ خطأ:", err?.message ?? err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
}
