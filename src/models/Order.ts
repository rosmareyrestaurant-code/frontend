import mongoose, { Schema, model } from "mongoose";
import { ORDER_STATUSES } from "@/lib/constants";

const orderItemSchema = new Schema(
  {
    productId: String,
    productName: String,
    productImage: String,
    selectedSize: { id: String, name: String, price: Number },
    selectedAddons: [{ id: String, name: String, price: Number }],
    unitPrice: Number,
    quantity: Number,
    itemTotal: Number,
    notes: String,
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    accessToken: { type: String, required: true, index: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true, index: true },
    customerAddress: { type: String, required: true },
    area: { type: String, default: "" },
    items: [orderItemSchema],
    subtotal: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    paymentMethod: {
      type: String,
      enum: ["cash", "vodafone_cash", "instapay"],
      default: "cash",
    },
    paymentProofUrl: { type: String, default: "" },
    paymentProofPublicId: { type: String, default: "" },
    // معرّف يولّده المتصفح لكل محاولة طلب — يمنع تكرار الطلب لو اتعاد إرساله
    clientOrderId: { type: String },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
    orderStatus: {
      type: String,
      enum: ORDER_STATUSES,
      default: "pending",
      index: true,
    },
    notes: { type: String, default: "" },
  },
  { timestamps: true },
);

orderSchema.index({ createdAt: -1 });
orderSchema.index(
  { clientOrderId: 1 },
  { unique: true, partialFilterExpression: { clientOrderId: { $exists: true } } },
);

export const OrderModel = mongoose.models.Order || model("Order", orderSchema);
