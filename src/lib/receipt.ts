import type { AdminOrder } from "@/types/admin";
import { RESTAURANT_NAME } from "@/data/siteConfig";
import { isOnlinePaymentMethod } from "@/lib/payment-review";
import {
  PRINT_ABORTED_BEFORE_PRINT_MESSAGE,
  PRINT_UNCONFIRMED_MESSAGE,
} from "@/lib/print-queue";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      timeZone: "Africa/Cairo",
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** وسيلة الأونلاين تظهر باسمها المحفوظ — لا تُختزل إلى «أونلاين» فقط */
function paymentMethodText(order: AdminOrder): string {
  if (!isOnlinePaymentMethod(order.paymentMethod)) return "كاش";
  const onlineLabels: Record<string, string> = {
    vodafone_cash: "Vodafone Cash",
    instapay: "InstaPay",
  };
  const label = onlineLabels[order.paymentMethod] ?? order.paymentMethod;
  return `أونلاين - <span dir="ltr">${escapeHtml(label)}</span>`;
}

/** قرار المراجعة يُطبع فقط لو مسجّل فعلاً في بيانات الطلب */
function reviewDecisionText(order: AdminOrder): string | null {
  const decision = order.paymentVerification?.decision;
  const status = order.paymentStatus;
  if (decision === "paid" || status === "verified" || status === "paid") {
    return "تم التأكيد";
  }
  if (decision === "unpaid" || status === "unpaid" || status === "rejected") {
    return "مرفوض";
  }
  return null;
}

function reviewMetaText(order: AdminOrder): string {
  const name =
    order.paymentVerification?.reviewedByName || order.paymentVerifiedByName || "";
  const at =
    order.paymentVerification?.reviewedAt || order.paymentVerifiedAt || "";
  const parts: string[] = [];
  if (name) parts.push(name);
  if (at) parts.push(formatDate(String(at)));
  return parts.join(" — ");
}

/** نوع الاستلام مشروط بالبيانات الموجودة فعلاً — مفيش افتراض إضافي */
function fulfillmentText(order: AdminOrder): string {
  const area = (order.area || "").trim();
  const address = (order.customerAddress || "").trim();
  if (!area && !address) return "استلام من المطعم";
  return area ? `توصيل - ${area}` : "توصيل";
}

function itemsTable(order: AdminOrder, withPrices: boolean): string {
  const itemRows = order.items
    .map((item) => {
      const extras: string[] = [];
      if (item.selectedSize) extras.push(item.selectedSize.name);
      if (item.selectedAddons?.length) {
        extras.push(item.selectedAddons.map((a) => a.name).join(" + "));
      }
      const suffix = extras.length
        ? `<div class="small">(${escapeHtml(extras.join(" - "))})</div>`
        : "";
      const notes = item.notes
        ? `<div class="small">${escapeHtml(item.notes)}</div>`
        : "";
      const name = `<td class="name"><span class="item-name">${escapeHtml(item.productName)}</span>${suffix}${notes}</td>`;

      if (!withPrices) {
        return `<tr><td class="qty">${item.quantity}</td>${name}</tr>`;
      }
      const total = item.itemTotal ?? item.price * item.quantity;
      return `<tr>
        <td class="qty">${item.quantity}</td>
        ${name}
        <td class="price">${item.price}</td>
        <td class="amount">${total}</td>
      </tr>`;
    })
    .join("");

  if (!withPrices) {
    return `<table class="receipt-table kitchen-table">
      <thead><tr><th>كمية</th><th>الصنف</th></tr></thead>
      <tbody>${itemRows}</tbody>
    </table>`;
  }

  return `<table class="receipt-table">
    <thead><tr><th>كمية</th><th>الصنف</th><th class="left">السعر</th><th class="left">المجموع</th></tr></thead>
    <tbody>${itemRows}</tbody>
  </table>`;
}

function ticketHeader(order: AdminOrder, title: string): string {
  return `
    <div class="brand">${escapeHtml(RESTAURANT_NAME)}</div>
    <div class="copy-title">${title}</div>
    <div class="rule"></div>
    <div class="kv"><span class="label">رقم الطلب</span><span class="value num order-num">#${escapeHtml(order.orderNumber ?? order.id)}</span></div>
    <div class="kv"><span class="label">التاريخ والوقت</span><span class="value">${escapeHtml(formatDate(order.createdAt))}</span></div>`;
}

