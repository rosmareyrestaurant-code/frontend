"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import {
  Search, Phone, MapPin, Copy, ChevronDown, ShoppingBag, X, Loader2, Download, Printer,
} from "lucide-react";
import { printOrderReceipt } from "@/lib/receipt";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { Modal } from "@/components/admin/shared/Modal";
import { EmptyState } from "@/components/admin/shared/EmptyState";
import { Pagination } from "@/components/admin/shared/Pagination";
import { useToast } from "@/components/admin/shared/Toast";
import { PaymentMethodIcon } from "@/components/common/PaymentBrandIcons";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { NEW_ORDERS_EVENT } from "@/hooks/useNewOrders";
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

  const totalPages = Math.ceil(total / PER_PAGE);

  const exportParams = new URLSearchParams();
  if (debouncedSearch) exportParams.set("q", debouncedSearch);
  if (statusFilter !== "all") exportParams.set("status", statusFilter);
  const exportHref = `/api/admin/orders/export${exportParams.toString() ? `?${exportParams}` : ""}`;

  const changeStatus = async (orderId: string, status: OrderStatus) => {
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

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* البحث والفلترة */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9A9C90]" />
          <input type="text" value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="ابحث برقم الطلب أو الاسم أو الهاتف..."
            className="w-full rounded-full border border-[#E9E5DA] bg-[#FBF9F6] py-2.5 pe-4 ps-10 text-[13px] text-[#333B2E] placeholder-[#A6A79C] transition-colors focus:border-[#B9C4AF] focus:outline-none focus:ring-2 focus:ring-[#96A78F]/20" />
          {search && <button onClick={() => setSearch("")} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9A9C90] transition-colors hover:text-[#50604D]" aria-label="مسح البحث"><X className="h-3.5 w-3.5" /></button>}
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as OrderStatus | "all"); setPage(1); }}
            className="w-full min-w-[170px] appearance-none rounded-full border border-[#E9E5DA] bg-[#FBF9F6] py-2.5 pe-4 ps-10 text-[13px] font-semibold text-[#333B2E] focus:border-[#B9C4AF] focus:outline-none focus:ring-2 focus:ring-[#96A78F]/20">
            <option value="all">كل الحالات</option>
            {ALL_STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9A9C90]" />
        </div>
      </div>

      {/* جدول الطلبات */}
      <div className="overflow-hidden rounded-[18px] border border-[#EDE9E0] bg-[#FBF9F6]">
        <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-4">
          <h2 className="flex items-center gap-2 text-[15px] font-black text-[#333B2E]">
            الطلبات <span className="text-[12px] font-bold text-[#9A9C90]">({total})</span>
            {refreshing && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#9A9C90]">
                <Loader2 className="h-3 w-3 animate-spin" /> تحديث
              </span>
            )}
          </h2>
          <a
            href={exportHref}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#DCE3D6] bg-[#EEF3EA] px-3 py-1.5 text-[11px] font-bold text-[#50604D] transition-colors hover:bg-[#E4ECDF]"
          >
            <Download className="h-3.5 w-3.5" /> تصدير CSV
          </a>
        </div>
        {loading ? (
          <div className="py-12 text-center text-[13px] text-[#9A9C90] animate-pulse">جاري التحميل...</div>
        ) : orders.length === 0 ? (
          <EmptyState icon={ShoppingBag} title="لا توجد طلبات" description="لم يتم العثور على طلبات مطابقة" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-right">
                <thead>
                  <tr className="bg-[#F4F2EE] text-[11px] font-bold text-[#8F9186]">
                    <th className="px-5 py-2.5 font-bold">رقم الطلب</th>
                    <th className="px-5 py-2.5 font-bold">العميل</th>
                    <th className="px-5 py-2.5 font-bold">الإجمالي</th>
                    <th className="px-5 py-2.5 font-bold">الحالة</th>
                    <th className="px-5 py-2.5 font-bold">التاريخ</th>
                    <th className="px-5 py-2.5 font-bold">تفاصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EDE5]">
                  {orders.map((order) => (
                    <tr key={order.id} onClick={() => setSelectedOrder(order)}
                      tabIndex={0} role="button"
                      className="cursor-pointer text-[12px] transition-colors hover:bg-[#F8F6F1] focus:outline-none focus-visible:bg-[#F8F6F1]">
                      <td className="px-5 py-3.5 font-black text-[#333B2E]" dir="ltr">#{order.orderNumber}</td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-[#333B2E]">{order.customerName}</p>
                        <p className="text-[11px] text-[#9A9C90]" dir="ltr">{order.customerPhone}</p>
                      </td>
                      <td className="px-5 py-3.5 font-black text-[#333B2E]">{order.total} ج.م</td>
                      <td className="px-5 py-3.5"><StatusBadge status={order.status} /></td>
                      <td className="px-5 py-3.5 text-[11px] font-medium text-[#9A9C90]">{formatDate(order.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <button onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
                          className="rounded-full border border-[#E7E3D8] bg-[#F4F2EE] px-3 py-1.5 text-[11px] font-bold text-[#50604D] transition-colors hover:bg-[#EDEAE1]">
                          تفاصيل
                        </button>
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
      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)}
        title={selectedOrder ? `تفاصيل الطلب #${selectedOrder.orderNumber}` : ""} size="lg">
        {selectedOrder && (
          <div className="space-y-5">
            {/* بيانات العميل */}
            <div className="space-y-3 rounded-[14px] border border-[#EDE9E0] bg-[#F4F2EE] p-4">
              <h3 className="text-[11px] font-black tracking-wide text-[#50604D]">بيانات العميل</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-semibold text-[#9A9C90]">الاسم</p>
                  <p className="text-[13px] font-bold text-[#333B2E]">{selectedOrder.customerName}</p>
                </div>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-semibold text-[#9A9C90]">الهاتف</p>
                    <p className="text-[13px] font-bold text-[#333B2E]" dir="ltr">{selectedOrder.customerPhone}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <a href={`tel:${selectedOrder.customerPhone}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E3F0DE] text-[#4F8A57] transition-colors hover:bg-[#D8EAD2]">
                      <Phone className="h-3.5 w-3.5" />
                    </a>
                    <button onClick={() => copyText(selectedOrder.customerPhone, "الهاتف")}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F0EDE5] text-[#6B7264] transition-colors hover:bg-[#E7E3D8]">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#50604D]" />
                  <p className="text-[13px] font-medium text-[#6B7264]">{selectedOrder.customerAddress}</p>
                </div>
                <button onClick={() => copyText(selectedOrder.customerAddress, "العنوان")}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F0EDE5] text-[#6B7264] transition-colors hover:bg-[#E7E3D8]">
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
              <h3 className="text-[11px] font-black tracking-wide text-[#50604D]">الوجبات المطلوبة</h3>
              {selectedOrder.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 rounded-[14px] border border-[#EDE9E0] bg-[#F4F2EE] p-3">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[10px] bg-[#F1EEE7]">
                    <Image src={item.productImage || "/images/logo-rosemary-green.png"} alt={item.productName} fill className="object-cover" sizes="48px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-bold text-[#333B2E]">{item.productName}</p>
                    {item.selectedSize && <p className="text-[11px] font-medium text-[#8A6414]">الحجم: {item.selectedSize.name}</p>}
                    {item.notes && <p className="text-[11px] font-medium text-[#8A6414]">ملاحظة: {item.notes}</p>}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[13px] font-black text-[#333B2E]">{item.itemTotal} ج.م</p>
                    <p className="text-[11px] text-[#9A9C90]">{item.price} × {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* الإجمالي */}
            <div className="space-y-2 rounded-[14px] border border-[#EDE9E0] bg-[#F4F2EE] p-4">
              <div className="flex justify-between text-[12px] font-semibold text-[#8F9186]">
                <span>المجموع الفرعي</span><span className="font-bold text-[#333B2E]">{selectedOrder.subtotal} ج.م</span>
              </div>
              {(selectedOrder.deliveryFee ?? 0) > 0 && (
                <div className="flex justify-between text-[12px] font-semibold text-[#8F9186]">
                  <span>رسوم التوصيل</span><span className="font-bold text-[#333B2E]">{selectedOrder.deliveryFee} ج.م</span>
                </div>
              )}
              <div className="flex justify-between border-t border-[#E5E0D3] pt-2">
                <span className="text-[13px] font-black text-[#333B2E]">الإجمالي</span>
                <span className="text-[17px] font-black text-[#333B2E]">{selectedOrder.total} ج.م</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-semibold text-[#9A9C90]">طريقة الدفع</span>
                <span className="flex items-center gap-1.5 text-[11.5px] font-bold text-[#333B2E]">
                  <PaymentMethodIcon method={selectedOrder.paymentMethod} className="h-4 w-4" />
                  {PAYMENT_METHOD_LABELS[selectedOrder.paymentMethod] ?? "كاش عند الاستلام"}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!printOrderReceipt(selectedOrder)) {
                  showToast("المتصفح منع نافذة الطباعة — اسمح بالنوافذ المنبثقة", "error");
                }
              }}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#50604D] px-4 py-2.5 text-[12px] font-bold text-[#fff] transition-colors hover:bg-[#435241]"
            >
              <Printer className="h-4 w-4" /> طباعة إيصال 80mm
            </button>

            {/* إثبات التحويل */}
            {selectedOrder.paymentProofUrl && (
              <div className="space-y-2">
                <h3 className="text-[11px] font-black tracking-wide text-[#50604D]">صورة التحويل</h3>
                <a href={selectedOrder.paymentProofUrl} target="_blank" rel="noreferrer noopener"
                  className="group block overflow-hidden rounded-[14px] border border-[#EDE9E0] bg-[#F4F2EE]">
                  <div className="relative h-48 w-full">
                    <Image src={selectedOrder.paymentProofUrl} alt="صورة إثبات التحويل" fill sizes="480px" className="object-contain p-2" />
                  </div>
                  <div className="flex items-center justify-between border-t border-[#EDE9E0] px-4 py-2">
                    <span className="text-[11px] font-bold text-[#50604D]">إيصال تحويل {PAYMENT_METHOD_LABELS[selectedOrder.paymentMethod]}</span>
                    <span className="text-[10.5px] font-bold text-[#9A9C90] group-hover:text-[#50604D]">فتح بالحجم الكامل ←</span>
                  </div>
                </a>
              </div>
            )}

            {/* تغيير الحالة */}
            <div className="space-y-2">
              <h3 className="text-[11px] font-black tracking-wide text-[#50604D]">تغيير حالة الطلب</h3>
              <div className="grid grid-cols-3 gap-2">
                {ALL_STATUSES.map((s) => (
                  <button key={s} onClick={() => changeStatus(selectedOrder.id, s)}
                    disabled={selectedOrder.status === s}
                    className={`rounded-full border px-3 py-2 text-[11px] font-bold transition-all disabled:cursor-default ${
                      selectedOrder.status === s
                        ? "border-[#50604D] bg-[#50604D] text-[#fff]"
                        : "border-[#E7E3D8] bg-[#F4F2EE] text-[#6B7264] hover:border-[#C9D3C3] hover:text-[#333B2E]"
                    }`}>
                    {ORDER_STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
