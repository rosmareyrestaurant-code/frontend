import type { AdminOrder } from "@/types/admin";
import { RESTAURANT_NAME, SITE_CONTACT } from "@/data/siteConfig";
import {
  isOnlinePaymentMethod,
  isPaymentVerified,
} from "@/lib/payment-review";

const PAYMENT_LABELS: Record<string, string> = {
  cash: "كاش عند الاستلام",
  vodafone_cash: "فودافون كاش",
  instapay: "إنستاباي",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "قيد الانتظار",
  delivered: "تم التسليم",
  cancelled: "ملغي",
};

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

/**
 * قسم الدفع على الورقة: تمييز ONLINE/CASH، رقم المرجع كما هو موجود فقط،
 * وحالة الدفع الحقيقية — الطباعة نفسها لا تعني أن المبلغ وصل.
 */
function paymentSection(order: AdminOrder): string {
  const methodLabel = PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod;

  if (!isOnlinePaymentMethod(order.paymentMethod)) {
    return `
  <div class="sep"></div>
  <div class="banner cash">CASH</div>
  <div class="banner-sub">الدفع عند الاستلام</div>
  <div class="row"><span class="label">المبلغ المطلوب</span><span class="total">${order.total} ج.م</span></div>
  <div class="row"><span class="label">طريقة الدفع</span><span>كاش عند الاستلام</span></div>`;
  }

  const ref = (order.transactionReference || "").trim();
  const verified = isPaymentVerified(order.paymentStatus);
  const rejected = order.paymentStatus === "rejected";
  const statusText = verified
    ? "مدفوع مؤكد"
    : rejected
      ? "تحويل مرفوض — غير مدفوع"
      : "بانتظار التحقق — غير مدفوع";
  const statusClass = verified ? "paid" : rejected ? "bad" : "pending";

  const refBlock = ref
    ? `<div class="refbox">
        <div class="reflabel">مرجع التحويل — Transaction Reference</div>
        <div class="refvalue" dir="ltr">${escapeHtml(ref)}</div>
      </div>`
    : `<div class="refbox">
        <div class="reflabel">مرجع التحويل — Transaction Reference</div>
        <div class="refmissing">غير مُدخل — راجع صورة التحويل</div>
      </div>`;

  const warning = verified
    ? `<div class="okbox">تم تأكيد استلام المبلغ — الطلب مسموح له بمسار التجهيز.</div>`
    : `<div class="warn">لا يتم تسليم الطلب للمطبخ قبل التأكد من وصول المبلغ.</div>`;

  return `
  <div class="sep"></div>
  <div class="banner online">ONLINE</div>
  <div class="banner-sub">تحويل إلكتروني — ${escapeHtml(methodLabel)}</div>
  <div class="row"><span class="label">المبلغ المطلوب</span><span class="total">${order.total} ج.م</span></div>
  <div class="row"><span class="label">طريقة الدفع</span><span>${escapeHtml(methodLabel)}</span></div>
  <div class="row"><span class="label">حالة الدفع</span><span class="${statusClass}">${statusText}</span></div>
  ${refBlock}
  ${warning}`;
}

