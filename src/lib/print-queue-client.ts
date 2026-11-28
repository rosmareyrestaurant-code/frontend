"use client";

/**
 * دورة الطباعة من المتصفح: حجز ذري → طباعة → تسجيل النتيجة.
 * كل الطباعة (تلقائية أو يدوية) بتمر من هنا، فالطلب الواحد مستحيل
 * يتحجز مرتين في نفس الوقت من جهازين.
 */
import type { AdminOrder } from "@/types/admin";
import { printReceiptInFrame } from "@/lib/receipt";
import {
  PRINT_ABORTED_BEFORE_PRINT_MESSAGE,
  PRINT_UNCONFIRMED_MESSAGE,
} from "@/lib/print-queue";

/** بيتنشر بعد أي تغيير في حالة الطباعة عشان صفحة الطلبات تحدّث نفسها */
export const PRINT_STATE_EVENT = "rosemary:print-state";

export interface PrintRunResult {
  /** printed = وصل afterprint؛ unconfirmed = أُرسل print() بلا إشارة انتهاء */
  status: "printed" | "unconfirmed" | "failed" | "skipped";
  message?: string;
  order?: AdminOrder;
}

type AttemptPhase = "preparing" | "printing" | "printed" | "finalized";
type AttemptStatus = "printed" | "unconfirmed" | "failed";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function postJson(url: string, body: unknown, keepalive = false) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    // نتيجة الطباعة لازم توصل حتى لو الكاشير قفل التاب بعد ما الورق طلع.
    keepalive,
  });
  const data = await res.json().catch(() => null);
  return { res, data };
}

function notifyUi() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PRINT_STATE_EVENT));
  }
}

async function fetchOrderState(orderId: string): Promise<AdminOrder | null> {
  try {
    const res = await fetch(`/api/admin/orders/${orderId}`, { cache: "no-store" });
    const d = await res.json();
    return d?.success ? (d.data as AdminOrder) : null;
  } catch {
    return null;
  }
}

export async function printOrderFromQueue(
  orderId: string,
  manual = false,
): Promise<PrintRunResult> {
  let claim: Awaited<ReturnType<typeof postJson>>;
  try {
    claim = await postJson("/api/admin/print-queue/claim", { orderId, manual });
  } catch {
    return { status: "skipped", message: "تعذّر الاتصال بالخادم" };
  }

  if (!claim.res.ok || !claim.data?.success) {
    return {
      status: "skipped",
      message:
        claim.data?.error?.message ?? "تعذّر حجز الطلب للطباعة",
    };
  }

  const order = claim.data.data?.order as AdminOrder | undefined;
  const claimId = claim.data.data?.claimId as string | undefined;
  if (!order || !claimId) {
    return { status: "skipped", message: "استجابة الحجز غير صالحة" };
  }

  notifyUi();

  /*
   * مصدر واحد لحالة هذه المحاولة. كل إشارات المتصفح (pagehide/afterprint/
   * نتيجة printReceiptInFrame) تمرّ على هنا، ثم تُرسل نتيجة واحدة للحجز.
   */
  const abortController = new AbortController();
  let phase: AttemptPhase = "preparing";
  let resultPromise: Promise<PrintRunResult> | null = null;

  const finalize = (
    status: AttemptStatus,
    error?: string,
    options: { isPageHide?: boolean } = {},
  ): Promise<PrintRunResult> => {
    if (resultPromise) return resultPromise;
    phase = "finalized";

    const payload = {
      orderId,
      claimId,
      status,
      ...(status === "printed" ? {} : { error: error || PRINT_UNCONFIRMED_MESSAGE }),
    };

    resultPromise = (async () => {
      let lastData: {
        success?: boolean;
        data?: AdminOrder;
        error?: { message?: string };
      } | null = null;
      // إغلاق التبويب يرسل keepalive واحداً؛ إعادة المحاولة تخص التاب المفتوح.
      const maxAttempts = options.isPageHide ? 1 : 3;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          const { res, data } = await postJson(
            "/api/admin/print-queue/result",
            payload,
            true,
          );
          lastData = data;
          if (res.ok && data?.success) {
            notifyUi();
            return {
              status,
              message: error,
              order: data.data as AdminOrder,
            };
          }
          // رفض منطقي (الحجز ضاع) — إعادة الإرسال مش هتغيّر حاجة
          if (res.status >= 400 && res.status < 500) break;
        } catch {
          /* نعيد المحاولة */
        }
        if (attempt < maxAttempts - 1) await sleep(1200);
      }

      notifyUi();
      if (options.isPageHide) {
        return { status, message: error };
      }

      // نشوف الحالة الفعلية على السيرفر قبل ما نبلّغ المستخدم بنتيجة غلط
      const actual = await fetchOrderState(orderId);
      if (actual && actual.printState === status) {
        return { status, message: error, order: actual };
      }

      return {
        status,
        message:
          error ||
          lastData?.error?.message ||
          (status === "printed"
            ? "تم تسجيل نتيجة الطباعة"
            : status === "unconfirmed"
              ? PRINT_UNCONFIRMED_MESSAGE
              : "فشلت الطباعة — جرّب تاني"),
      };
    })();

    return resultPromise;
  };

  /*
   * before print(): إغلاق التبويب فشل تجهيز وقابل لإعادة المحاولة المحدودة.
   * after print(): إغلاق التبويب unconfirmed ولا يعود للطابور.
   * after afterprint(): النتيجة printed محفوظة ولا يمكن استبدالها.
   */
  const onPageHide = () => {
    if (phase === "finalized") return;
    if (phase === "printed") {
      void finalize("printed");
      return;
    }
    if (phase === "printing") {
      abortController.abort();
      void finalize(
        "unconfirmed",
        PRINT_UNCONFIRMED_MESSAGE,
        { isPageHide: true },
      );
      return;
    }
    abortController.abort();
    void finalize(
      "failed",
      PRINT_ABORTED_BEFORE_PRINT_MESSAGE,
      { isPageHide: true },
    );
  };
  window.addEventListener("pagehide", onPageHide);

  try {
    const outcome = await printReceiptInFrame(order, {
      signal: abortController.signal,
      onPrintStarted: () => {
        // لا ترفع الإشارة إلا بعد عودة print() فعلياً.
        if (phase === "preparing") phase = "printing";
      },
      onAfterPrint: () => {
        if (phase !== "printing") return;
        phase = "printed";
        // يبدأ الإرسال فوراً؛ أي pagehide لاحق يجد الحجز مُنهىً بالفعل.
        void finalize("printed");
      },
    });

    return await finalize(
      outcome.status,
      "error" in outcome ? outcome.error : undefined,
    );
  } finally {
    window.removeEventListener("pagehide", onPageHide);
    abortController.abort();
  }
}
