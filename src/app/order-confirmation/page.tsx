"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  CheckCircle2, Clock, MapPin, Phone, User, StickyNote,
  ShoppingBag, ArrowLeft, Loader2, Truck, Copy, Check,
} from "lucide-react";
import { readLastOrder, readCurrentOrder } from "@/lib/clientStorage";
import { reverseGeocode } from "@/lib/geocode";
import { useStoreToast } from "@/components/common/StoreToast";
import type { Order, PublicOrder } from "@/types";

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch { return iso; }
}

/** تحويل الطلب المحلي (بدون سيرفر) للشكل اللي بتعرضه الصفحة */
function fromLocalOrder(order: Order): PublicOrder {
  return {
    id: order.id,
    orderNumber: order.id,
    customer: order.customer,
    items: order.items.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      productImage: item.product.image,
      selectedSize: undefined,
      selectedAddons: [],
      quantity: item.quantity,
      unitPrice: item.product.price,
      itemTotal: item.product.price * item.quantity,
      notes: item.notes,
    })),
    subtotal: order.subtotal,
    deliveryFee: 0,
    discount: 0,
    total: order.total,
    paymentMethod: "cash",
    paymentStatus: "pending",
    orderStatus: order.status,
    createdAt: order.createdAt,
  };
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-[var(--color-text-on-primary)]">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-[var(--color-text-muted)] font-semibold uppercase tracking-widest">{label}</p>
        <p className="text-sm text-white mt-0.5 leading-relaxed break-words">{value}</p>
      </div>
    </div>
  );
}

