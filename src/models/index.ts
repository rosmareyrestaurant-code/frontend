/**
 * نقطة تصدير موحدة لنماذج Mongoose.
 */
export { AdminModel as Admin } from "./Admin";
export { CategoryModel as Category } from "./Category";
export { ProductModel as Product } from "./Product";
export { OrderModel as Order } from "./Order";
export { BannerModel as Banner } from "./Banner";
export { OfferModel as Offer } from "./Offer";
export { StoreSettingsModel as StoreSettings } from "./StoreSettings";
export { DeliveryZoneModel as DeliveryZone } from "./DeliveryZone";
export { CouponModel as Coupon } from "./Coupon";

// أيضًا تصدير بنفس اسم auth.ts المستخدم
export { AdminModel as AdminModel } from "./Admin";