/** نسخة المطبخ: بدون أسعار أو أي بيانات دفع */
function kitchenCopy(order: AdminOrder): string {
  const customer = order.customerName?.trim()
    ? `<div class="kv"><span class="label">العميل</span><span class="value">${escapeHtml(order.customerName)}</span></div>`
    : "";
  const notes = order.notes?.trim()
    ? `<div class="notes"><div class="notes-title">ملاحظات الطلب</div><div class="notes-text">${escapeHtml(order.notes)}</div></div>`
    : "";

  return `<section class="copy kitchen">
    ${ticketHeader(order, "نسخة المطبخ")}
    ${customer}
    <div class="kv"><span class="label">الاستلام</span><span class="value">${escapeHtml(fulfillmentText(order))}</span></div>
    <div class="rule"></div>
    ${itemsTable(order, false)}
    ${notes}
  </section>`;
}

/** نسخة الكاشير: الأسعار والإجمالي وبيانات الدفع الموجودة فعلاً */
function cashierCopy(order: AdminOrder): string {
  const addressParts = [order.area, order.customerAddress]
    .map((part) => (part || "").trim())
    .filter(Boolean);
  const address = addressParts.length
    ? `<div class="kv"><span class="label">العنوان</span><span class="value">${escapeHtml(addressParts.join(" - "))}</span></div>`
    : "";
  const review = isOnlinePaymentMethod(order.paymentMethod)
    ? reviewDecisionText(order)
    : null;
  const reviewMeta = review ? reviewMetaText(order) : "";
  const ref = (order.transactionReference || "").trim();
  const cashierNote = order.cashierNote?.trim()
    ? `<div class="notes"><div class="notes-title">ملاحظة الكاشير</div><div class="notes-text">${escapeHtml(order.cashierNote)}</div></div>`
    : "";

  return `<section class="copy cashier">
    ${ticketHeader(order, "نسخة الكاشير")}
    <div class="kv"><span class="label">العميل</span><span class="value">${escapeHtml(order.customerName)}</span></div>
    <div class="kv"><span class="label">الهاتف</span><span class="value num">${escapeHtml(order.customerPhone)}</span></div>
    ${address}
    <div class="rule"></div>
    ${itemsTable(order, true)}
    <div class="total-row"><span class="total-label">الإجمالي</span><span class="total-value" dir="ltr">${order.total} ج.م</span></div>
    <div class="rule"></div>
    <div class="kv"><span class="label">طريقة الدفع</span><span class="value pay">${paymentMethodText(order)}</span></div>
    ${review ? `<div class="kv"><span class="label">مراجعة الدفع</span><span class="value pay">${review}</span></div>` : ""}
    ${review && reviewMeta ? `<div class="kv"><span class="label">تفاصيل المراجعة</span><span class="value">${escapeHtml(reviewMeta)}</span></div>` : ""}
    ${ref ? `<div class="kv"><span class="label">رقم العملية</span><span class="value refvalue">${escapeHtml(ref)}</span></div>` : ""}
    ${cashierNote}
  </section>`;
}

/**
 * نسختان داخل مستند طباعة واحد: وظيفة print() واحدة في iframe واحد،
 * وفاصل واضح بين المطبخ والكاشير بدون فاصل صفحات إجباري.
 * طول الصفحة يُقاس من المحتوى بعد التحميل، فلا يوجد طول ثابت 200mm ولا ورق فارغ.
 * الطابور وحالة الطلب ما اتغيروش.
 */
