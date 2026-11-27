import type { AdminOrder } from "@/types/admin";
import { RESTAURANT_NAME } from "@/data/siteConfig";
import { isOnlinePaymentMethod } from "@/lib/payment-review";

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
 * وفاصل صفحة واضح بين المطبخ والكاشير. الطابور وحالة الطلب ما اتغيروش.
 */
export function buildReceiptHtml(order: AdminOrder): string {
  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<title>إيصال ${escapeHtml(order.orderNumber ?? order.id)}</title>
<style>
  /* مقاس ثابت: Chrome يتجاهل «80mm auto» ويرجع لمقاس Letter في الطباعة */
  @page { size: 80mm 200mm; margin: 2mm; }
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
  @media print {
    html, body { width: 76mm; }
    .copy + .copy { break-before: page; page-break-before: always; }
    tr, .kv, .total-row, .notes { break-inside: avoid; page-break-inside: avoid; }
  }
</style>
</head>
<body>
${kitchenCopy(order)}
${cashierCopy(order)}
</body>
</html>`;
}

/** نتيجة محاولة الطباعة — الطباعة الفعلية بتتأكد من حدث afterprint */
export type PrintOutcome = { ok: true } | { ok: false; error: string };

/** أقصى وقت نستنى فيه تأكيد المتصفح قبل ما نعتبر المحاولة فاشلة */
const PRINT_CONFIRM_TIMEOUT_MS = 45_000;

function preparePrintFrame(
  order: AdminOrder,
): { win: Window; iframe: HTMLIFrameElement } | null {
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

  doc.open();
  doc.write(buildReceiptHtml(order));
  doc.close();
  return { win, iframe };
}

/**
 * طباعة من iframe مخفي. الصمت التام يعتمد على تشغيل Chrome على جهاز الكاشير
 * بالخيار --kiosk-printing؛ الموقع نفسه لا يفرّض إعداد المتصفح.
 */
export function printReceiptInFrame(order: AdminOrder): boolean {
  const frame = preparePrintFrame(order);
  if (!frame) return false;
  const { win, iframe } = frame;

  const cleanup = () => iframe.remove();
  const trigger = () => {
    try {
      win.focus();
      win.print();
    } catch {
      /* المتصفح رفض الطباعة — نقدر نطبع يدوي من صفحة الطلبات */
    }
  };
  win.addEventListener("afterprint", cleanup, { once: true });
  window.setTimeout(trigger, 400);
  window.setTimeout(cleanup, 5 * 60 * 1000);
  return true;
}

/**
 * نسخة بترجع نتيجة مؤكدة من المتصفح: بتستنى afterprint (أو فشل/مهلة 45 ثانية).
 * بعد كل حجز (Atomic Claim) بتحصل طباعة واحدة لمستند فيه نسختان —
 * afterprint معناه إن المتصفح خلّص أمر الطباعة — مش دليل مادي إن الورق طلع،
 * لأن الطابعة ممكن تكون offline وChrome يحفظ الشغل في طابور الويندوز.
 */
export function printReceiptInFrameConfirmed(
  order: AdminOrder,
): Promise<PrintOutcome> {
  const frame = preparePrintFrame(order);
  if (!frame) {
    return Promise.resolve({
      ok: false,
      error: "تعذّر تجهيز الإيصال للطباعة في المتصفح",
    });
  }
  const { win, iframe } = frame;

  return new Promise<PrintOutcome>((resolve) => {
    let done = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const finish = (result: PrintOutcome) => {
      if (done) return;
      done = true;
      if (timer) clearTimeout(timer);
      iframe.remove();
      resolve(result);
    };

    win.addEventListener(
      "afterprint",
      () => finish({ ok: true }),
      { once: true },
    );

    timer = setTimeout(
      () =>
        finish({
          ok: false,
          error:
            "المتصفح مأكدش انتهاء الطباعة (طابعة غير متصلة أو نافذة الطباعة مفتوحة؟)",
        }),
      PRINT_CONFIRM_TIMEOUT_MS,
    );

    setTimeout(() => {
      if (done) return;
      try {
        win.focus();
        win.print();
      } catch {
        finish({ ok: false, error: "المتصفح رفض أمر الطباعة" });
      }
    }, 400);
  });
}

/** يفتح نافذة طباعة بمقاس رول 80mm — بيرجع false لو المتصفح منع النافذة */
export function printOrderReceipt(order: AdminOrder): boolean {
  const win = window.open("", "_blank", "width=420,height=640");
  if (!win) return false;
  win.document.open();
  win.document.write(buildReceiptHtml(order));
  win.document.close();
  win.focus();
  window.setTimeout(() => {
    try {
      win.print();
    } catch {
      /* المستخدم يقدر يطبع يدويًا من النافذة */
    }
  }, 250);
  return true;
}
