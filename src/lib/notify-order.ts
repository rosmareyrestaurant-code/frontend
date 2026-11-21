import { after } from "next/server";
import { SITE_URL } from "@/data/siteConfig";

export interface NotifiableOrder {
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  area?: string;
  items: {
    productName: string;
    quantity: number;
    unitPrice: number;
    itemTotal: number;
    selectedSize?: { name: string; price: number } | null;
    selectedAddons?: { name: string; price: number }[];
    notes?: string;
  }[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  paymentMethod: string;
  paymentProofUrl?: string;
  notes?: string;
  createdAt?: string | Date;
}

const PAYMENT_LABELS: Record<string, string> = {
  cash: "كاش عند الاستلام",
  vodafone_cash: "فودافون كاش",
  instapay: "إنستاباي",
};

function formatWhen(value?: string | Date): string {
  const date = value ? new Date(value) : new Date();
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      timeZone: "Africa/Cairo",
      dateStyle: "short",
      timeStyle: "short",
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

/* ------------------------- إشعار واتساب للمدير (CallMeBot) ------------------------- */

/** حدود طول رسالة واتساب عشان لينك الـ GET يفضل قصير */
const WHATSAPP_MAX_LEN = 900;

/** 010xxxxxxxx → 2010xxxxxxxx — يقبل + و00 كمان */
function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.startsWith("00")) return digits.slice(2);
  if (digits.startsWith("0")) return `20${digits.slice(1)}`;
  return digits;
}

/** رسالة نص عادي فيها كل تفاصيل الطلب */
export function buildWhatsAppText(order: NotifiableOrder): string {
  const lines: string[] = [];
  lines.push("طلب جديد من موقع روزماري");
  lines.push("");
  lines.push(`رقم الطلب: ${order.orderNumber}`);
  lines.push(`الوقت: ${formatWhen(order.createdAt)}`);
  lines.push("");
  lines.push(`العميل: ${order.customerName}`);
  lines.push(`الهاتف: ${order.customerPhone}`);
  lines.push(`العنوان: ${order.customerAddress}`);
  if (order.area) lines.push(`المنطقة: ${order.area}`);
  lines.push("");
  lines.push("الوجبات:");
  for (const item of order.items.slice(0, 8)) {
    const extras: string[] = [];
    if (item.selectedSize) extras.push(item.selectedSize.name);
    if (item.selectedAddons?.length) {
      extras.push(item.selectedAddons.map((a) => a.name).join(" + "));
    }
    const suffix = extras.length ? ` (${extras.join(" - ")})` : "";
    lines.push(`- ${item.quantity} × ${item.productName}${suffix} = ${item.itemTotal} ج.م`);
  }
  if (order.items.length > 8) {
    lines.push(`- و${order.items.length - 8} أصناف أخرى`);
  }
  lines.push("");
  lines.push(`المجموع الفرعي: ${order.subtotal} ج.م`);
  lines.push(`التوصيل: ${order.deliveryFee > 0 ? `${order.deliveryFee} ج.م` : "مجاني"}`);
  if (order.discount > 0) lines.push(`الخصم: ${order.discount} ج.م`);
  lines.push(`الإجمالي: ${order.total} ج.م`);
  lines.push(`الدفع: ${PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}`);
  if (order.paymentProofUrl) lines.push(`إثبات التحويل: ${order.paymentProofUrl}`);
  if (order.notes) lines.push(`ملاحظات: ${order.notes}`);
  lines.push("");
  lines.push(`الطلبات: ${SITE_URL}/dashboard/orders`);

  const text = lines.join("\n");
  return text.length > WHATSAPP_MAX_LEN ? `${text.slice(0, WHATSAPP_MAX_LEN - 1)}…` : text;
}

export function isWhatsAppNotifyConfigured(): boolean {
  return Boolean(
    process.env.WHATSAPP_MANAGER_PHONE?.trim() && process.env.CALLMEBOT_APIKEY?.trim(),
  );
}

async function notifyWhatsApp(order: NotifiableOrder): Promise<void> {
  const phone = normalizePhone(process.env.WHATSAPP_MANAGER_PHONE?.trim() ?? "");
  const apikey = process.env.CALLMEBOT_APIKEY?.trim();
  if (!phone || !apikey) return;

  const url =
    "https://api.callmebot.com/whatsapp.php" +
    `?phone=${encodeURIComponent(`+${phone}`)}` +
    `&text=${encodeURIComponent(buildWhatsAppText(order))}` +
    `&apikey=${encodeURIComponent(apikey)}`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8_000) });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[callmebot] send failed", res.status, detail.slice(0, 200));
    }
  } catch (e) {
    console.error("[callmebot] send error", (e as Error).message);
  }
}

/** يبعت التنبيه بعد ما يستجيب الطلب للعميل — الفشل ما بيأثرش على الطلب المحفوظ */
export function scheduleOrderNotification(order: NotifiableOrder): void {
  if (!isWhatsAppNotifyConfigured()) return;
  after(() => notifyWhatsApp(order));
}