export function buildReceiptHtml(order: AdminOrder): string {
  const itemRows = order.items
    .map((item) => {
      const extras: string[] = [];
      if (item.selectedSize) extras.push(item.selectedSize.name);
      if (item.selectedAddons?.length) {
        extras.push(item.selectedAddons.map((a) => a.name).join(" + "));
      }
      const notes = item.notes ? `<div class="small">ملاحظة: ${escapeHtml(item.notes)}</div>` : "";
      const suffix = extras.length ? ` <span class="small">(${escapeHtml(extras.join(" - "))})</span>` : "";
      const total = item.itemTotal ?? item.price * item.quantity;
      return `<tr>
        <td class="qty">${item.quantity}</td>
        <td class="name">${escapeHtml(item.productName)}${suffix}${notes}<div class="small">${item.price} × ${item.quantity}</div></td>
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
  .brand { font-size: 17px; font-weight: 800; letter-spacing: 0.3px; }
  .sub { font-size: 9.5px; color: #444; }
  .sep { border-top: 1px dashed #999; margin: 2.5mm 0; }
  .row { display: flex; justify-content: space-between; gap: 4mm; }
  .row > span:last-child { font-weight: 700; }
  .label { color: #555; }
  .small { font-size: 9.5px; color: #444; }
  table { width: 100%; border-collapse: collapse; }
  th { font-size: 9.5px; color: #555; text-align: right; padding-bottom: 1mm; border-bottom: 1px solid #bbb; }
  td { padding: 1.4mm 0; vertical-align: top; border-bottom: 1px dotted #ddd; }
  td.qty { width: 8mm; font-weight: 700; }
  td.amount { width: 18mm; text-align: left; font-weight: 700; white-space: nowrap; }
  .name { padding-inline-start: 1mm; }
  .total { font-size: 14px; font-weight: 800; }
  .banner {
    margin-top: 1mm;
    padding: 2mm 1mm;
    text-align: center;
    font-size: 24px;
    font-weight: 900;
    letter-spacing: 3px;
    border: 1.6px solid #000;
  }
  .banner.online { background: #000; color: #fff; }
  .banner.cash { background: #fff; color: #000; border-width: 4px; border-style: double; }
  .banner-sub { text-align: center; font-size: 10.5px; font-weight: 800; margin-top: 1mm; }
  .pending, .paid, .bad { font-weight: 900; }
  .refbox { margin-top: 2mm; border: 1.4px solid #000; padding: 2mm 1.5mm; text-align: center; }
  .reflabel { font-size: 8.5px; color: #333; }
  .refvalue { font-size: 18px; font-weight: 900; letter-spacing: 0.5px; margin-top: 0.8mm; word-break: break-all; }
  .refmissing { font-size: 10.5px; font-weight: 800; margin-top: 0.8mm; }
  .warn {
    margin-top: 2mm;
    padding: 2mm 1.5mm;
    border: 1.6px dashed #000;
    text-align: center;
    font-size: 11.5px;
    font-weight: 900;
  }
  .okbox {
    margin-top: 2mm;
    padding: 1.5mm;
    border: 1px solid #000;
    text-align: center;
    font-size: 10.5px;
    font-weight: 800;
  }
  .footer { margin-top: 3mm; font-size: 9.5px; text-align: center; color: #333; }
  @media print { body { width: 76mm; } }
</style>
</head>
<body>
  <div class="center">
    <div class="brand">${escapeHtml(RESTAURANT_NAME)} — Rosemary</div>
    <div class="sub">${escapeHtml(SITE_CONTACT.address)}</div>
    <div class="sub" dir="ltr">${escapeHtml(SITE_CONTACT.phone)}</div>
  </div>
  <div class="sep"></div>
  <div class="row"><span class="label">رقم الطلب</span><span>#${escapeHtml(order.orderNumber ?? order.id)}</span></div>
  <div class="row"><span class="label">التاريخ</span><span>${escapeHtml(formatDate(order.createdAt))}</span></div>
  <div class="row"><span class="label">حالة الطلب</span><span>${escapeHtml(STATUS_LABELS[order.status] ?? order.status)}</span></div>
  <div class="sep"></div>
  <div class="row"><span class="label">العميل</span><span>${escapeHtml(order.customerName)}</span></div>
  <div class="row"><span class="label">الهاتف</span><span dir="ltr">${escapeHtml(order.customerPhone)}</span></div>
  <div class="small">${escapeHtml(order.customerAddress)}</div>
  ${order.area ? `<div class="small">المنطقة: ${escapeHtml(order.area)}</div>` : ""}
  <div class="sep"></div>
  <table>
    <thead><tr><th>كمية</th><th>الصنف</th><th style="text-align:left">الإجمالي</th></tr></thead>
    <tbody>${itemRows}</tbody>
  </table>
  <div class="sep"></div>
  <div class="row"><span class="label">المجموع الفرعي</span><span>${order.subtotal} ج.م</span></div>
  <div class="row"><span class="label">التوصيل</span><span>${(order.deliveryFee ?? 0) > 0 ? `${order.deliveryFee} ج.م` : "مجاني"}</span></div>
  ${(order.discount ?? 0) > 0 ? `<div class="row"><span class="label">الخصم</span><span>-${order.discount} ج.م</span></div>` : ""}
  <div class="row total"><span>الإجمالي</span><span>${order.total} ج.م</span></div>
  ${paymentSection(order)}
  ${order.notes ? `<div class="sep"></div><div class="small">ملاحظات: ${escapeHtml(order.notes)}</div>` : ""}
  <div class="sep"></div>
  <div class="footer">شكراً لطلبك — ${escapeHtml(RESTAURANT_NAME)}<br/>تم الطبع: ${escapeHtml(formatDate(new Date().toISOString()))}</div>
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
 * طباعة من غير نافذة منبثقة: بيكتب الإيصال في iframe مخفي ويطبع منه.
 * مع تشغيل Chrome بميزة kiosk printing بتطلع الطباعة على الطابعة الافتراضية
 * مباشرة من غير أي نافذة أو تأكيد.
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
 * ملاحظة: afterprint معناه إن المتصفح خلّص أمر الطباعة — مش دليل مادي إن الورق
 * خرج فعلاً (الطابعة ممكن تكون offline وChrome يحفظ الشغل في طابور الويندوز).
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
