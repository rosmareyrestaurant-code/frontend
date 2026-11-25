import type { AdminOrder } from "@/types/admin";
import { RESTAURANT_NAME } from "@/data/siteConfig";
import {
  isOnlinePaymentMethod,
  isPaymentConfirmed,
} from "@/lib/payment-review";

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

function paymentSection(order: AdminOrder): string {
  const online = isOnlinePaymentMethod(order.paymentMethod);
  const ref = (order.transactionReference || "").trim();
  const confirmed = isPaymentConfirmed(order);

  return `
  <div class="sep"></div>
  <div class="row"><span class="label">طريقة الدفع</span><span class="pay">${paymentMethodText(order)}</span></div>
  ${online ? `<div class="row"><span class="label">مراجعة الدفع</span><span class="pay">${confirmed ? "تم التأكيد" : "لم يتم التأكيد"}</span></div>` : ""}
  ${online && ref ? `<div class="row"><span class="label">رقم العملية</span><span class="refvalue">${escapeHtml(ref)}</span></div>` : ""}`;
}

export function buildReceiptHtml(order: AdminOrder): string {
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
      const total = item.itemTotal ?? item.price * item.quantity;
      return `<tr>
        <td class="qty">${item.quantity}</td>
        <td class="name">${escapeHtml(item.productName)}${suffix}${notes}</td>
        <td class="price">${item.price}</td>
        <td class="amount">${total}</td>
      </tr>`;
    })
    .join("");

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<title>إيصال ${escapeHtml(order.orderNumber ?? order.id)}</title>
<style>
  @page { size: 80mm auto; margin: 2mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; color: #111; }
  body {
    width: 76mm;
    padding: 2mm 1mm;
    font-family: "Cairo", "Segoe UI", Tahoma, Arial, sans-serif;
    font-size: 11px;
    line-height: 1.45;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .center { text-align: center; }
  .brand { font-size: 17px; font-weight: 800; }
  .sep { border-top: 1px dashed #999; margin: 2.5mm 0; }
  .row { display: flex; justify-content: space-between; gap: 3mm; }
  .row > span:last-child { font-weight: 700; text-align: left; word-break: break-word; }
  .label { color: #555; white-space: nowrap; }
  .small { font-size: 9.5px; color: #444; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; }
  th { font-size: 9.5px; color: #555; text-align: right; padding-bottom: 1mm; border-bottom: 1px solid #bbb; }
  td { padding: 1.4mm 0; vertical-align: top; border-bottom: 1px dotted #ddd; }
  td.qty { width: 8mm; font-weight: 700; }
  td.name { width: auto; padding-inline-start: 1mm; }
  td.price { width: 14mm; text-align: left; }
  td.amount { width: 16mm; text-align: left; font-weight: 700; white-space: nowrap; }
  .total { font-size: 14px; font-weight: 800; }
  .pay { font-weight: 700; word-break: break-word; }
  .refvalue { direction: ltr; text-align: left; font-weight: 700; word-break: break-all; }
  @media print { body { width: 76mm; } }
</style>
</head>
<body>
  <div class="center"><div class="brand">${escapeHtml(RESTAURANT_NAME)}</div></div>
  <div class="sep"></div>
  <div class="row"><span class="label">رقم الطلب</span><span dir="ltr">#${escapeHtml(order.orderNumber ?? order.id)}</span></div>
  <div class="row"><span class="label">التاريخ</span><span>${escapeHtml(formatDate(order.createdAt))}</span></div>
  <div class="sep"></div>
  <div class="row"><span class="label">العميل</span><span>${escapeHtml(order.customerName)}</span></div>
  <div class="row"><span class="label">الهاتف</span><span dir="ltr">${escapeHtml(order.customerPhone)}</span></div>
  <div class="sep"></div>
  <table>
    <thead><tr><th>كمية</th><th>الصنف</th><th style="text-align:left">السعر</th><th style="text-align:left">المجموع</th></tr></thead>
    <tbody>${itemRows}</tbody>
  </table>
  <div class="sep"></div>
  <div class="row"><span class="label">الإجمالي</span><span class="total">${order.total} ج.م</span></div>
  ${paymentSection(order)}
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