function OrderConfirmationInner() {
  const searchParams = useSearchParams();
  const { showMessage } = useStoreToast();
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrder() {
      // الرمز بيجي من ?id (بعد تأكيد الطلب) أو ?token (لينك قديم)
      let token = searchParams.get("id") || searchParams.get("token") || "";

      // بعدين من sessionStorage اللي بيكتبه placeOrderAsync
      if (!token) token = readLastOrder()?.accessToken ?? "";

      if (token) {
        try {
          const res = await fetch(`/api/orders/${encodeURIComponent(token)}`);
          const d = await res.json();
          if (d.success) {
            setOrder(d.data as PublicOrder);
            setLoading(false);
            return;
          }
        } catch {
          /* نجرب النسخة المحلية تحت */
        }
      }

      // آخر حل: الطلب المحلي المحفوظ في localStorage (شغال حتى لو السيرفر غير متاح)
      const local = readCurrentOrder();
      if (local) {
        setOrder(fromLocalOrder(local));
        setError("");
      } else {
        setError("لم يتم العثور على بيانات الطلب");
      }
      setLoading(false);
    }
    loadOrder();
  }, [searchParams]);

  /* تحويل إحداثيات GPS لعنوان مقروء بدل إظهار أرقام الإحداثيات */
  useEffect(() => {
    if (!order) return;
    const { lat, lng } = order.customer;
    if (typeof lat !== "number" || typeof lng !== "number") return;
    let cancelled = false;
    reverseGeocode(lat, lng)
      .then((text) => { if (!cancelled) setResolvedAddress(text); })
      .catch(() => {
        if (!cancelled) showMessage("العنوان المدخل معروض كما هو — تعذّر تحسينه من الموقع.", "warning");
      });
    return () => { cancelled = true; };
  }, [order, showMessage]);

  const handleCopy = async () => {
    if (!order) return;
    try {
      await navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      showMessage("تم نسخ رقم الطلب");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      showMessage("تعذّر نسخ رقم الطلب", "error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-page-background)] flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-[var(--color-primary)] animate-spin" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[var(--color-page-background)] flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="h-16 w-16 rounded-2xl bg-[var(--color-page-background)] text-[var(--color-primary)] flex items-center justify-center">
          <ShoppingBag className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-white">{error || "لم يتم العثور على الطلب"}</h2>
        <p className="text-sm text-[var(--color-text-secondary)] max-w-xs">يبدو أن الطلب غير موجود أو انتهت صلاحية الرابط.</p>
        <Link href="/" className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-bold text-white hover:bg-[var(--color-primary-hover)] transition-colors">
          <span>العودة للرئيسية</span><ArrowLeft className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  const isDelivered = order.orderStatus === "delivered";
  const isCancelled = order.orderStatus === "cancelled";

  return (
    <div className="min-h-screen bg-[var(--color-page-background)] py-8 sm:py-12" dir="rtl">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 space-y-5">

        {/* شريط الحالة — خلفية خضراء ثابتة ونصوص بيضاء في كل الحالات */}
        <div className={`flex items-start gap-3 rounded-2xl border p-4 bg-[var(--color-icon)] ${
          isCancelled ? "border-[#7B4C48]" : "border-[var(--color-primary-border)]"
        }`}>
          {isDelivered
            ? <CheckCircle2 className="h-7 w-7 text-[var(--color-text-on-primary)] shrink-0" />
            : <Clock className="h-7 w-7 text-[var(--color-text-on-primary)] shrink-0" />}
          <div className="min-w-0 flex-1">
            <h1 className="text-base sm:text-lg font-black text-[var(--color-text-on-primary)]">
              {isDelivered ? "تم تسليم طلبك!" :
               isCancelled ? "تم إلغاء الطلب" :
               "طلبك في الطريق إليك"}
            </h1>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--color-text-on-primary)]/85 mt-1">
              <span className="text-[var(--color-text-on-primary)]/85">رقم الطلب:</span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-surface-elevated)]/15 px-2 py-0.5">
                <span className="font-mono font-bold text-[var(--color-text-on-primary)] tracking-wider select-all">#{order.orderNumber}</span>
                <button type="button" onClick={handleCopy} aria-label="نسخ رقم الطلب"
                  className="text-[var(--color-text-on-primary)]/80 hover:text-[var(--color-text-on-primary)] transition-colors">
                  {copied ? <Check className="h-3.5 w-3.5 text-[var(--color-text-on-primary)]" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </span>
              <span className="text-[var(--color-text-on-primary)]/85">{formatDate(order.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* ملخص الطلب */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-page-background)] overflow-hidden">
          <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-[var(--color-border)]">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-[var(--color-primary)]" />ملخص الطلب
            </h2>
            <span className="text-xs text-[var(--color-text-secondary)]">
              {order.items.reduce((acc, i) => acc + i.quantity, 0)} وجبات
            </span>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 px-4 sm:px-5 py-3.5">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[var(--color-page-background)] border border-[var(--color-border)]">
                  <Image src={item.productImage || "/images/logo-rosemary-green.png"} alt={item.productName} fill sizes="56px" className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{item.productName}</p>
                  {item.selectedSize && <p className="text-[11px] text-[var(--color-primary)] mt-0.5">الحجم: {item.selectedSize.name}</p>}
                  {item.notes && <p className="text-[11px] text-[var(--color-primary)] mt-0.5">ملاحظة: {item.notes}</p>}
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{item.quantity} × {item.unitPrice} ج.م</p>
                </div>
                <span className="text-sm font-black text-[var(--color-primary)] shrink-0">{item.itemTotal} ج.م</span>
              </div>
            ))}
          </div>
          <div className="px-4 sm:px-5 py-4 bg-[var(--color-page-background)] border-t border-[var(--color-border)] space-y-2">
            <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
              <span>المجموع الفرعي</span>
              <span className="font-bold text-white">{order.subtotal} ج.م</span>
            </div>
            <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
              <span>التوصيل</span>
              <span className="font-bold text-[var(--color-icon)]">
                {order.deliveryFee > 0 ? `${order.deliveryFee} ج.م` : "مجاني"}
              </span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
                <span>الخصم</span>
                <span className="font-bold text-[var(--color-icon)]">-{order.discount} ج.م</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-black text-white pt-2 border-t border-[var(--color-border)]">
              <span>الإجمالي النهائي</span>
              <span className="text-[var(--color-primary)] text-base">{order.total} ج.م</span>
            </div>
          </div>
        </div>

        {/* بيانات التوصيل */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-page-background)] overflow-hidden">
          <div className="px-4 sm:px-5 py-3.5 border-b border-[var(--color-border)]">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <User className="h-4 w-4 text-[var(--color-primary)]" />بيانات التوصيل
            </h2>
          </div>
          <div className="p-4 sm:p-5 space-y-3">
            <InfoRow icon={User}      label="الاسم"    value={order.customer.name} />
            <InfoRow icon={Phone}     label="الهاتف"   value={order.customer.phone} />
            <InfoRow icon={MapPin}    label="العنوان"  value={resolvedAddress ?? order.customer.address} />
            {order.customer.areaName && <InfoRow icon={Truck} label="مكان التوصيل" value={order.customer.areaName} />}
            {order.customer.notes && <InfoRow icon={StickyNote} label="ملاحظات" value={order.customer.notes} />}
          </div>
        </div>

        {/* رسالة النجاح */}
        {!isCancelled && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/8 p-5 text-center space-y-3">
            <div className="mx-auto h-14 w-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-base font-black text-white mb-1">تم تأكيد طلبك بنجاح!</h3>
              <p className="inline-flex flex-wrap items-center justify-center gap-1.5 text-xs text-[var(--color-text-muted)]">
                فريق روزماري بيجهّز وجبتك بكل حب. التوصيل خلال {" "}
                <span className="text-[var(--color-primary)] font-bold">30-45 دقيقة</span>
                <Truck className="h-3.5 w-3.5 shrink-0 text-[var(--color-primary)]" />
              </p>
            </div>
            <div className="flex flex-col items-center justify-center gap-2.5 sm:flex-row">
              <Link href="/" className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-600 transition-colors">
                <span>العودة للرئيسية</span><ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}

        <Link href="/menu" className="flex items-center justify-center gap-2 py-3 text-sm font-semibold text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors">
          <ShoppingBag className="h-4 w-4" /><span>تصفح باقي الوجبات</span>
        </Link>
      </div>
    </div>
  );
}

export default function OrderConfirmationPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--color-page-background)] flex items-center justify-center"><Loader2 className="h-10 w-10 text-[var(--color-primary)] animate-spin" /></div>}>
      <OrderConfirmationInner />
    </Suspense>
  );
}
