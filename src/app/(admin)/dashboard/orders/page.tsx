"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import {
  Search, Phone, MapPin, Copy, ChevronDown,
  ShoppingBag, X, CheckCircle2, Globe2, Truck,
} from "lucide-react";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { Modal } from "@/components/admin/shared/Modal";
import { EmptyState } from "@/components/admin/shared/EmptyState";
import { Pagination } from "@/components/admin/shared/Pagination";
import { useToast } from "@/components/admin/shared/Toast";
import { MOCK_ORDERS } from "@/data/admin/orders";
import { useCustomerOrders } from "@/hooks/useCustomerOrders";
import { useDelivery } from "@/context/DeliveryContext";
import { Order } from "@/types";
import {
  AdminOrder, OrderStatus,
  ORDER_STATUS_LABELS,
} from "@/types/admin";

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
  const [orders, setOrders] = useState<AdminOrder[]>(MOCK_ORDERS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [selectedLiveOrder, setSelectedLiveOrder] = useState<Order | null>(null);
  const [page, setPage] = useState(1);

  // الطلبات اللي بيجهزها العملاء على الموقع وتظهر هنا فوراً عشان نتواصل معاهم.
  const customerOrders = useCustomerOrders();
  const { activeZones } = useDelivery();

  /** البيان الأخضر بيظهر بس لو المكان مضاف ومفعّل في إعدادات التوصيل المجاني. */
  const isLiveOrderFree = (order: Order) =>
    !!order.customer.areaId &&
    activeZones.some((z) => z.id === order.customer.areaId || z.name === order.customer.areaName);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      const matchSearch = !q || o.id.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q) || o.customerPhone.includes(q);
      const matchStatus = statusFilter === "all" || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const changeStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    if (selectedOrder?.id === orderId) setSelectedOrder((prev) => prev ? { ...prev, status } : null);
    showToast(`تم تحديث حالة الطلب إلى: ${ORDER_STATUS_LABELS[status]}`, "success");
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => showToast(`تم نسخ ${label}`, "success"));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5a4f45]" />
          <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="ابحث برقم الطلب أو اسم العميل أو الهاتف..."
            className="w-full rounded-xl bg-[#141210] border border-[#2a241f] py-2.5 pr-9 pl-4 text-sm text-white placeholder-[#5a4f45] focus:border-[#ff7a00] focus:outline-none transition-colors" />
          {search && <button onClick={() => setSearch("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a4f45] hover:text-white"><X className="h-3.5 w-3.5" /></button>}
        </div>
        <div className="relative">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as OrderStatus | "all"); setPage(1); }}
            className="appearance-none rounded-xl bg-[#141210] border border-[#2a241f] py-2.5 pr-4 pl-8 text-sm text-white focus:border-[#ff7a00] focus:outline-none transition-colors min-w-[160px]">
            <option value="all">كل الحالات</option>
            {ALL_STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABELS[s]}</option>)}
          </select>
          <ChevronDown className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#5a4f45] pointer-events-none" />
        </div>
      </div>

      <div className="rounded-2xl bg-[#141210] border border-[#26201a] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#231d17]">
          <h2 className="text-sm font-bold text-white">الطلبات ({filtered.length})</h2>
        </div>
        {paginated.length === 0 ? (
          <EmptyState icon={ShoppingBag} title="لا توجد طلبات" description="لم يتم العثور على طلبات مطابقة للبحث" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm min-w-[700px]">
                <thead>
                  <tr className="text-[11px] text-[#5a4f45] border-b border-[#1e1914]">
                    <th className="px-5 py-3 font-bold">رقم الطلب</th>
                    <th className="px-5 py-3 font-bold">العميل</th>
                    <th className="px-5 py-3 font-bold">الإجمالي</th>
                    <th className="px-5 py-3 font-bold">الحالة</th>
                    <th className="px-5 py-3 font-bold">التاريخ</th>
                    <th className="px-5 py-3 font-bold">تفاصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1612]">
                  {paginated.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedOrder(order);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`عرض تفاصيل الطلب ${order.id}`}
                      className="cursor-pointer transition-colors hover:bg-[#1a1512] focus:outline-none focus-visible:bg-[#1a1512] focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#ff7a00]/40"
                    >
                      <td className="px-5 py-3.5 font-black text-white">#{order.id}</td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-white text-xs">{order.customerName}</p>
                        <p className="text-[11px] text-[#5a4f45]">{order.customerPhone}</p>
                      </td>
                      <td className="px-5 py-3.5 font-black text-[#ff7a00]">{order.total} ج.م</td>
                      <td className="px-5 py-3.5"><StatusBadge status={order.status} /></td>
                      <td className="px-5 py-3.5 text-[11px] text-[#5a4f45]">{formatDate(order.createdAt)}</td>
                      <td className="px-5 py-3.5">
                        <button onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
                          className="rounded-lg bg-[#1f1915] border border-[#2a231d] px-3 py-1.5 text-xs font-bold text-[#a89f94] hover:text-white hover:border-[#ff7a00]/40 transition-colors">
                          تفاصيل
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} itemsPerPage={PER_PAGE} />
            </div>
          </>
        )}
      </div>

      {/* الطلبات الواردة حياً من الموقع — العميل يدخل بياناته ومكانه فقط */}
      {customerOrders.length > 0 && (
        <div className="rounded-2xl bg-[#141210] border border-emerald-500/20 overflow-hidden">
          <div className="px-5 py-3 border-b border-[#231d17] flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-emerald-400" />
              طلبات واردة من الموقع ({customerOrders.length})
            </h2>
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> مباشر
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm min-w-[760px]">
              <thead>
                <tr className="text-[11px] text-[#5a4f45] border-b border-[#1e1914]">
                  <th className="px-5 py-3 font-bold">رقم الطلب</th>
                  <th className="px-5 py-3 font-bold">العميل</th>
                  <th className="px-5 py-3 font-bold">الهاتف</th>
                  <th className="px-5 py-3 font-bold">المكان</th>
                  <th className="px-5 py-3 font-bold">التوصيل</th>
                  <th className="px-5 py-3 font-bold">الإجمالي</th>
                  <th className="px-5 py-3 font-bold">تفاصيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1612]">
                {customerOrders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedLiveOrder(order)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedLiveOrder(order);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`عرض تفاصيل الطلب الوارد ${order.id}`}
                    className="cursor-pointer transition-colors hover:bg-[#1a1512] focus:outline-none focus-visible:bg-[#1a1512] focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-emerald-500/40"
                  >
                    <td className="px-5 py-3.5 font-black text-white">#{order.id}</td>
                    <td className="px-5 py-3.5 font-semibold text-white text-xs">{order.customer.name}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5" dir="ltr">
                        <span className="text-xs text-[#c4b9ad]">{order.customer.phone}</span>
                        <a href={`tel:${order.customer.phone}`} onClick={(e) => e.stopPropagation()}
                           aria-label={`اتصال بـ ${order.customer.name}`}
                           className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors">
                          <Phone className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-[#c4b9ad]">{order.customer.areaName || "—"}</td>
                    <td className="px-5 py-3.5">
                      {isLiveOrderFree(order) ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-1 text-[11px] font-bold text-emerald-400 border border-emerald-500/30">
                          <CheckCircle2 className="h-3 w-3" /> توصيل مجاني
                        </span>
                      ) : (
                        <span className="text-xs text-[#5a4f45]">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-black text-[#ff7a00]">{order.total} ج.م</td>
                    <td className="px-5 py-3.5">
                      <button onClick={(e) => { e.stopPropagation(); setSelectedLiveOrder(order); }}
                        className="rounded-lg bg-[#1f1915] border border-[#2a231d] px-3 py-1.5 text-xs font-bold text-[#a89f94] hover:text-white hover:border-[#ff7a00]/40 transition-colors">
                        تفاصيل
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={selectedOrder ? `تفاصيل الطلب #${selectedOrder.id}` : ""} size="lg">
        {selectedOrder && (
          <div className="space-y-5">
            <div className="rounded-xl bg-[#1a1512] border border-[#2a231d] p-4 space-y-3">
              <h3 className="text-xs font-bold text-[#ff7a00] uppercase tracking-wider">بيانات العميل</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-[#5a4f45]">الاسم</p>
                  <p className="text-sm font-bold text-white">{selectedOrder.customerName}</p>
                </div>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] text-[#5a4f45]">الهاتف</p>
                    <p className="text-sm font-bold text-white" dir="ltr">{selectedOrder.customerPhone}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <a href={`tel:${selectedOrder.customerPhone}`}
                       className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors">
                      <Phone className="h-3.5 w-3.5" />
                    </a>
                    <button onClick={() => copyText(selectedOrder.customerPhone, "الهاتف")}
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2a231d] text-[#8a8076] hover:text-white transition-colors">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-[#ff7a00] shrink-0 mt-0.5" />
                  <p className="text-sm text-[#c4b9ad]">{selectedOrder.customerAddress}</p>
                </div>
                <button onClick={() => copyText(selectedOrder.customerAddress, "العنوان")}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2a231d] text-[#8a8076] hover:text-white transition-colors shrink-0">
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              {selectedOrder.notes && (
                <div className="rounded-lg bg-[#ff7a00]/8 border border-[#ff7a00]/20 px-3 py-2">
                  <p className="text-[11px] text-[#ff9838]"><span className="font-bold">ملاحظة: </span>{selectedOrder.notes}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold text-[#ff7a00] uppercase tracking-wider">الوجبات المطلوبة</h3>
              {selectedOrder.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl bg-[#1a1512] border border-[#2a231d] p-3">
                  <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-[#141210] shrink-0">
                    <Image src={item.productImage} alt={item.productName} fill className="object-cover" sizes="48px" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{item.productName}</p>
                    {item.notes && <p className="text-[11px] text-[#ff9838]">ملاحظة: {item.notes}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-[#ff7a00]">{item.price * item.quantity} ج.م</p>
                    <p className="text-[11px] text-[#5a4f45]">{item.price} × {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-[#1a1512] border border-[#2a231d] p-4 space-y-2">
              <div className="flex justify-between text-xs text-[#a89f94]">
                <span>المجموع الفرعي</span>
                <span className="font-bold text-white">{selectedOrder.subtotal} ج.م</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#2a231d]">
                <span className="text-sm font-black text-white">الإجمالي</span>
                <span className="text-lg font-black text-[#ff7a00]">{selectedOrder.total} ج.م</span>
              </div>
              <p className="pt-1 text-[11px] text-[#6b6259]">الدفع عند الاستلام (كاش)</p>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold text-[#ff7a00] uppercase tracking-wider">تغيير حالة الطلب</h3>
              <div className="grid grid-cols-3 gap-2">
                {ALL_STATUSES.map((s) => (
                  <button key={s} onClick={() => changeStatus(selectedOrder.id, s)}
                    className={`rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                      selectedOrder.status === s
                        ? "bg-[#ff7a00] border-[#ff7a00] text-white"
                        : "bg-[#1a1512] border-[#2a231d] text-[#a89f94] hover:border-[#ff7a00]/40 hover:text-white"
                    }`}>
                    {ORDER_STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* تفاصيل الطلب الوارد من الموقع */}
      <Modal isOpen={!!selectedLiveOrder} onClose={() => setSelectedLiveOrder(null)}
             title={selectedLiveOrder ? `تفاصيل الطلب #${selectedLiveOrder.id}` : ""} size="lg">
        {selectedLiveOrder && (
          <div className="space-y-5">
            <div className="rounded-xl bg-[#1a1512] border border-[#2a231d] p-4 space-y-3">
              <h3 className="text-xs font-bold text-[#ff7a00] uppercase tracking-wider">بيانات العميل</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-[#5a4f45]">الاسم</p>
                  <p className="text-sm font-bold text-white">{selectedLiveOrder.customer.name}</p>
                </div>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] text-[#5a4f45]">الهاتف</p>
                    <p className="text-sm font-bold text-white" dir="ltr">{selectedLiveOrder.customer.phone}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <a href={`tel:${selectedLiveOrder.customer.phone}`}
                       className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors">
                      <Phone className="h-3.5 w-3.5" />
                    </a>
                    <button onClick={() => copyText(selectedLiveOrder.customer.phone, "الهاتف")}
                            className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2a231d] text-[#8a8076] hover:text-white transition-colors">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-[#ff7a00] shrink-0 mt-0.5" />
                  <p className="text-sm text-[#c4b9ad]">{selectedLiveOrder.customer.address}</p>
                </div>
                <button onClick={() => copyText(selectedLiveOrder.customer.address, "العنوان")}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#2a231d] text-[#8a8076] hover:text-white transition-colors shrink-0">
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <p className="text-[10px] text-[#5a4f45]">المكان</p>
                  <p className="text-sm font-bold text-white">{selectedLiveOrder.customer.areaName || "—"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-[#5a4f45]">التوصيل</p>
                  {isLiveOrderFree(selectedLiveOrder) ? (
                    <p className="flex items-center gap-1 text-sm font-bold text-emerald-400">
                      <Truck className="h-3.5 w-3.5" /> توصيل مجاني
                    </p>
                  ) : (
                    <p className="text-sm text-[#5a4f45]">—</p>
                  )}
                </div>
              </div>
              {selectedLiveOrder.customer.notes && (
                <div className="rounded-lg bg-[#ff7a00]/8 border border-[#ff7a00]/20 px-3 py-2">
                  <p className="text-[11px] text-[#ff9838]"><span className="font-bold">ملاحظة: </span>{selectedLiveOrder.customer.notes}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold text-[#ff7a00] uppercase tracking-wider">الوجبات المطلوبة</h3>
              {selectedLiveOrder.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl bg-[#1a1512] border border-[#2a231d] p-3">
                  <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-[#141210] shrink-0">
                    <Image src={item.product.image} alt={item.product.name} fill className="object-cover" sizes="48px" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{item.product.name}</p>
                    {item.notes && <p className="text-[11px] text-[#ff9838]">ملاحظة: {item.notes}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-[#ff7a00]">{item.product.price * item.quantity} ج.م</p>
                    <p className="text-[11px] text-[#5a4f45]">{item.product.price} × {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl bg-[#1a1512] border border-[#2a231d] p-4 space-y-2">
              <div className="flex justify-between text-xs text-[#a89f94]">
                <span>المجموع</span>
                <span className="font-bold text-white">{selectedLiveOrder.subtotal} ج.م</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#2a231d]">
                <span className="text-sm font-black text-white">الإجمالي</span>
                <span className="text-lg font-black text-[#ff7a00]">{selectedLiveOrder.total} ج.م</span>
              </div>
              <p className="pt-1 text-[11px] text-[#6b6259]">الدفع عند الاستلام (كاش) · {formatDate(selectedLiveOrder.createdAt)}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
