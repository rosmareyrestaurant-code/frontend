"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Banknote, CheckCircle2, ChevronLeft, ClipboardList, Clock3, Globe2,
  Loader2, MapPin, ReceiptText, RefreshCw, ShoppingBag, X, XCircle,
} from "lucide-react";
import { addMyOrderRef, readLastOrder, readMyOrderRefs } from "@/lib/clientStorage";
import type { PublicOrder } from "@/types";

const PAYMENT_LABELS: Record<PublicOrder["paymentMethod"], string> = {
  cash: "كاش عند الاستلام",
  vodafone_cash: "فودافون كاش",
  instapay: "إنستاباي",
};

function isOnline(order: PublicOrder) {
  return order.paymentMethod !== "cash";
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function isVerified(order: PublicOrder) {
  return order.paymentStatus === "verified" || order.paymentStatus === "paid";
}

function PaymentTypeChip({ order }: { order: PublicOrder }) {
  if (isOnline(order)) {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-[#EBD2B6] bg-[#FBEFE1] px-2.5 py-1 text-[10.5px] font-black tracking-wide text-[#9A5B1E]">
        <Globe2 className="h-3 w-3" /> ONLINE
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-[var(--color-primary-soft)] bg-[var(--color-primary-soft)] px-2.5 py-1 text-[10.5px] font-black tracking-wide text-[var(--color-primary)]">
      <Banknote className="h-3 w-3" /> CASH
    </span>
  );
}

function PaymentStatusChip({ order }: { order: PublicOrder }) {
  if (!isOnline(order)) {
    return (
      <span className="inline-flex items-center whitespace-nowrap rounded-full bg-[var(--color-border-subtle)] px-2.5 py-1 text-[10.5px] font-bold text-[var(--color-text-secondary)]">
        نقدي عند الاستلام
      </span>
    );
  }
  if (isVerified(order)) {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[var(--color-primary-soft)] px-2.5 py-1 text-[10.5px] font-bold text-[#4F8A57]">
        <CheckCircle2 className="h-3 w-3" /> مدفوع مؤكد
      </span>
    );
  }
  if (order.paymentStatus === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#FAE4E0] px-2.5 py-1 text-[10.5px] font-bold text-[#B45243]">
        <XCircle className="h-3 w-3" /> تحويل مرفوض
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#FEF3D9] px-2.5 py-1 text-[10.5px] font-bold text-[#8A6414]">
      <Clock3 className="h-3 w-3" /> بانتظار التحقق
    </span>
  );
}

function OrderStatusChip({ order }: { order: PublicOrder }) {
  if (order.orderStatus === "cancelled") {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#FAE4E0] px-2.5 py-1 text-[10.5px] font-bold text-[#B45243]">
        <XCircle className="h-3 w-3" /> ملغي
      </span>
    );
  }
  if (order.orderStatus === "delivered") {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[var(--color-primary-soft)] px-2.5 py-1 text-[10.5px] font-bold text-[#4F8A57]">
        <CheckCircle2 className="h-3 w-3" /> تم التسليم
      </span>
    );
  }
  return null;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 text-[12px]">
      <span className="shrink-0 font-semibold text-[var(--color-text-secondary)]">{label}</span>
      <span className="min-w-0 break-words text-left font-bold text-[var(--color-text-primary)]">{value}</span>
    </div>
  );
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<PublicOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [activeOrder, setActiveOrder] = useState<PublicOrder | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      setLoading(true);
      setError("");

      // سجل الرموز المحفوظ على المتصفح — الرمز نفسه هو إثبات الملكية
      const refs = [...readMyOrderRefs()];

      // ترحيل آخر طلب من الجلسة الحالية لو مش متسجل في السجل الدائم
      const last = readLastOrder();
      if (last?.accessToken && !refs.some((r) => r.accessToken === last.accessToken)) {
        refs.unshift({
          orderNumber: last.orderNumber,
          accessToken: last.accessToken,
          createdAt: new Date().toISOString(),
        });
        addMyOrderRef({
          orderNumber: last.orderNumber,
          accessToken: last.accessToken,
          createdAt: new Date().toISOString(),
        });
      }

      if (!refs.length) {
        if (!cancelled) {
          setOrders([]);
          setLoading(false);
        }
        return;
      }

      const results = await Promise.all(
        refs.map(async (ref) => {
          try {
            const res = await fetch(`/api/orders/${encodeURIComponent(ref.accessToken)}`, {
              cache: "no-store",
            });
            if (!res.ok) return null;
            const data = await res.json();
            return data.success ? (data.data as PublicOrder) : null;
          } catch {
            return null;
          }
        }),
      );

      if (cancelled) return;

      const fetched = results.filter((o): o is PublicOrder => !!o);
      fetched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setOrders(fetched);
      if (!fetched.length) {
        setError("تعذّر تحميل طلباتك — تأكد من الاتصال وحاول تاني.");
      }
      setLoading(false);
    }

    void loadOrders();
    return () => { cancelled = true; };
  }, [reloadKey]);

  useEffect(() => {
    if (!activeOrder) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveOrder(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activeOrder]);

  return (
    <main className="min-h-[70vh] bg-[var(--color-page-background)] py-8 sm:py-12">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--color-primary-soft)] bg-[var(--color-primary-soft)] text-[var(--color-icon)]">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black text-[var(--color-text-primary)]">طلباتي السابقة</h1>
            <p className="mt-1 text-[12px] sm:text-[13px] font-semibold leading-relaxed text-[var(--color-text-secondary)]">
              بتظهر هنا الطلبات اللي اتعملت من المتصفح ده — للعرض فقط.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="mt-10 flex flex-col items-center justify-center gap-3 py-16">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--color-icon)]" />
            <p className="text-[12px] font-semibold text-[var(--color-text-secondary)]">بنحمّل طلباتك...</p>
          </div>
        ) : error ? (
          <div className="mt-8 rounded-2xl border border-[#E7C6C0] bg-[#FBF0ED] p-6 text-center">
            <XCircle className="mx-auto h-8 w-8 text-[#B45243]" />
            <p className="mt-3 text-[13px] font-bold text-[#B45243]">{error}</p>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-primary-soft)] bg-[var(--color-surface-elevated)] px-4 py-2 text-[12px] font-bold text-[var(--color-icon)] transition-colors hover:bg-[var(--color-primary-soft)]"
            >
              <RefreshCw className="h-3.5 w-3.5" /> إعادة المحاولة
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[var(--color-primary-soft)] bg-[var(--color-primary-soft)] text-[var(--color-icon)]">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-base font-black text-[var(--color-text-primary)]">مافيش طلبات سابقة</h2>
            <p className="mx-auto mt-1.5 max-w-xs text-[12px] font-semibold leading-relaxed text-[var(--color-text-secondary)]">
              أول ما تعمل طلب من الجهاز ده هيتسجل هنا وتقدر ترجع تشوف تفاصيله في أي وقت.
            </p>
            <Link
              href="/menu"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--color-icon)] px-5 py-2.5 text-[12px] font-bold text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-primary-hover)]"
            >
              <ShoppingBag className="h-4 w-4" /> تصفح المنيو
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {orders.map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => setActiveOrder(order)}
                className="block w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-right transition-colors hover:border-[var(--color-primary-border)] hover:bg-[var(--color-surface-elevated)] sm:p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[12.5px] font-black text-[var(--color-text-primary)]" dir="ltr">
                      #{order.orderNumber}
                    </span>
                    <OrderStatusChip order={order} />
                  </div>
                  <span className="text-[11px] font-medium text-[var(--color-text-muted)]">{formatDate(order.createdAt)}</span>
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <PaymentTypeChip order={order} />
                  <span className="text-[10.5px] font-semibold text-[var(--color-text-muted)]">
                    {PAYMENT_LABELS[order.paymentMethod]}
                  </span>
                  <PaymentStatusChip order={order} />
                </div>

                <div className="mt-3 space-y-1 border-t border-[var(--color-border)] pt-2.5">
                  {order.items.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-3 text-[11.5px]">
                      <span className="min-w-0 truncate font-semibold text-[var(--color-text-secondary)]">
                        {item.quantity} × {item.productName}
                      </span>
                      <span className="shrink-0 font-bold text-[var(--color-text-primary)]">{item.itemTotal} ج.م</span>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <p className="text-[10.5px] font-semibold text-[var(--color-text-muted)]">
                      + {order.items.length - 3} أصناف تانية
                    </p>
                  )}
                  {!order.items.length && (
                    <p className="text-[11px] font-semibold text-[var(--color-text-muted)]">بدون أصناف مسجلة</p>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-[var(--color-border)] pt-2.5">
                  <span className="text-[13px] font-black text-[var(--color-text-primary)]">
                    الإجمالي: {order.total} ج.م
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--color-icon)]">
                    عرض التفاصيل <ChevronLeft className="h-3.5 w-3.5" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {activeOrder && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-[var(--color-text-primary)]/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setActiveOrder(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`تفاصيل الطلب ${activeOrder.orderNumber}`}
        >
          <div
            className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-[var(--color-border)] bg-[var(--color-surface)] sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3.5 sm:px-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-mono text-[13px] font-black text-[var(--color-text-primary)]" dir="ltr">
                    #{activeOrder.orderNumber}
                  </h2>
                  <OrderStatusChip order={activeOrder} />
                </div>
                <p className="mt-1 text-[11px] font-medium text-[var(--color-text-muted)]">
                  {formatDate(activeOrder.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveOrder(null)}
                aria-label="إغلاق"
                className="icon-close flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-elevated)] transition-colors hover:bg-[var(--color-surface-secondary)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  <PaymentTypeChip order={activeOrder} />
                  <span className="text-[11px] font-bold text-[var(--color-text-secondary)]">
                    {PAYMENT_LABELS[activeOrder.paymentMethod]}
                  </span>
                  <PaymentStatusChip order={activeOrder} />
                </div>
                {isOnline(activeOrder) && activeOrder.transactionReference && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <span className="text-[10.5px] font-semibold text-[var(--color-text-secondary)]">مرجع التحويل:</span>
                    <span
                      dir="ltr"
                      className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-elevated)] px-2.5 py-1 font-mono text-[12px] font-black text-[var(--color-text-primary)]"
                    >
                      {activeOrder.transactionReference}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-black tracking-wide text-[var(--color-icon)]">
                  <ReceiptText className="h-3.5 w-3.5" /> الأصناف
                </h3>
                <div className="divide-y divide-[var(--color-border)] overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)]">
                  {activeOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
                        <Image
                          src={item.productImage || "/images/logo-rosemary-green.png"}
                          alt={item.productName}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[12.5px] font-bold text-[var(--color-text-primary)]">{item.productName}</p>
                        {item.selectedSize && (
                          <p className="mt-0.5 text-[10.5px] font-semibold text-[var(--color-icon)]">
                            الحجم: {item.selectedSize.name}
                          </p>
                        )}
                        {!!item.selectedAddons?.length && (
                          <p className="mt-0.5 text-[10.5px] font-semibold text-[var(--color-icon)]">
                            الإضافات: {item.selectedAddons.map((a) => a.name).join(" + ")}
                          </p>
                        )}
                        {item.notes && (
                          <p className="mt-0.5 text-[10.5px] font-medium text-[var(--color-text-muted)]">
                            ملاحظة: {item.notes}
                          </p>
                        )}
                        <p className="mt-1 text-[10.5px] font-semibold text-[var(--color-text-secondary)]">
                          {item.quantity} × {item.unitPrice} ج.م
                        </p>
                      </div>
                      <span className="shrink-0 text-[12px] font-black text-[var(--color-text-primary)]">
                        {item.itemTotal} ج.م
                      </span>
                    </div>
                  ))}
                  {!activeOrder.items.length && (
                    <p className="p-4 text-center text-[11.5px] font-semibold text-[var(--color-text-muted)]">
                      بدون أصناف مسجلة
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-3.5">
                <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-black tracking-wide text-[var(--color-icon)]">
                  <MapPin className="h-3.5 w-3.5" /> بيانات التوصيل
                </h3>
                <div className="space-y-1.5">
                  <DetailRow label="الاسم" value={activeOrder.customer.name} />
                  <DetailRow label="الهاتف" value={activeOrder.customer.phone} />
                  <DetailRow label="العنوان" value={activeOrder.customer.address} />
                  {activeOrder.customer.areaName && (
                    <DetailRow label="مكان التوصيل" value={activeOrder.customer.areaName} />
                  )}
                  {activeOrder.customer.notes && (
                    <DetailRow label="ملاحظات" value={activeOrder.customer.notes} />
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] p-3.5">
                <h3 className="mb-2 text-[11px] font-black tracking-wide text-[var(--color-icon)]">الحساب</h3>
                <div className="space-y-1.5">
                  <DetailRow label="قيمة المنتجات" value={`${activeOrder.subtotal} ج.م`} />
                  <DetailRow
                    label="رسوم التوصيل"
                    value={activeOrder.deliveryFee > 0 ? `${activeOrder.deliveryFee} ج.م` : "مجاني"}
                  />
                  {activeOrder.discount > 0 && (
                    <DetailRow label="الخصم" value={`-${activeOrder.discount} ج.م`} />
                  )}
                  <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-2 text-[13px]">
                    <span className="font-black text-[var(--color-text-primary)]">الإجمالي النهائي</span>
                    <span className="font-black text-[var(--color-icon)]">{activeOrder.total} ج.م</span>
                  </div>
                </div>
              </div>

              <p className="pb-1 text-center text-[10.5px] font-medium leading-relaxed text-[var(--color-text-muted)]">
                الصفحة للعرض فقط — لو محتاج تعدّل أو تلغي الطلب تواصل مع المطعم.
              </p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
