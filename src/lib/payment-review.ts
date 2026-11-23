/**
 * قواعد مراجعة الدفع اليدوي (فودافون كاش / إنستاباي).
 * الطلب الإلكتروني النشط يفضل «غير مدفوع» لحد ما المدير يأكد استلام المبلغ.
 * ورقة الطلب (الإيصال) تُطبع للمراجعة، لكن التجهيز/التسليم مقفول قبل التأكيد —
 * حتى من الـ API مباشرة.
 */
import type { AdminOrder } from "@/types/admin";

export function isOnlinePaymentMethod(method: string | null | undefined): boolean {
  return method === "vodafone_cash" || method === "instapay";
}

/** "paid" قيمة قديمة محفوظة — نعتبرها مؤكدة للتوافق مع الطلبات القديمة */
export function isPaymentVerified(status: string | null | undefined): boolean {
  return status === "verified" || status === "paid";
}

type PaymentGateOrder = Pick<AdminOrder, "paymentMethod" | "paymentStatus" | "status">;

/**
 * دفعة إلكترونية لم يدققها المدير بعد.
 * بنقصر القفل على الطلبات النشطة (pending) عشان الطلبات القديمة المسلّمة
 * تفضل قابلة للطباعة/المراجعة من غير ما نغيّر حالتها.
 */
export function awaitingPaymentReview(order: PaymentGateOrder): boolean {
  return (
    isOnlinePaymentMethod(order.paymentMethod) &&
    !isPaymentVerified(order.paymentStatus) &&
    order.status === "pending"
  );
}
