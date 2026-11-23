/**
 * شروط طابور الطباعة — مشتركة بين GET/claim.
 * الطباعة ورق تشغيل (review slip) وليست تأكيد دفع: كل طلب غير ملغي يدخل
 * الطابور مرة واحدة. بوابة الدفع تبقى منفصلة في مسار التسليم/التجهيز فقط.
 */
export const ONLINE_PAYMENT_METHODS = ["vodafone_cash", "instapay"] as const;

/** حجز أقدم من دقيقتين يُعتبر مهجوراً (الجهاز اتقفل أو النت قطع أثناء الطباعة) */
export const PRINT_CLAIM_STALE_MS = 2 * 60 * 1000;

/** انتظار قبل إعادة المحاولة التلقائية بعد فشل */
export const PRINT_RETRY_DELAY_MS = 20 * 1000;

/** طلبات مستحقة للطباعة التلقائية (أو حجزها انتهت صلاحيته) */
export function duePrintFilter(now = new Date()) {
  const staleBefore = new Date(now.getTime() - PRINT_CLAIM_STALE_MS);
  return {
    // الملغي متوقف نهائياً، والمسلَّم خلص — مفيش داعي لطبع تلقائي جديد
    orderStatus: { $nin: ["cancelled", "delivered"] },
    $or: [
      {
        $and: [
          { printState: { $in: ["pending", "failed"] } },
          {
            $or: [
              { printNextAttemptAt: null },
              { printNextAttemptAt: { $lte: now } },
            ],
          },
        ],
      },
      { printState: "processing", printClaimedAt: { $lte: staleBefore } },
    ],
  };
}

/**
 * فلتر الحجز اليدوي: يسمح بالطباعة من جديد لطلب «تمت طباعته» أو طلب قديم
 * بدون حالة طباعة، ويمنع فقط التداخل مع حجز جارٍ لم تنتهِ صلاحيته.
 */
export function claimableFilter(now = new Date()) {
  const staleBefore = new Date(now.getTime() - PRINT_CLAIM_STALE_MS);
  return {
    orderStatus: { $ne: "cancelled" },
    $or: [
      { printState: { $ne: "processing" } },
      { printClaimedAt: null },
      { printClaimedAt: { $lte: staleBefore } },
    ],
  };
}
