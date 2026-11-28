import mongoose, { Schema, model } from "mongoose";

const categorySchema = new Schema(
  {
    nameAr: { type: String, required: true, trim: true },
    nameEn: { type: String, default: "", trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    image: { type: String, default: "" },
    imagePublicId: { type: String, default: "" },
    description: { type: String, default: "" },
    sortOrder: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
    /** إظهار كرت التصنيف نفسه في قسم «التصنيفات» بالصفحة الرئيسية */
    showOnHomeCard: { type: Boolean, default: true, index: true },
    /** إظهار قسم منتجات التصنيف في الصفحة الرئيسية (مستقل عن الكرت) */
    showOnHome: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export const CategoryModel =
  mongoose.models.Category || model("Category", categorySchema);
