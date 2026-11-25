/**
 * قواعد مراجعة الدفع اليدوي (فودافون كاش / إنستاباي).
 * الطلب الإلكتروني النشط يفضل غير مؤكد لحد ما موظف مصرّح يسجّل القرار.
 * ورقة الطلب تُطبع للمراجعة، والتجهيز/التسليم مقفول قبل التأكيد من الـ API.
 */
import type { PaymentReviewDecision } from "@/types/admin";

export function isOnlinePaymentMethod(method: string | null | undefined): boolean {
  return method === "vodafone_cash" || method === "instapay";
}

/** القيم القديمة المحفوظة تُعتبر مؤكدة للتوافق مع الطلبات القديمة */
export function isPaymentVerified(status: string | null | undefined): boolean {
  return status === "verified" || status === "paid";
}

type ReviewOrder = {
  paymentStatus?: string | null;
  paymentVerification?: {
    decision?: string | null;
    reviewedBy?: string | null;
    reviewedByName?: string | null;
    reviewedAt?: Date | string | null;
  } | null;
};

type GateOrder = ReviewOrder & {
  paymentMethod?: string | null;
  status?: string | null;
};

/** القرار الفعلي للدفع: قرار المراجعة الجديد أو القيم القديمة التوافقية */
export function getPaymentDecision(order: ReviewOrder): PaymentReviewDecision {
  const decision = order.paymentVerification?.decision;
  if (decision === "paid" || decision === "unpaid") return decision;
  if (isPaymentVerified(order.paymentStatus)) return "paid";
  if (order.paymentStatus === "unpaid" || order.paymentStatus === "rejected") {
    return "unpaid";
  }
  return "pending";
}

export function isPaymentConfirmed(order: ReviewOrder): boolean {
  return getPaymentDecision(order) === "paid";
}

/**
 * دفعة إلكترونية لم يؤكدها موظف مصرّح بعد.
 * القفل على الطلبات النشطة (pending) عشان الطلبات القديمة المسلّمة
 * تفضل قابلة للطباعة/المراجعة من غير ما نغيّر حالتها.
 */
export function awaitingPaymentReview(order: GateOrder): boolean {
  return (
    isOnlinePaymentMethod(order.paymentMethod) &&
    !isPaymentConfirmed(order) &&
    order.status === "pending"
  );
}
