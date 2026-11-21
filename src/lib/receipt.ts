import type { AdminOrder } from "@/types/admin";
import { RESTAURANT_NAME, SITE_CONTACT } from "@/data/siteConfig";

const PAYMENT_LABELS: Record<string, string> = {
  cash: "كاش عند الاستلام",
  vodafone_cash: "فودافون كاش",
  instapay: "إنستاباي",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "في الانتظار",
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
  <div class="row"><span class="label">الحالة</span><span>${escapeHtml(STATUS_LABELS[order.status] ?? order.status)}</span></div>
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
  <div class="row"><span class="label">الدفع</span><span>${escapeHtml(PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod)}</span></div>
  ${order.notes ? `<div class="sep"></div><div class="small">ملاحظات: ${escapeHtml(order.notes)}</div>` : ""}
  <div class="sep"></div>
  <div class="footer">شكراً لطلبك — ${escapeHtml(RESTAURANT_NAME)}<br/>تم الطبع: ${escapeHtml(formatDate(new Date().toISOString()))}</div>
</body>
</html>`;
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
