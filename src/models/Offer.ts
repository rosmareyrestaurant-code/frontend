import mongoose, { Schema, model } from "mongoose";

const offerSchema = new Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String, required: true },
    image: { type: String, required: true },
    imagePublicId: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, default: 0, min: 0 },
    durationMinutes: { type: Number, default: 180, min: 1 },
    sortOrder: { type: Number, default: 1, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);

export const OfferModel = mongoose.models.Offer || model("Offer", offerSchema);
