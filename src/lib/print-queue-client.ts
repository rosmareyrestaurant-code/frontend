"use client";

/**
 * دورة الطباعة من المتصفح: حجز ذري → طباعة → تسجيل النتيجة.
 * كل الطباعة (تلقائية أو يدوية) بتمر من هنا، فالطلب الواحد مستحيل
 * يتحجز مرتين في نفس الوقت من جهازين.
 */
import type { AdminOrder } from "@/types/admin";
import { printReceiptInFrameConfirmed } from "@/lib/receipt";

/** بيتنشر بعد أي تغيير في حالة الطباعة عشان صفحة الطلبات تحدّث نفسها */
export const PRINT_STATE_EVENT = "rosemary:print-state";

export interface PrintRunResult {
  status: "printed" | "failed" | "skipped";
  message?: string;
  order?: AdminOrder;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
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
  const outcome = await printReceiptInFrameConfirmed(order);

  const payload = {
    orderId,
    claimId,
    status: outcome.ok ? "printed" : "failed",
    ...(outcome.ok ? {} : { error: outcome.error }),
  };

  // نتيجة الطباعة ممكن تضيع لو النت قطع بعد ما الورق طبع — بنعيد المحاولة
  // بنفس claimId (idempotent حتى ما يتسجلش اكتمال مزدوج).
  let lastData: { success?: boolean; data?: AdminOrder; error?: { message?: string } } | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { res, data } = await postJson(
        "/api/admin/print-queue/result",
        payload,
      );
      lastData = data;
      if (res.ok && data?.success) {
        notifyUi();
        return outcome.ok
          ? { status: "printed", order: data.data as AdminOrder }
          : {
              status: "failed",
              message: outcome.error,
              order: data.data as AdminOrder,
            };
      }
      // رفض منطقي (الحجز ضاع) — إعادة الإرسال مش هتغيّر حاجة
      if (res.status >= 400 && res.status < 500) break;
    } catch {
      /* نعيد المحاولة */
    }
    if (attempt < 2) await sleep(1200);
  }

  notifyUi();
  // نشوف الحالة الفعلية على السيرفر قبل ما نبلّغ المستخدم بنتيجة غلط
  const actual = await fetchOrderState(orderId);
  const expected = outcome.ok ? "printed" : "failed";
  if (actual && actual.printState === expected) {
    return outcome.ok
      ? { status: "printed", order: actual }
      : { status: "failed", message: outcome.error, order: actual };
  }

  if (outcome.ok) {
    return {
      status: "printed",
      message:
        "تم إرسال الطباعة لكن تعذّر تسجيلها على السيرفر — راجع حالة الطلب أو أعد الاتصال",
    };
  }
  return {
    status: "failed",
    message:
      outcome.error ||
      lastData?.error?.message ||
      "فشلت الطباعة — جرّب تاني",
  };
}