export function buildReceiptHtml(order: AdminOrder): string {
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<title>إيصال ${escapeHtml(order.orderNumber ?? order.id)}</title>
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; color: #000; }
  body {
    width: 76mm;
    font-family: Tahoma, "Segoe UI", Arial, sans-serif;
    font-size: 12px;
    line-height: 1.35;
    color: #000;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .copy { width: 100%; }
  .copy + .copy { border-top: 2px solid #000; margin-top: 4mm; padding-top: 3mm; }
  .brand { text-align: center; font-size: 18px; font-weight: 900; }
  .copy-title {
    text-align: center; font-size: 15px; font-weight: 900; margin-top: 1mm;
    text-decoration: underline; text-underline-offset: 2px;
  }
  .rule { border-top: 2px solid #000; margin: 2mm 0; }
  .kv {
    display: flex; justify-content: space-between; align-items: flex-start;
    gap: 2mm; margin: 0.8mm 0;
  }
  .label { flex: 0 0 auto; color: #000; font-size: 11px; font-weight: 400; }
  .value {
    flex: 1 1 auto; min-width: 0; color: #000; font-size: 12px; font-weight: 700;
    text-align: left; word-break: break-word; overflow-wrap: anywhere;
  }
  .num { direction: ltr; unicode-bidi: isolate; font-variant-numeric: tabular-nums; font-weight: 900; }
  .order-num { font-size: 15px; }
  .receipt-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  th {
    font-size: 11px; font-weight: 900; color: #000; text-align: right;
    padding: 0 0.5mm 1mm; border-bottom: 1.5px solid #000;
  }
  th.left { text-align: left; }
  td {
    font-size: 11.5px; color: #000; padding: 1.2mm 0.5mm; vertical-align: top;
    border-bottom: 1px solid #000; word-break: break-word; overflow-wrap: anywhere;
  }
  td.qty { width: 10mm; font-size: 12px; font-weight: 900; text-align: center; }
  td.name { width: auto; }
  .item-name { font-weight: 800; }
  td.price { width: 14mm; text-align: left; font-variant-numeric: tabular-nums; }
  td.amount { width: 16mm; text-align: left; font-weight: 900; font-variant-numeric: tabular-nums; }
  .kitchen-table td.qty { width: 12mm; }
  .small { font-size: 10.5px; color: #000; font-weight: 700; overflow-wrap: anywhere; }
  .notes { border: 1.5px solid #000; padding: 1.5mm; margin-top: 2mm; }
  .notes-title { font-size: 11px; font-weight: 900; }
  .notes-text { font-size: 11.5px; font-weight: 700; overflow-wrap: anywhere; }
  .total-row {
    display: flex; justify-content: space-between; align-items: baseline; gap: 2mm;
    border-top: 2px solid #000; margin-top: 2mm; padding-top: 1.5mm;
  }
  .total-label { font-size: 13px; font-weight: 900; }
  .total-value { font-size: 18px; font-weight: 900; font-variant-numeric: tabular-nums; }
  .pay { font-weight: 800; }
  .refvalue { direction: ltr; unicode-bidi: isolate; font-weight: 900; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
</style>
</head>
<body>
${kitchenCopy(order)}
${cashierCopy(order)}
<script>
  /* Chrome لا يحترم «80mm auto» في الطباعة؛ نضبط الطول من المحتوى قبل print() */
  (function () {
    function applyPageSize() {
      if (document.getElementById("thermal-page-size")) return;
      var heightPx = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
      );
      /* 4mm هوامش @page فقط؛ لا يوجد طول ثابت ولا مساحة إجبارية */
      var heightMm = Math.ceil((heightPx * 25.4) / 96) + 4;
      var style = document.createElement("style");
      style.id = "thermal-page-size";
      style.textContent = "@page { size: 80mm " + heightMm + "mm; margin: 2mm; }";
      document.head.appendChild(style);
    }
    if (document.readyState === "complete") applyPageSize();
    else window.addEventListener("load", applyPageSize, { once: true });
  })();
</script>
</body>
</html>`;
}

/**
 * نتيجة آمنة من المتصفح: printed تعني وصول إشارة afterprint (أفضل إشارة
 * متاحة برمجياً، وليست إثباتاً مادياً لخروج الورقة). إن لم تصل الإشارة
 * نُسجّل unconfirmed، وإن فشل التجهيز قبل print() نُسجّل failed.
 */
export type PrintOutcome =
  | { status: "printed" }
  | { status: "unconfirmed"; error: string }
  | { status: "failed"; error: string };

/**
 * إشارات المحاولة الواحدة. الطابور يمرّر signal إلغاء عند إغلاق التبويب،
 * ويستقبل onPrintStarted/onAfterPrint ليبني حالة واحدة صحيحة للحجز.
 */
export interface PrintReceiptSignals {
  signal?: AbortSignal;
  onPrintStarted?: () => void;
  onAfterPrint?: () => void;
}

/** مهلة قصيرة لانتظار تجهيز iframe قبل استدعاء print() */
const PRINT_FRAME_READY_TIMEOUT_MS = 2_000;
/**
 * مهلة انتظار واحدة لـ afterprint بعد إرسال print() — ليست مؤقت إعادة طباعة.
 * وظيفتها فقط إغلاق الحجز كـ unconfirmed بدل تركه processing لدقيقتين.
 */
const PRINT_AFTERPRINT_TIMEOUT_MS = 12_000;

type PrintFrame = {
  win: Window;
  iframe: HTMLIFrameElement;
  /** false يعني إن المستند ما اتجهزش في الوقت المناسب فما نطبعش */
  ready: Promise<boolean>;
};

function preparePrintFrame(order: AdminOrder): PrintFrame | null {
  if (typeof document === "undefined") return null;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText =
    "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = win?.document;
  if (!win || !doc) {
    iframe.remove();
    return null;
  }

  let readyTimer: number | null = null;
  let markReady: (ready: boolean) => void = () => {};
  const ready = new Promise<boolean>((resolve) => {
    markReady = (isReady) => {
      if (readyTimer !== null) clearTimeout(readyTimer);
      readyTimer = null;
      resolve(isReady);
    };
    readyTimer = window.setTimeout(
      () => markReady(false),
      PRINT_FRAME_READY_TIMEOUT_MS,
    );
  });

  // لازم نستنى تحميل المستند (ومعاه ضبط @page من رأس المحتوى) قبل print().
  win.addEventListener("load", () => markReady(true), { once: true });
  doc.open();
  doc.write(buildReceiptHtml(order));
  doc.close();
  if (doc.readyState === "complete") markReady(true);

  return { win, iframe, ready };
}

/**
 * طباعة واحدة في iframe واحد بعد تجهيز المستند. الصمت يعتمد على تشغيل Chrome
 * بـ --kiosk-printing؛ الموقع لا يفرض إعداد المتصفح.
 *
 * بعد print() ننتظر afterprint ليسجّل السيرفر الحالة printed تلقائياً.
 * الحدث نفسه يُطلق أيضاً عند إغلاق نافذة الطباعة دون طباعة، فلا يمكن للمتصفح
 * إثبات خروج الورق؛ إن لم يصل الحدث خلال مهلة واحدة نُسجّل unconfirmed.
 *
 * إشارة الإلغاء (pagehide) تُغلق المحاولة قبل print() كـ failed، وبعده كـ
 * unconfirmed. لا توجد إعادة طباعة تلقائية من هنا، والمستمعات والـ iframe
 * يتنظّفان دائماً.
 */
export function printReceiptInFrame(
  order: AdminOrder,
  signals: PrintReceiptSignals = {},
): Promise<PrintOutcome> {
  if (signals.signal?.aborted) {
    return Promise.resolve({
      status: "failed",
      error: PRINT_ABORTED_BEFORE_PRINT_MESSAGE,
    });
  }

  const frame = preparePrintFrame(order);
  if (!frame) {
    return Promise.resolve({
      status: "failed",
      error: "تعذّر تجهيز الإيصال للطباعة في المتصفح",
    });
  }
  const { win, iframe, ready } = frame;

  return new Promise<PrintOutcome>((resolve) => {
    let settled = false;
    let printStarted = false;
    let watchdog: number | null = null;
    let afterPrintHandler: (() => void) | null = null;
    let onAbort: (() => void) | null = null;

    const cleanup = () => {
      if (watchdog !== null) {
        window.clearTimeout(watchdog);
        watchdog = null;
      }
      if (afterPrintHandler) {
        win.removeEventListener("afterprint", afterPrintHandler);
        afterPrintHandler = null;
      }
      if (onAbort) {
        signals.signal?.removeEventListener("abort", onAbort);
        onAbort = null;
      }
      iframe.remove();
    };

    // مصدر واحد لإنهاء المحاولة: أي إشارة (afterprint/timeout/abort) مرة واحدة.
    const settle = (result: PrintOutcome) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    };

    onAbort = () => {
      if (settled) return;
      settle(
        printStarted
          ? { status: "unconfirmed", error: PRINT_UNCONFIRMED_MESSAGE }
          : {
              status: "failed",
              error: PRINT_ABORTED_BEFORE_PRINT_MESSAGE,
            },
      );
    };
    signals.signal?.addEventListener("abort", onAbort, { once: true });

    afterPrintHandler = () => {
      // أي afterprint قبل print() ليس إشارة لطباعة هذه المحاولة.
      if (!printStarted || settled) return;
      try {
        signals.onAfterPrint?.();
      } catch {
        /* إشارة الواجهة لا تُلغي نتيجة الطباعة */
      }
      settle({ status: "printed" });
    };
    win.addEventListener("afterprint", afterPrintHandler);

    void ready.then((isReady) => {
      if (settled || signals.signal?.aborted) return;
      if (!isReady) {
        settle({
          status: "failed",
          error: "لم يكتمل تجهيز الإيصال قبل إرساله للطابعة",
        });
        return;
      }
      try {
        win.focus();
        // الإشارة تُرسل بعد عودة print() فعلياً، لا أثناء تجهيز الإطار.
        printStarted = true;
        win.print();
        try {
          signals.onPrintStarted?.();
        } catch {
          /* إشارة الواجهة لا تُلغي نتيجة الطباعة */
        }
      } catch {
        printStarted = false;
        settle({ status: "failed", error: "المتصفح رفض أمر الطباعة" });
        return;
      }
      if (!settled) {
        watchdog = window.setTimeout(
          () =>
            settle({
              status: "unconfirmed",
              error: PRINT_UNCONFIRMED_MESSAGE,
            }),
          PRINT_AFTERPRINT_TIMEOUT_MS,
        );
      }
    });
  });
}
