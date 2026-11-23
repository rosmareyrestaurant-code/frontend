"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import {
  Search, Phone, MapPin, Copy, ChevronDown, ShoppingBag, X, Loader2, Download, Printer,
  CheckCircle2, XCircle, Clock3, ShieldCheck, ShieldAlert, AlertTriangle, RotateCcw,
  Banknote, Globe2,
} from "lucide-react";
import { printOrderFromQueue, PRINT_STATE_EVENT } from "@/lib/print-queue-client";
import {
  awaitingPaymentReview,
  isOnlinePaymentMethod,
  isPaymentVerified,
} from "@/lib/payment-review";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { Modal } from "@/components/admin/shared/Modal";
import { EmptyState } from "@/components/admin/shared/EmptyState";
import { Pagination } from "@/components/admin/shared/Pagination";
import { useToast } from "@/components/admin/shared/Toast";
import { PaymentMethodIcon } from "@/components/common/PaymentBrandIcons";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { NEW_ORDERS_EVENT } from "@/hooks/useNewOrders";
import { useAutoPrintSetting } from "@/hooks/useAutoPrintOrders";
import { AdminOrder, OrderStatus, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@/types/admin";

// Mock data — مفعّلة مؤقتاً للتيست (رجّع تعليقها وشغّل الـ API بعد الانتهاء)
import { MOCK_ORDERS } from "@/data/admin/orders";

const USE_MOCK = false; // الموك معطّل — الواجهة متصلة بالـ API

const ALL_STATUSES: OrderStatus[] = ["pending", "delivered", "cancelled"];
const PER_PAGE = 6;

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("ar-EG", {
    year: "numeric", month: "short", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}

/** الطلبات الجديدة خلال آخر 15 دقيقة — تمييز بصري للكاشير */
const NEW_ORDER_WINDOW_MS = 15 * 60 * 1000;
function isNewOrder(order: AdminOrder) {
  return (
    order.status === "pending" &&
    Date.now() - new Date(order.createdAt).getTime() < NEW_ORDER_WINDOW_MS
  );
}

/** نوع الدفع CASH/ONLINE — منفصل تماماً عن حالة الدفع */
function PaymentTypeChip({ order }: { order: AdminOrder }) {
  if (isOnlinePaymentMethod(order.paymentMethod)) {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-[#F0D3B4] bg-[#FFF1E3] px-2.5 py-1 text-[10.5px] font-black tracking-wide text-[#B9691F]">
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

/** حالة الدفع — مستقلة عن نوع الدفع وعن حالة الطباعة */
function PaymentStatusChip({ order }: { order: AdminOrder }) {
  if (!isOnlinePaymentMethod(order.paymentMethod)) {
    return (
      <span className="inline-flex items-center whitespace-nowrap rounded-full bg-[var(--color-border-subtle)] px-2.5 py-1 text-[10.5px] font-bold text-[var(--color-text-muted)]">
        نقدي
      </span>
    );
  }
  if (isPaymentVerified(order.paymentStatus)) {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[var(--color-primary-soft)] px-2.5 py-1 text-[10.5px] font-bold text-[#4F8A57]">
        <CheckCircle2 className="h-3 w-3" /> مدفوع مؤكد
      </span>
    );
  }
  if (order.paymentStatus === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#FAE4E0] px-2.5 py-1 text-[10.5px] font-bold text-[#C25B4F]">
        <XCircle className="h-3 w-3" /> تحويل مرفوض
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#FEF3D9] px-2.5 py-1 text-[10.5px] font-bold text-[#B98A2C]">
      <Clock3 className="h-3 w-3" /> بانتظار التحقق
    </span>
  );
}

/** خانة الدفع في الجدول: النوع + الطريقة + الحالة + مرجع التحويل بدون فتح المودال */
function PaymentCell({ order }: { order: AdminOrder }) {
  const online = isOnlinePaymentMethod(order.paymentMethod);
  return (
    <div className="flex min-w-[150px] flex-col items-start gap-1">
      <div className="flex items-center gap-1.5">
        <PaymentTypeChip order={order} />
        <span className="text-[10px] font-semibold text-[var(--color-text-muted)]">
          {PAYMENT_METHOD_LABELS[order.paymentMethod] ?? "كاش"}
        </span>
      </div>
      <PaymentStatusChip order={order} />
      {online && (
        <p className="text-[10px] font-medium text-[var(--color-text-muted)]">
          مرجع:{" "}
          <span
            dir="ltr"
            className={`font-black ${order.transactionReference ? "text-[var(--color-text-primary)]" : "text-[var(--color-text-muted)]"}`}
          >
            {order.transactionReference || "—"}
          </span>
        </p>
      )}
    </div>
  );
}

/** شارة حالة الطباعة من الطابور — مستقلة عن حالة الدفع */
function PrintBadge({ order }: { order: AdminOrder }) {
  if (order.status === "cancelled" && order.printState !== "printed") {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[var(--color-border-subtle)] px-2.5 py-1 text-[10.5px] font-bold text-[var(--color-text-muted)]">
        <XCircle className="h-3 w-3" /> موقوف — الطلب ملغي
      </span>
    );
  }
  switch (order.printState) {
    case "pending":
      return (
        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#FEF3D9] px-2.5 py-1 text-[10.5px] font-bold text-[#B98A2C]">
          <Clock3 className="h-3 w-3" /> بانتظار الطباعة
        </span>
      );
    case "processing":
      return (
        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#E7EEF6] px-2.5 py-1 text-[10.5px] font-bold text-[#4C6E91]">
          <Loader2 className="h-3 w-3 animate-spin" /> جارٍ الطباعة
        </span>
      );
    case "printed":
      return (
        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[var(--color-primary-soft)] px-2.5 py-1 text-[10.5px] font-bold text-[#4F8A57]">
          <CheckCircle2 className="h-3 w-3" /> تمت الطباعة
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#FAE4E0] px-2.5 py-1 text-[10.5px] font-bold text-[#C25B4F]">
          <AlertTriangle className="h-3 w-3" /> فشلت الطباعة
        </span>
      );
    default:
      return <span className="text-[11px] font-medium text-[var(--color-text-muted)]">—</span>;
  }
}

export default function OrdersPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [page, setPage] = useState(1);
  const loadedOnce = useRef(false);
  const autoPrint = useAutoPrintSetting();

  // مراجعة الدفع — للمدير فقط (الخادم يرفض الكاشير حتى لو حاول)
  const [role, setRole] = useState("");
  const [paymentAction, setPaymentAction] = useState<"verify" | "reject" | null>(null);
  const [txnRef, setTxnRef] = useState("");
  const [receivedAmount, setReceivedAmount] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  // حالة الطباعة في الواجهة — طلب واحد بيتطبع في الوقت الواحد
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [printError, setPrintError] = useState("");
  const printRefreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/admin/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d?.success) setRole(d.data.role); })
      .catch(() => {});
  }, []);

  const fetchOrders = useCallback(async () => {
    if (USE_MOCK) {
      const q = debouncedSearch.trim().toLowerCase();
      const filtered = MOCK_ORDERS.filter((o) =>
        (statusFilter === "all" || o.status === statusFilter) &&
        (!q || o.orderNumber?.toLowerCase().includes(q) || o.customerName.includes(debouncedSearch.trim()) || o.customerPhone.includes(q))
      );
      setOrders(filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE));
      setTotal(filtered.length);
      setLoading(false);
      loadedOnce.current = true;
      return;
    }
    if (loadedOnce.current) setRefreshing(true);
    else setLoading(true);
    try {
      const sp = new URLSearchParams({ page: String(page), limit: String(PER_PAGE) });
      if (debouncedSearch) sp.set("q", debouncedSearch);
      if (statusFilter !== "all") sp.set("status", statusFilter);
      const res = await fetch(`/api/admin/orders?${sp}`);
      const d = await res.json();
      if (d.success) {
        setOrders(d.data.orders);
        setTotal(d.data.pagination.total);
        // لو التفاصيل مفتوحة، نحدّث حالتها من نفس نتيجة الجدول
        setSelectedOrder((prev) =>
          prev
            ? ((d.data.orders as AdminOrder[]).find((o) => o.id === prev.id) ?? prev)
            : null,
        );
      } else {
        showToast(d.error?.message ?? "فشل تحميل الطلبات", "error");
      }
    } catch {
      showToast("تعذّر الاتصال بالخادم", "error");
    } finally {
      loadedOnce.current = true;
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, debouncedSearch, statusFilter, showToast]);

  useEffect(() => { queueMicrotask(() => { void fetchOrders(); }); }, [fetchOrders]);

  // طلب جديد وصل من جرس الإشعارات — نحدّث الجدول بهدوء
  useEffect(() => {
    const onNewOrders = () => { void fetchOrders(); };
    window.addEventListener(NEW_ORDERS_EVENT, onNewOrders);
    return () => window.removeEventListener(NEW_ORDERS_EVENT, onNewOrders);
  }, [fetchOrders]);

  // الطباعة التلقائية/اليدوية بتحدّث حالة الطالب — نحدّث الجدول بعد آخر تغيير
  useEffect(() => {
    const onPrintState = () => {
      if (printRefreshTimer.current) clearTimeout(printRefreshTimer.current);
      printRefreshTimer.current = setTimeout(() => { void fetchOrders(); }, 350);
    };
    window.addEventListener(PRINT_STATE_EVENT, onPrintState);
    return () => {
      window.removeEventListener(PRINT_STATE_EVENT, onPrintState);
      if (printRefreshTimer.current) clearTimeout(printRefreshTimer.current);
    };
  }, [fetchOrders]);

  const totalPages = Math.ceil(total / PER_PAGE);

  const exportParams = new URLSearchParams();
  if (debouncedSearch) exportParams.set("q", debouncedSearch);
  if (statusFilter !== "all") exportParams.set("status", statusFilter);
  const exportHref = `/api/admin/orders/export${exportParams.toString() ? `?${exportParams}` : ""}`;

  const changeStatus = async (orderId: string, status: OrderStatus) => {
    if (
      status === "cancelled" &&
      !window.confirm(
        "إلغاء الطلب نهائياً؟ الطلب الملغي مش هيتطبع تلقائياً ومش هيتسلّم للمطبخ.",
      )
    ) {
      return;
    }
    if (USE_MOCK) {
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
      if (selectedOrder?.id === orderId) setSelectedOrder((prev) => prev ? { ...prev, status } : null);
      showToast(`تم تحديث الحالة: ${ORDER_STATUS_LABELS[status]}`, "success");
      return;
    }
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const d = await res.json();
      if (d.success) {
        setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status } : o));
        if (selectedOrder?.id === orderId) setSelectedOrder((prev) => prev ? { ...prev, status } : null);
        showToast(`تم تحديث الحالة: ${ORDER_STATUS_LABELS[status]}`, "success");
      } else {
        showToast(d.error?.message ?? "فشل تحديث الحالة", "error");
      }
    } catch {
      showToast("خطأ في الاتصال", "error");
    }
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => showToast(`تم نسخ ${label}`, "success"));
  };

  const closeOrderModal = () => {
    setSelectedOrder(null);
    setPaymentAction(null);
    setPaymentError("");
    setPrintError("");
  };

  /** كل الطباعة بتمر من الطابور — حجز ذري + نتيجة مؤكدة + تسجيل على السيرفر */
  const runPrint = async (order: AdminOrder, manual: boolean) => {
    if (printingId) {
      showToast("فيه إيصال بيتطبع بالفعل — استنى ثواني", "warning");
      return;
    }
    if (order.status === "cancelled") {
      showToast("الطلب ملغي — مينفعش يتطبع", "warning");
      return;
    }
    setPrintingId(order.id);
    setPrintError("");
    try {
      const result = await printOrderFromQueue(order.id, manual);
      if (result.order) {
        const updated = result.order;
        setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
        setSelectedOrder((prev) => (prev && prev.id === updated.id ? updated : prev));
      }
      if (result.status === "printed") {
        showToast(manual ? "تم إرسال الإيصال للطابعة" : "تمت طباعة الطلب", "success");
      } else if (result.status === "failed") {
        const message = result.message ?? "فشلت الطباعة";
        setPrintError(message);
        showToast(message, "error");
      } else {
        showToast(result.message ?? "تعذّرت الطباعة", "warning");
      }
    } catch {
      showToast("تعذّر الاتصال بالخادم", "error");
    } finally {
      setPrintingId(null);
      void fetchOrders();
    }
  };

  const openVerifyPanel = (order: AdminOrder) => {
    // نبدأ برقم المرجع اللي العميل كتبه (لو موجود) — المدير يقدر يعدّله
    setTxnRef(order.transactionReference ?? "");
    setReceivedAmount(String(order.total));
    setPaymentError("");
    setPaymentAction("verify");
  };

  const openRejectPanel = () => {
    setRejectReason("");
    setPaymentError("");
    setPaymentAction("reject");
  };

  const amountMatches = selectedOrder
    ? Math.round(Number(receivedAmount) * 100) === Math.round(selectedOrder.total * 100)
    : false;

  const submitPaymentAction = async () => {
    if (!selectedOrder || !paymentAction) return;
    setPaymentSaving(true);
    setPaymentError("");
    try {
      const body = paymentAction === "verify"
        ? { action: "verify", transactionReference: txnRef.trim(), amount: Number(receivedAmount) }
        : { action: "reject", reason: rejectReason.trim() };
      const res = await fetch(`/api/admin/orders/${selectedOrder.id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!d.success) {
        setPaymentError(d.error?.message ?? "تعذّر تنفيذ العملية");
        return;
      }
      const updated = d.data as AdminOrder;
      setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
      setSelectedOrder(updated);
      setPaymentAction(null);
      showToast(d.message ?? "تم تحديث حالة الدفع", "success");
    } catch {
      setPaymentError("تعذّر الاتصال بالخادم");
    } finally {
      setPaymentSaving(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* البحث والفلترة */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input type="text" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="ابحث برقم الطلب أو الاسم أو الهاتف..."
            className="w-full rounded-full border border-[var(--color-control-border)] bg-[var(--color-surface)] py-2.5 pe-4 ps-10 text-[13px] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] transition-colors focus:border-[var(--color-primary-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-border)]/20" />
          {search && <button onClick={() => setSearch("")} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary)]" aria-label="مسح البحث"><X className="h-3.5 w-3.5" /></button>}
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as OrderStatus | "all"); setPage(1); }}
            className="w-full min-w-[170px] appearance-none rounded-full border border-[var(--color-control-border)] bg-[var(--color-surface)] py-2.5 pe-4 ps-10 text-[13px] font-semibold text-[var(--color-text-primary)] focus:border-[var(--color-primary-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-border)]/20">
            <option value="all">كل الحالات</option>
            {ALL_STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-muted)]" />
        </div>
      </div>

      {/* جدول الطلبات */}
      <div className="overflow-hidden rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-4">
          <h2 className="flex items-center gap-2 text-[15px] font-black text-[var(--color-text-primary)]">
            الطلبات <span className="text-[12px] font-bold text-[var(--color-text-muted)]">({total})</span>
            {refreshing && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--color-text-muted)]">
                <Loader2 className="h-3 w-3 animate-spin" /> تحديث
              </span>
            )}
          </h2>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={autoPrint.toggle}
              aria-pressed={autoPrint.enabled}
              title="لما يتفعّل، كل طلب جديد يوصّل هيتطبع تلقائياً على الطابعة الافتراضية للجهاز ده"
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors ${
                autoPrint.enabled
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
              }`}
            >
              <Printer className="h-3.5 w-3.5" />
              طباعة تلقائية {autoPrint.enabled ? "مفعّلة" : "موقوفة"}
            </button>
            <a
              href={exportHref}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--color-primary-soft)] bg-[var(--color-primary-soft)] px-3 py-1.5 text-[11px] font-bold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary-soft)]"
            >
              <Download className="h-3.5 w-3.5" /> تصدير CSV
            </a>
          </div>
        </div>
        {autoPrint.enabled && (
          <p className="px-5 pb-3 text-[10.5px] font-medium leading-relaxed text-[var(--color-text-muted)]">
            الطباعة التلقائية شغالة على الجهاز ده — كل طلب جديد هيطلع على الطابعة الافتراضية (لو المتصفح سأل، اختار الطباعة مرة واحدة).
          </p>
        )}
        {loading ? (
          <div className="py-12 text-center text-[13px] text-[var(--color-text-muted)] animate-pulse">جاري التحميل...</div>
        ) : orders.length === 0 ? (
          <EmptyState icon={ShoppingBag} title="لا توجد طلبات" description="لم يتم العثور على طلبات مطابقة" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] text-right">
                <thead>
                  <tr className="bg-[var(--color-surface-secondary)] text-[11px] font-bold text-[var(--color-text-muted)]">
                    <th className="px-5 py-2.5 font-bold">رقم الطلب</th>
                    <th className="px-5 py-2.5 font-bold">العميل</th>
                    <th className="px-5 py-2.5 font-bold">الإجمالي</th>
                    <th className="px-5 py-2.5 font-bold">الدفع والمرجع</th>
                    <th className="px-5 py-2.5 font-bold">الطباعة</th>
                    <th className="px-5 py-2.5 font-bold">حالة الطلب</th>
                    <th className="px-5 py-2.5 font-bold">التاريخ</th>
                    <th className="px-5 py-2.5 font-bold">تفاصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-subtle)]">
                  {orders.map((order) => (
                    <tr key={order.id} onClick={() => setSelectedOrder(order)}
                      tabIndex={0} role="button"
                      className={`cursor-pointer text-[12px] transition-colors hover:bg-[var(--color-surface-soft)] focus:outline-none focus-visible:bg-[var(--color-surface-soft)] ${
                        isNewOrder(order) ? "bg-[var(--color-surface)]" : ""
                      }`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-[var(--color-text-primary)]" dir="ltr">#{order.orderNumber}</span>
                          {isNewOrder(order) && (
                            <span className="inline-flex whitespace-nowrap rounded-full bg-[#FCE8D8] px-2 py-0.5 text-[9.5px] font-black text-[#B9691F]">
                              جديد
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-[var(--color-text-primary)]">{order.customerName}</p>
                        <p className="text-[11px] text-[var(--color-text-muted)]" dir="ltr">{order.customerPhone}</p>
                      </td>
                      <td className="px-5 py-3.5 font-black text-[var(--color-text-primary)]">{order.total} ج.م</td>
                      <td className="px-5 py-3.5"><PaymentCell order={order} /></td>
                      <td className="px-5 py-3.5"><PrintBadge order={order} /></td>
                      <td className="px-5 py-3.5"><StatusBadge status={order.status} /></td>
                      <td className="px-5 py-3.5 text-[11px] font-medium text-[var(--color-text-muted)]">{formatDate(order.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
                            className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-3 py-1.5 text-[11px] font-bold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-surface-hover)]">
                            تفاصيل
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (order.status === "cancelled") {
                                showToast("الطلب ملغي — مينفعش يتطبع", "warning");
                                return;
                              }
                              if (
                                order.printState === "printed" &&
                                !window.confirm(
                                  "الإيصال مطبوع قبل كده — إعادة الطباعة ممكن تطلع إيصال مكرر. تكمل؟",
                                )
                              ) {
                                return;
                              }
                              void runPrint(order, true);
                            }}
                            disabled={
                              order.status === "cancelled" ||
                              printingId === order.id ||
                              order.printState === "processing"
                            }
                            aria-label={`طباعة إيصال الطلب #${order.orderNumber}`}
                            title={
                              order.status === "cancelled"
                                ? "الطلب ملغي — لا يمكن طباعته"
                                : order.printState === "processing"
                                  ? "جارٍ الطباعة الآن"
                                  : "طباعة الإيصال"
                            }
                            className="flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-primary)] transition-colors hover:bg-[var(--color-surface-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {printingId === order.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <Printer className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={total} itemsPerPage={PER_PAGE} />
            </div>
          </>
        )}
      </div>

      {/* Order Detail Modal */}
      <Modal isOpen={!!selectedOrder} onClose={closeOrderModal}
        title={selectedOrder ? `تفاصيل الطلب #${selectedOrder.orderNumber}` : ""} size="lg">
        {selectedOrder && (
          <div className="space-y-5">
            {/* بيانات العميل */}
            <div className="space-y-3 rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-4">
              <h3 className="text-[11px] font-black tracking-wide text-[var(--color-primary)]">بيانات العميل</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-semibold text-[var(--color-text-muted)]">الاسم</p>
                  <p className="text-[13px] font-bold text-[var(--color-text-primary)]">{selectedOrder.customerName}</p>
                </div>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-semibold text-[var(--color-text-muted)]">الهاتف</p>
                    <p className="text-[13px] font-bold text-[var(--color-text-primary)]" dir="ltr">{selectedOrder.customerPhone}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <a href={`tel:${selectedOrder.customerPhone}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[#4F8A57] transition-colors hover:bg-[var(--color-primary-soft)]">
                      <Phone className="h-3.5 w-3.5" />
                    </a>
                    <button onClick={() => copyText(selectedOrder.customerPhone, "الهاتف")}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-border-subtle)] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-border)]">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-primary)]" />
                  <p className="text-[13px] font-medium text-[var(--color-text-secondary)]">{selectedOrder.customerAddress}</p>
                </div>
                <button onClick={() => copyText(selectedOrder.customerAddress, "العنوان")}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-border-subtle)] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-border)]">
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              {selectedOrder.notes && (
                <div className="rounded-[10px] border border-[#F0E5D2] bg-[#FCF3E7] px-3 py-2">
                  <p className="text-[11px] font-semibold text-[#8A6414]"><span className="font-black">ملاحظة: </span>{selectedOrder.notes}</p>
                </div>
              )}
            </div>

            {/* الوجبات */}
            <div className="space-y-2">
              <h3 className="text-[11px] font-black tracking-wide text-[var(--color-primary)]">الوجبات المطلوبة</h3>
              {selectedOrder.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[10px] bg-[var(--color-surface-secondary)]">
                    <Image src={item.productImage || "/images/logo-rosemary-green.png"} alt={item.productName} fill className="object-cover" sizes="48px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-[var(--color-text-primary)]">{item.productName}</p>
                    {item.selectedSize && <p className="text-[11px] font-medium text-[#8A6414]">الحجم: {item.selectedSize.name}</p>}
                    {item.notes && <p className="text-[11px] font-medium text-[#8A6414]">ملاحظة: {item.notes}</p>}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[13px] font-black text-[var(--color-text-primary)]">{item.itemTotal} ج.م</p>
                    <p className="text-[11px] text-[var(--color-text-muted)]">{item.price} × {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* الإجمالي */}
            <div className="space-y-2 rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-4">
              <div className="flex justify-between text-[12px] font-semibold text-[var(--color-text-muted)]">
                <span>المجموع الفرعي</span><span className="font-bold text-[var(--color-text-primary)]">{selectedOrder.subtotal} ج.م</span>
              </div>
              {(selectedOrder.deliveryFee ?? 0) > 0 && (
                <div className="flex justify-between text-[12px] font-semibold text-[var(--color-text-muted)]">
                  <span>رسوم التوصيل</span><span className="font-bold text-[var(--color-text-primary)]">{selectedOrder.deliveryFee} ج.م</span>
                </div>
              )}
              <div className="flex justify-between border-t border-[var(--color-border)] pt-2">
                <span className="text-[13px] font-black text-[var(--color-text-primary)]">الإجمالي</span>
                <span className="text-[17px] font-black text-[var(--color-text-primary)]">{selectedOrder.total} ج.م</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-semibold text-[var(--color-text-muted)]">طريقة الدفع</span>
                <span className="flex items-center gap-1.5 text-[11.5px] font-bold text-[var(--color-text-primary)]">
                  <PaymentMethodIcon method={selectedOrder.paymentMethod} className="h-4 w-4" />
                  {PAYMENT_METHOD_LABELS[selectedOrder.paymentMethod] ?? "كاش عند الاستلام"}
                </span>
              </div>
            </div>

            {/* ─── مراجعة الدفع اليدوية (تحويل إلكتروني فقط) ─── */}
            {isOnlinePaymentMethod(selectedOrder.paymentMethod) && (
              <div className={`space-y-3 rounded-[14px] border p-4 ${
                isPaymentVerified(selectedOrder.paymentStatus)
                  ? "border-[var(--color-primary-soft)] bg-[var(--color-primary-soft)]"
                  : selectedOrder.paymentStatus === "rejected"
                    ? "border-[#F1D3CD] bg-[#FBF0ED]"
                    : "border-[#F0E0BE] bg-[#FCF6E8]"
              }`}>
                <div className="flex items-center gap-1.5">
                  <PaymentTypeChip order={selectedOrder} />
                  <PaymentStatusChip order={selectedOrder} />
                </div>
                <div className="flex items-start gap-2.5">
                  {isPaymentVerified(selectedOrder.paymentStatus) ? (
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#4F8A57]" />
                  ) : selectedOrder.paymentStatus === "rejected" ? (
                    <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#C25B4F]" />
                  ) : (
                    <Clock3 className="mt-0.5 h-5 w-5 shrink-0 text-[#B98A2C]" />
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className={`text-[12.5px] font-black ${
                      isPaymentVerified(selectedOrder.paymentStatus)
                        ? "text-[#3F7548]"
                        : selectedOrder.paymentStatus === "rejected"
                          ? "text-[#B45243]"
                          : "text-[#8A6414]"
                    }`}>
                      {isPaymentVerified(selectedOrder.paymentStatus)
                        ? "تم تأكيد استلام المبلغ"
                        : selectedOrder.paymentStatus === "rejected"
                          ? "تم رفض التحويل"
                          : "بانتظار التحقق"}
                    </h3>
                    <p className="mt-0.5 text-[11px] font-semibold leading-relaxed text-[var(--color-text-secondary)]">
                      {isPaymentVerified(selectedOrder.paymentStatus)
                        ? "الطلب مسموح له الآن بمسار التجهيز والتسليم."
                        : selectedOrder.paymentStatus === "rejected"
                          ? "الطلب غير مدفوع — تواصل مع العميل أو ألغِ الطلب، ومينفعش يتسلّم للمطبخ أو للعميل."
                          : "الإيصال بيتطبع للمراجعة، لكن التحويل لسه غير مؤكد: لا تعتبره مدفوعاً ولا تسلّم الطلب للمطبخ قبل مراجعة حساب الاستقبال وتأكيد المدير."}
                    </p>
                    {!isPaymentVerified(selectedOrder.paymentStatus) && (
                      <p className="mt-1.5 rounded-[8px] bg-white/60 px-2.5 py-1.5 text-[11px] font-semibold text-[var(--color-primary)]">
                        مرجع التحويل اللي كتبه العميل:{" "}
                        <span className="font-black" dir="ltr">
                          {selectedOrder.transactionReference || "غير مُدخل"}
                        </span>
                        {!selectedOrder.transactionReference && " — راجع صورة التحويل في الأسفل"}
                      </p>
                    )}
                  </div>
                </div>

                {isPaymentVerified(selectedOrder.paymentStatus) && (
                  <div className="grid gap-1.5 text-[11px] font-semibold text-[var(--color-primary)] sm:grid-cols-2">
                    <p>رقم العملية: <span className="font-black" dir="ltr">{selectedOrder.transactionReference || "—"}</span></p>
                    <p>المبلغ المؤكد: <span className="font-black">{selectedOrder.verifiedAmount ?? selectedOrder.total} ج.م</span></p>
                    {selectedOrder.paymentVerifiedByName && <p>أكّده: <span className="font-black">{selectedOrder.paymentVerifiedByName}</span></p>}
                    {selectedOrder.paymentVerifiedAt && <p>وقت التأكيد: <span className="font-black">{formatDate(selectedOrder.paymentVerifiedAt)}</span></p>}
                  </div>
                )}

                {selectedOrder.paymentStatus === "rejected" && selectedOrder.paymentRejectionReason && (
                  <p className="rounded-[10px] border border-[#F1D3CD] bg-[#fff] px-3 py-2 text-[11px] font-semibold text-[#B45243]">
                    سبب الرفض: {selectedOrder.paymentRejectionReason}
                  </p>
                )}

                {role !== "admin" && !isPaymentVerified(selectedOrder.paymentStatus) && (
                  <p className="text-[10.5px] font-semibold text-[var(--color-text-muted)]">
                    مراجعة الدفع متاحة للمدير فقط — حساب الكاشير لا يقدر يؤكد أو يرفض التحويل.
                  </p>
                )}

                {role === "admin" && !isPaymentVerified(selectedOrder.paymentStatus) && !paymentAction && (
                  <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => openVerifyPanel(selectedOrder)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[var(--color-primary)] px-3 py-2 text-[11px] font-bold text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-primary-hover)]">
                      <CheckCircle2 className="h-3.5 w-3.5" /> تأكيد استلام المبلغ
                    </button>
                    <button type="button" onClick={openRejectPanel}
                      className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#E7C6C0] bg-[#FBF0ED] px-3 py-2 text-[11px] font-bold text-[#B45243] transition-colors hover:bg-[#F7E3DE]">
                      <XCircle className="h-3.5 w-3.5" /> رفض التحويل
                    </button>
                  </div>
                )}

                {role === "admin" && paymentAction === "verify" && (
                  <div className="space-y-2.5 rounded-[12px] border border-[var(--color-primary-soft)] bg-[#fff] p-3">
                    <p className="text-[11px] font-black text-[var(--color-text-primary)]">بيانات التحويل المستلم</p>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold text-[var(--color-text-muted)]" htmlFor="txn-ref">
                        رقم مرجع العملية (Transaction Reference)
                      </label>
                      <input id="txn-ref" value={txnRef} onChange={(e) => setTxnRef(e.target.value)}
                        dir="ltr" placeholder="مثال: TXN-8890123"
                        className="w-full rounded-[10px] border border-[var(--color-control-border)] bg-[var(--color-surface)] px-3 py-2 text-[12px] font-semibold text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-primary-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-border)]/20" />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold text-[var(--color-text-muted)]" htmlFor="received-amount">
                        المبلغ المستلم من العميل (ج.م)
                      </label>
                      <input id="received-amount" type="number" step="0.01" inputMode="decimal" value={receivedAmount}
                        onChange={(e) => setReceivedAmount(e.target.value)}
                        className="w-full rounded-[10px] border border-[var(--color-control-border)] bg-[var(--color-surface)] px-3 py-2 text-[12px] font-semibold text-[var(--color-text-primary)] focus:border-[var(--color-primary-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-border)]/20" />
                      <p className={`mt-1 text-[10px] font-bold ${amountMatches ? "text-[#4F8A57]" : "text-[#B98A2C]"}`}>
                        إجمالي الطلب: {selectedOrder.total} ج.م — {amountMatches ? "المبلغ مطابق ✓" : "لازم يطابق الإجمالي بالظبط"}
                      </p>
                    </div>
                    {paymentError && <p className="text-[11px] font-bold text-[#C25B4F]">{paymentError}</p>}
                    <div className="flex gap-2">
                      <button type="button" onClick={submitPaymentAction}
                        disabled={paymentSaving || !amountMatches || txnRef.trim().length < 3}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[var(--color-primary)] px-3 py-2 text-[11px] font-bold text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50">
                        {paymentSaving
                          ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> جاري التأكيد...</>
                          : <><CheckCircle2 className="h-3.5 w-3.5" /> تأكيد الاستلام</>}
                      </button>
                      <button type="button" onClick={() => { setPaymentAction(null); setPaymentError(""); }}
                        disabled={paymentSaving}
                        className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-3 py-2 text-[11px] font-bold text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] disabled:opacity-50">
                        تراجع
                      </button>
                    </div>
                  </div>
                )}

                {role === "admin" && paymentAction === "reject" && (
                  <div className="space-y-2.5 rounded-[12px] border border-[#F1D3CD] bg-[#fff] p-3">
                    <label className="block text-[11px] font-black text-[var(--color-text-primary)]" htmlFor="reject-reason">
                      سبب رفض التحويل
                    </label>
                    <textarea id="reject-reason" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                      rows={2} placeholder="مثال: لم يصل المبلغ / رقم العملية غير صحيح / المبلغ مختلف"
                      className="w-full resize-none rounded-[10px] border border-[var(--color-control-border)] bg-[var(--color-surface)] px-3 py-2 text-[12px] font-semibold text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:border-[var(--color-primary-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-border)]/20" />
                    {paymentError && <p className="text-[11px] font-bold text-[#C25B4F]">{paymentError}</p>}
                    <div className="flex gap-2">
                      <button type="button" onClick={submitPaymentAction}
                        disabled={paymentSaving || rejectReason.trim().length < 3}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#B45243] px-3 py-2 text-[11px] font-bold text-[var(--color-on-primary)] transition-colors hover:bg-[#9E4639] disabled:cursor-not-allowed disabled:opacity-50">
                        {paymentSaving
                          ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> جاري الرفض...</>
                          : <><XCircle className="h-3.5 w-3.5" /> تأكيد الرفض</>}
                      </button>
                      <button type="button" onClick={() => { setPaymentAction(null); setPaymentError(""); }}
                        disabled={paymentSaving}
                        className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-3 py-2 text-[11px] font-bold text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] disabled:opacity-50">
                        تراجع
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─── حالة الطباعة والتحكم اليدوي ─── */}
            <div className="space-y-3 rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-[11px] font-black tracking-wide text-[var(--color-primary)]">حالة الطباعة</h3>
                <PrintBadge order={selectedOrder} />
              </div>

              {isOnlinePaymentMethod(selectedOrder.paymentMethod) &&
                !isPaymentVerified(selectedOrder.paymentStatus) && (
                  <p className="text-[11px] font-semibold leading-relaxed text-[#B98A2C]">
                    التحويل لسه غير مؤكد — الإيصال هيتطبع بحالة ONLINE وبانتظار التحقق.
                    متسلّموش الورقة للمطبخ قبل مراجعة حساب الاستقبال وتأكيد استلام المبلغ.
                  </p>
                )}

              {selectedOrder.status === "cancelled" && (
                <p className="text-[11px] font-bold leading-relaxed text-[#B45243]">
                  الطلب ملغي — الطباعة التلقائية متوقفة، ومينفعش يتطبع أو يتسلّم.
                </p>
              )}

              {selectedOrder.printState === "processing" && (
                <p className="flex items-center gap-1.5 text-[11px] font-semibold text-[#4C6E91]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  جارٍ الطباعة الآن — لو على جهاز تاني استنى لحد ما تخلص.
                </p>
              )}

              {selectedOrder.printState === "printed" && (
                <div className="space-y-1 text-[11px] font-semibold text-[#4F8A57]">
                  <p className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    تمت الطباعة
                    {selectedOrder.printedAt ? ` — ${formatDate(selectedOrder.printedAt)}` : ""}
                  </p>
                  <p className="text-[10.5px] text-[var(--color-text-secondary)]">
                    عدد المحاولات: {selectedOrder.printAttempts ?? 0} — لن تتم إعادة الطباعة تلقائياً.
                  </p>
                </div>
              )}

              {selectedOrder.printState === "failed" && (
                <div className="space-y-1 rounded-[10px] border border-[#F1D3CD] bg-[#FBF0ED] px-3 py-2">
                  <p className="flex items-center gap-1.5 text-[11px] font-black text-[#B45243]">
                    <AlertTriangle className="h-3.5 w-3.5" /> فشلت آخر محاولة طباعة
                  </p>
                  <p className="text-[10.5px] font-semibold text-[#B45243]">
                    {selectedOrder.printLastError || "خطأ غير معروف"}
                  </p>
                  <p className="text-[10px] font-medium text-[#8A6414]">
                    المحاولة هتتعاد تلقائياً بعد ~20 ثانية، أو اضغط «إعادة المحاولة» دلوقتي.
                  </p>
                </div>
              )}

              {printError && selectedOrder.printState !== "failed" && (
                <p className="text-[11px] font-bold text-[#C25B4F]">{printError}</p>
              )}

              {!selectedOrder.printState && (
                <p className="text-[10.5px] font-medium text-[var(--color-text-muted)]">
                  طلب قديم قبل تشغيل طابور الطباعة — الطباعة اليدوية متاحة زي الأول.
                </p>
              )}

              {selectedOrder.printState !== "printed" ? (
                <button
                  type="button"
                  disabled={
                    selectedOrder.status === "cancelled" ||
                    printingId === selectedOrder.id ||
                    selectedOrder.printState === "processing"
                  }
                  onClick={() => void runPrint(selectedOrder, true)}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-4 py-2.5 text-[12px] font-bold text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {printingId === selectedOrder.id ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> جاري الطباعة...</>
                  ) : selectedOrder.printState === "failed" ? (
                    <><RotateCcw className="h-4 w-4" /> إعادة المحاولة</>
                  ) : (
                    <><Printer className="h-4 w-4" /> طباعة الإيصال 80mm</>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={selectedOrder.status === "cancelled" || printingId === selectedOrder.id}
                  onClick={() => {
                    if (
                      window.confirm(
                        "الإيصال مطبوع قبل كده — إعادة الطباعة ممكن تطلع إيصال مكرر. تكمل؟",
                      )
                    ) {
                      void runPrint(selectedOrder, true);
                    }
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-[#E7C6C0] bg-[#FBF0ED] px-4 py-2.5 text-[12px] font-bold text-[#B45243] transition-colors hover:bg-[#F7E3DE] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {printingId === selectedOrder.id
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> جاري الطباعة...</>
                    : <><RotateCcw className="h-4 w-4" /> إعادة طباعة يدوية (ممكن يتكرر)</>}
                </button>
              )}
            </div>

            {/* إثبات التحويل */}
            {selectedOrder.paymentProofUrl && (
              <div className="space-y-2">
                <h3 className="text-[11px] font-black tracking-wide text-[var(--color-primary)]">صورة التحويل</h3>
                <a href={selectedOrder.paymentProofUrl} target="_blank" rel="noreferrer noopener"
                  className="group block overflow-hidden rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
                  <div className="relative h-48 w-full">
                    <Image src={selectedOrder.paymentProofUrl} alt="صورة إثبات التحويل" fill sizes="480px" className="object-contain p-2" />
                  </div>
                  <div className="flex items-center justify-between border-t border-[var(--color-border)] px-4 py-2">
                    <span className="text-[11px] font-bold text-[var(--color-primary)]">إيصال تحويل {PAYMENT_METHOD_LABELS[selectedOrder.paymentMethod]}</span>
                    <span className="text-[10.5px] font-bold text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)]">فتح بالحجم الكامل ←</span>
                  </div>
                </a>
              </div>
            )}

            {/* تغيير الحالة */}
            <div className="space-y-2">
              <h3 className="text-[11px] font-black tracking-wide text-[var(--color-primary)]">تغيير حالة الطلب</h3>
              <div className="grid grid-cols-3 gap-2">
                {ALL_STATUSES.map((s) => {
                  const lockedByPayment = s === "delivered" && awaitingPaymentReview(selectedOrder);
                  const isCancel = s === "cancelled";
                  const isActive = selectedOrder.status === s;
                  return (
                    <button key={s} onClick={() => changeStatus(selectedOrder.id, s)}
                      disabled={isActive || lockedByPayment}
                      title={
                        lockedByPayment
                          ? "أكد استلام المبلغ أولاً"
                          : isCancel
                            ? "إلغاء الطلب — هيطلب تأكيد قبل التنفيذ"
                            : undefined
                      }
                      className={`rounded-full border px-3 py-2 text-[11px] font-bold transition-all disabled:cursor-not-allowed ${
                        isActive
                          ? isCancel
                            ? "border-[#B45243] bg-[#B45243] text-[var(--color-on-primary)]"
                            : "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                          : lockedByPayment
                            ? "border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-muted)] opacity-60"
                            : isCancel
                              ? "border-[#E7C6C0] bg-[#FBF0ED] text-[#B45243] hover:bg-[#F7E3DE]"
                              : "border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary-border)] hover:text-[var(--color-text-primary)]"
                      }`}>
                      {isCancel ? "إلغاء الطلب" : ORDER_STATUS_LABELS[s]}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10.5px] font-semibold text-[var(--color-text-muted)]">
                «تمت الطباعة» حالة مستقلة — مش معناها إن الطلب اتسلّم للعميل.
              </p>
              {awaitingPaymentReview(selectedOrder) && (
                <p className="text-[10.5px] font-semibold text-[#B98A2C]">
                  «تم التسليم» مقفول لحد ما يتم تأكيد استلام المبلغ من التحويل.
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
