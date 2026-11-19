import mongoose, { Schema, model } from "mongoose";

const bannerSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    image: { type: String, required: true },
    imagePublicId: { type: String, default: "" },
    position: {
      type: String,
      enum: ["hero", "middle", "delivery"],
      default: "hero",
      index: true,
    },
    ctaText: { type: String, default: "" },
    ctaLink: { type: String, default: "" },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" },
    sortOrder: { type: Number, default: 1, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export const BannerModel = mongoose.models.Banner || model("Banner", bannerSchema);
