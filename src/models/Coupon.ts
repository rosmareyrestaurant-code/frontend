import mongoose, { Schema, model } from "mongoose";

/**
 * كوبونات الخصم — ينشئها المدير من الداشبورد ويُتحقق منها وقت إنشاء الطلب.
 * نسبة الخصم تُخزّن هنا فقط، ولا يُوثق بها كود قادم من المتصفح.
 */
const couponSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    discountPercent: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    description: { type: String, default: "" },
    isActive: { type: Boolean, default: true, index: true },
    /** مدة اختيارية بالأيام — يُشتق منها expiresAt وقت الحفظ */
    durationDays: { type: Number, min: 1, max: 3650, default: undefined },
    expiresAt: { type: Date, default: undefined, index: true },
  },
  { timestamps: true },
);

export const CouponModel = mongoose.models.Coupon || model("Coupon", couponSchema);
