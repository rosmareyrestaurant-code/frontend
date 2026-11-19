import mongoose, { Schema, model } from "mongoose";

const deliveryZoneSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    days: { type: [String], default: [] },
    isActive: { type: Boolean, default: true, index: true },
    note: { type: String, default: "" },
  },
  { timestamps: true },
);

export const DeliveryZoneModel =
  mongoose.models.DeliveryZone || model("DeliveryZone", deliveryZoneSchema);
