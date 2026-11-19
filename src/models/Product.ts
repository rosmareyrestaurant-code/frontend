import mongoose, { Schema, model } from "mongoose";

const productSizeSchema = new Schema(
  {
    id: String,
    name: String,
    detail: String,
    price: Number,
    originalPrice: Number,
    isDefault: Boolean,
  },
  { _id: false },
);

const productAddonSchema = new Schema(
  {
    id: String,
    name: String,
    price: Number,
    isDefault: Boolean,
  },
  { _id: false },
);

const productSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    nameEn: { type: String, default: "", trim: true },
    slug: { type: String, lowercase: true, trim: true, index: true, sparse: true },
    description: { type: String, default: "" },
    descriptionEn: { type: String, default: "" },
    image: { type: String, default: "" },
    imagePublicId: { type: String, default: "" },
    category: { type: String, required: true, index: true }, // slug التصنيف
    categoryNameAr: { type: String, default: "" },
    categoryNameEn: { type: String, default: "" },
    price: { type: Number, default: 0, min: 0 }, // السعر الحالي (= basePrice)
    originalPrice: { type: Number, min: 0 }, // السعر المشطوب الأعلى (= discountPrice)
    sizes: [productSizeSchema],
    addons: [productAddonSchema],
    notes: { type: String, default: "" },
    menuOrder: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true, index: true },
    isVisible: { type: Boolean, default: true, index: true }, // = isActive في التعليمات
    isFeatured: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

// بحث نصّي + ترتيب افتراضي
productSchema.index({ name: "text", description: "text" });
productSchema.index({ menuOrder: 1, createdAt: -1 });

export const ProductModel =
  mongoose.models.Product || model("Product", productSchema);
