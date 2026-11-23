/**
 * طبقة بيانات المتجر — تُقرأ على السيرفر مرة واحدة وتُخزَّن في كاش Next
 * بدل ما كل زائر ينزّل 128 منتج من الـ API بعد تحميل الـ JS.
 */
import { cacheLife, cacheTag } from "next/cache";
import { connectToDatabase } from "@/lib/mongodb";
import { ProductModel } from "@/models/Product";
import { CategoryModel } from "@/models/Category";
import { BannerModel } from "@/models/Banner";
import { OfferModel } from "@/models/Offer";
import { StoreSettingsModel } from "@/models/StoreSettings";
import { resolveTheme, themeCss, type ThemeColors } from "@/lib/theme";
import { toPublicBanner, toPublicCategory, toPublicOffer, toPublicProduct } from "@/lib/serialize";
import { STOREFRONT_TAG } from "@/lib/storefront-tags";
import type { Category, Product } from "@/types";

type ProductLean = Parameters<typeof toPublicProduct>[0];
type CategoryLean = Parameters<typeof toPublicCategory>[0];
type BannerLean = Parameters<typeof toPublicBanner>[0];
type OfferLean = Parameters<typeof toPublicOffer>[0];

const PUBLIC_PRODUCT_FILTER = { isAvailable: true, isVisible: true };

export async function getMenuProducts(): Promise<Product[]> {
  "use cache";
  cacheLife("storefront");
  cacheTag(STOREFRONT_TAG);

  await connectToDatabase();
  const products = await ProductModel.find(PUBLIC_PRODUCT_FILTER)
    .sort({ menuOrder: 1, createdAt: -1 })
    .limit(500)
    .lean();

  return products.map((p) => toPublicProduct(p as unknown as ProductLean));
}

export async function getActiveCategories(): Promise<Category[]> {
  "use cache";
  cacheLife("storefront");
  cacheTag(STOREFRONT_TAG);

  await connectToDatabase();
  const categories = await CategoryModel.find({ isActive: true })
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();

  return categories.map((c) => toPublicCategory(c as unknown as CategoryLean));
}

/**
 * متغيرات الهوية تُحقن من السيرفر في root layout قبل أي محتوى،
 * فمفيش Flash بالتصميم القديم ومفيش اختلاف Hydration.
 */
export async function getThemeCss(): Promise<string> {
  "use cache";
  cacheLife("storefront");
  cacheTag(STOREFRONT_TAG);

  await connectToDatabase();
  const settings = await StoreSettingsModel.findOne().select("theme").lean();
  const theme = (settings as { theme?: Partial<ThemeColors> } | null)?.theme;
  return themeCss(resolveTheme(theme));
}

export interface PublicTickerSettings {
  message: string;
  icon: string;
  enabled: boolean;
  iconPosition: "start" | "end";
}

/** إعدادات شريط الإعلانات تُقرأ على السيرفر — مفيش وميض أو مساحة فاضية عند التعطيل */
export async function getPublicTicker(): Promise<PublicTickerSettings> {
  "use cache";
  cacheLife("storefront");
  cacheTag(STOREFRONT_TAG);

  await connectToDatabase();
  const settings = (await StoreSettingsModel.findOne()
    .select("tickerMessage tickerIcon tickerEnabled tickerIconPosition")
    .lean()) as
    | {
        tickerMessage?: string;
        tickerIcon?: string;
        tickerEnabled?: boolean;
        tickerIconPosition?: string;
      }
    | null;

  return {
    message: typeof settings?.tickerMessage === "string" ? settings.tickerMessage : "",
    icon: settings?.tickerIcon || "truck",
    enabled: settings?.tickerEnabled !== false,
    iconPosition: settings?.tickerIconPosition === "end" ? "end" : "start",
  };
}

export async function getHomeData() {
  "use cache";
  cacheLife("storefront");
  cacheTag(STOREFRONT_TAG);

  await connectToDatabase();
  const [productDocs, categoryDocs, bannerDocs] = await Promise.all([
    ProductModel.find(PUBLIC_PRODUCT_FILTER)
      .sort({ menuOrder: 1, createdAt: -1 })
      .limit(500)
      .lean(),
    CategoryModel.find({ isActive: true }).sort({ sortOrder: 1, createdAt: 1 }).lean(),
    BannerModel.find({ isActive: true, position: "hero" }).sort({ sortOrder: 1 }).lean(),
  ]);

  const today = new Date().toISOString().split("T")[0];
  const heroBanners = bannerDocs
    .filter((b) => {
      if (b.startDate && b.startDate > today) return false;
      if (b.endDate && b.endDate < today) return false;
      return true;
    })
    .map((b) => toPublicBanner(b as unknown as BannerLean));

  return {
    products: productDocs.map((p) => toPublicProduct(p as unknown as ProductLean)),
    categories: categoryDocs.map((c) => toPublicCategory(c as unknown as CategoryLean)),
    heroBanners,
  };
}

export async function getOffersPageData() {
  "use cache";
  cacheLife("storefront");
  cacheTag(STOREFRONT_TAG);

  await connectToDatabase();
  const [offerDocs, productDocs] = await Promise.all([
    OfferModel.find({ isActive: true }).sort({ sortOrder: 1 }).lean(),
    ProductModel.find(PUBLIC_PRODUCT_FILTER).sort({ menuOrder: 1, createdAt: -1 }).limit(500).lean(),
  ]);

  const discounted = productDocs
    .map((p) => toPublicProduct(p as unknown as ProductLean))
    .filter((p) => p.originalPrice && p.originalPrice > p.price);

  return {
    offers: offerDocs.map((o) => toPublicOffer(o as unknown as OfferLean)),
    discounted,
  };
}
