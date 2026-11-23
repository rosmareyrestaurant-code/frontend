import mongoose, { Schema, model } from "mongoose";
import { DEFAULT_THEME } from "@/lib/theme";

const workingHourSchema = new Schema(
  { day: String, isOpen: Boolean, openTime: String, closeTime: String },
  { _id: false },
);

const socialLinksSchema = new Schema(
  {
    facebook: String,
    instagram: String,
    tiktok: String,
    whatsapp: String,
  },
  { _id: false },
);

const galleryImageSchema = new Schema(
  { src: String, alt: String },
  { _id: false },
);

/**
 * ألوان الهوية: الأساسية إلزامية، والإعدادات المتقدمة اختيارية (فاضية = تُشتق تلقائياً).
 * كل القيم HEX فقط — أي قيمة تانية بترفضها الـ validation.
 */
const themeSchema = new Schema(
  {
    // HEX فقط (مش أسماء متغيرات CSS) — عشان الداشبورد يقدر يقرأها ويعرضها
    primary: { type: String, default: DEFAULT_THEME.primary },
    icon: { type: String, default: DEFAULT_THEME.icon },
    background: { type: String, default: DEFAULT_THEME.background },
    primaryHover: { type: String, default: "" },
    primaryActive: { type: String, default: "" },
    iconHover: { type: String, default: "" },
    textPrimary: { type: String, default: "" },
    surface: { type: String, default: "" },
    surfaceSecondary: { type: String, default: "" },
    surfaceElevated: { type: String, default: "" },
    border: { type: String, default: "" },
  },
  { _id: false },
);

const storeSettingsSchema = new Schema(
  {
    storeName: { type: String, default: "Rosemary" },
    storeDescription: { type: String, default: "" },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    address: { type: String, default: "" },
    logoUrl: { type: String, default: "/images/logo-rosemary-green.png" },
    logoPublicId: { type: String, default: "" },
    tickerMessage: { type: String, default: "" },
    tickerIcon: { type: String, default: "truck" },
    tickerEnabled: { type: Boolean, default: true },
    tickerIconPosition: { type: String, enum: ["start", "end"], default: "start" },
    theme: { type: themeSchema, default: () => ({}) },
    currency: { type: String, default: "EGP" },
    deliveryFee: { type: Number, default: 0, min: 0 },
    minimumOrder: { type: Number, default: 0, min: 0 },
    estimatedDeliveryTime: { type: String, default: "30-45" },
    isStoreOpen: { type: Boolean, default: true },
    closedMessage: { type: String, default: "" },
    vodafoneCashNumber: { type: String, default: "" },
    instapayAccount: { type: String, default: "" },
    latitude: { type: Number, default: 0 },
    longitude: { type: Number, default: 0 },
    googleMapsUrl: { type: String, default: "" },
    workingHours: [workingHourSchema],
    socialLinks: socialLinksSchema,
    galleryImages: [galleryImageSchema],
  },
  { timestamps: true },
);

export const StoreSettingsModel =
  mongoose.models.StoreSettings || model("StoreSettings", storeSettingsSchema);
