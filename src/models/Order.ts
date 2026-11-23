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
      enum: ["pending", "verified", "paid", "rejected"],
      default: "pending",
      index: true,
    },
    // مراجعة الدفع اليدوية (فودافون كاش / إنستاباي)
    transactionReference: { type: String, default: "" },
    verifiedAmount: { type: Number },
    paymentVerifiedAt: { type: Date },
    paymentVerifiedBy: { type: String, default: "" },
    paymentVerifiedByName: { type: String, default: "" },
    paymentRejectionReason: { type: String, default: "" },
    paymentRejectedAt: { type: Date },
    paymentRejectedBy: { type: String, default: "" },
    orderStatus: {
      type: String,
      enum: ORDER_STATUSES,
      default: "pending",
      index: true,
    },
    notes: { type: String, default: "" },
    cashierNote: { type: String, default: "" },
    // ─── طابور الطباعة (لا علاقة له بحالة الدفع) ───
    printState: {
      type: String,
      enum: ["pending", "processing", "printed", "failed"],
      default: "pending",
    },
    printClaimId: { type: String, default: "" },
    printClaimedAt: { type: Date, default: null },
    printClaimedBy: { type: String, default: "" },
    printAttempts: { type: Number, default: 0 },
    printLastAttemptAt: { type: Date, default: null },
    printLastError: { type: String, default: "" },
    printNextAttemptAt: { type: Date, default: null },
    printedAt: { type: Date, default: null },
    printedBy: { type: String, default: "" },
  },
  { timestamps: true },
);

orderSchema.index({ createdAt: -1 });
// استعلام الطابور: الحالات المستحقة الأقدم أولاً
orderSchema.index({ printState: 1, printNextAttemptAt: 1, createdAt: 1 });
orderSchema.index(
  { clientOrderId: 1 },
  { unique: true, partialFilterExpression: { clientOrderId: { $exists: true } } },
);
// رقم مرجع التحويل فريد على مستوى الطلبات — الفاضي مستثنى من الفهرس
orderSchema.index(
  { transactionReference: 1 },
  {
    unique: true,
    partialFilterExpression: { transactionReference: { $gt: "" } },
  },
);

export const OrderModel = mongoose.models.Order || model("Order", orderSchema);
