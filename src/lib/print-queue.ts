/**
 * شروط طابور الطباعة — مشتركة بين GET/claim.
 * الطباعة ورق تشغيل (review slip) وليست تأكيد دفع: كل طلب غير ملغي يدخل
 * الطابور مرة واحدة. بوابة الدفع تبقى منفصلة في مسار التسليم/التجهيز فقط.
 */
export const ONLINE_PAYMENT_METHODS = ["vodafone_cash", "instapay"] as const;

/** حجز أقدم من دقيقتين يُعتبر مهجوراً (الجهاز اتقفل أو النت قطع أثناء الطباعة) */
export const PRINT_CLAIM_STALE_MS = 2 * 60 * 1000;

/**
 * الفشل الحقيقي (قبل إرسال أمر الطباعة) له مهلة إعادة محاولة محدودة.
 * الآلية موجودة أصلاً في printNextAttemptAt / printAttempts — بنستخدمها
 * كما هي، ومن غير حجز بعيد أو حلقات إعادة طباعة غير منتهية.
 */
export const PRINT_RETRY_DELAY_MS = 30 * 1000;
/** حد أقصى لمحاولات الطابور التلقائي؛ إعادة الطباعة اليدوية تظل متاحة */
export const PRINT_MAX_AUTO_ATTEMPTS = 3;

/**
 * أُرسل أمر print() ولم تصل إشارة انتهاء واجهة الطباعة. الواجهة لا تستطيع
 * إثبات خروج الورق، لذلك لا تعود الحالة للطابور تلقائياً ولا تُعتبر فشلاً.
 * بنستخدم نفس حقل printLastError الموجود لحفظ سبب عدم التأكد للعرض فقط.
 */
export const PRINT_UNCONFIRMED_PREFIX = "UNCONFIRMED_PRINT:";
export const PRINT_UNCONFIRMED_MESSAGE =
  `${PRINT_UNCONFIRMED_PREFIX} أُرسل أمر طباعة واحد للمتصفح؛ ` +
  "لم تصل إشارة انتهاء واجهة الطباعة، ولا يمكن للمتصفح إثبات خروج الورقة. " +
  "لا توجد إعادة طباعة تلقائية.";

/** أُغلق التبويب قبل استدعاء print(): فشل تجهيز، لا إرسال طباعة ولا ورق. */
export const PRINT_ABORTED_BEFORE_PRINT_MESSAGE =
  "أُغلق التبويب قبل إرسال أمر الطباعة — لم تُرسل أي طباعة";

/** طلبات مستحقة للطباعة التلقائية (أو حجزها انتهت صلاحيته) */
export function duePrintFilter(now = new Date()) {
  const staleBefore = new Date(now.getTime() - PRINT_CLAIM_STALE_MS);
  return {
    // الملغي متوقف نهائياً، والمسلَّم خلص — مفيش داعي لطبع تلقائي جديد
    orderStatus: { $nin: ["cancelled", "delivered"] },
    // طلب اكتمل طباعته يظل خارج الطابور حتى لو أُعيد طباعته يدوياً وفشل.
    printedAt: null,
    $or: [
      {
        $and: [
          // unconfirmed وprinted خارج الطابور نهائياً؛ failed فقط هو اللي يعاد.
          { printState: { $in: ["pending", "failed"] } },
          {
            $or: [
              { printAttempts: { $exists: false } },
              { printAttempts: { $lt: PRINT_MAX_AUTO_ATTEMPTS } },
            ],
          },
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
