"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Users, Phone, X, ChevronLeft, Loader2, Download } from "lucide-react";
import { Modal } from "@/components/admin/shared/Modal";
import { EmptyState } from "@/components/admin/shared/EmptyState";
import { Pagination } from "@/components/admin/shared/Pagination";
import { useToast } from "@/components/admin/shared/Toast";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { AdminCustomer, AdminOrder } from "@/types/admin";

// Mock data — مفعّلة مؤقتاً للتيست (رجّع تعليقها وشغّل الـ API بعد الانتهاء)
import { MOCK_ADMIN_CUSTOMERS } from "@/data/admin/customers";
import { MOCK_ORDERS } from "@/data/admin/orders";

const USE_MOCK = false; // الموك معطّل — الواجهة متصلة بالـ API

const PER_PAGE = 10;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "2-digit" });
}

export default function CustomersPage() {
  const { showToast } = useToast();
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [selected, setSelected] = useState<AdminCustomer | null>(null);
  const [customerOrders, setCustomerOrders] = useState<AdminOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [page, setPage] = useState(1);
  const loadedOnce = useRef(false);

  const fetchCustomers = useCallback(async () => {
    if (USE_MOCK) {
      const q = debouncedSearch.trim();
      const filtered = MOCK_ADMIN_CUSTOMERS.filter((c) => !q || c.name.includes(q) || c.phone.includes(q));
      setCustomers(filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE));
      setTotal(filtered.length);
      setLoading(false);
      loadedOnce.current = true;
      return;
    }
    // أول تحميل بس هو اللي بيظهر فيه لودينج — البحث بعد كده بحدّث بهدوء
    if (loadedOnce.current) setRefreshing(true);
    else setLoading(true);
    try {
      const sp = new URLSearchParams({ page: String(page), limit: String(PER_PAGE) });
      if (debouncedSearch) sp.set("q", debouncedSearch);
      const res = await fetch(`/api/admin/customers?${sp}`);
      const d = await res.json();
      if (d.success) { setCustomers(d.data.customers); setTotal(d.data.pagination.total); }
      else showToast(d.error?.message ?? "فشل", "error");
    } catch { showToast("خطأ", "error"); }
    finally { loadedOnce.current = true; setLoading(false); setRefreshing(false); }
  }, [page, debouncedSearch, showToast]);

  useEffect(() => { queueMicrotask(() => { void fetchCustomers(); }); }, [fetchCustomers]);

  const totalPages = Math.ceil(total / PER_PAGE);
  const exportHref = `/api/admin/customers/export${debouncedSearch ? `?q=${encodeURIComponent(debouncedSearch)}` : ""}`;

  const openCustomer = async (c: AdminCustomer) => {
    setSelected(c);
    setCustomerOrders([]);
    if (USE_MOCK) {
      setCustomerOrders(MOCK_ORDERS.filter((o) => o.customerPhone === c.phone));
      return;
    }
    setOrdersLoading(true);
    try {
      const res = await fetch(`/api/admin/customers/${encodeURIComponent(c.phone)}`);
      const d = await res.json();
      if (d.success) setCustomerOrders(d.data.orders ?? []);
    } catch { setCustomerOrders([]); }
    finally { setOrdersLoading(false); }
  };

  const copyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone).then(() => showToast("تم نسخ الهاتف", "success"));
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
        <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="ابحث بالاسم أو الهاتف..."
          className="w-full rounded-full border border-[var(--color-control-border)] bg-[var(--color-surface)] py-2.5 pe-4 ps-10 text-[13px] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] transition-colors focus:border-[var(--color-primary-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-border)]/20" />
        {search && <button onClick={() => setSearch("")} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary)]" aria-label="مسح البحث"><X className="h-3.5 w-3.5" /></button>}
      </div>

      <div className="overflow-hidden rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-4">
          <h2 className="flex items-center gap-2 text-[15px] font-black text-[var(--color-text-primary)]">
            العملاء <span className="text-[12px] font-bold text-[var(--color-text-muted)]">({total})</span>
            {refreshing && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--color-text-muted)]">
                <Loader2 className="h-3 w-3 animate-spin" /> تحديث
              </span>
            )}
          </h2>
          <a
            href={exportHref}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--color-primary-soft)] bg-[var(--color-primary-soft)] px-3 py-1.5 text-[11px] font-bold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary-soft)]"
          >
            <Download className="h-3.5 w-3.5" /> تصدير CSV
          </a>
        </div>
        {loading ? (
          <div className="py-12 text-center text-[13px] text-[var(--color-text-muted)] animate-pulse">جاري التحميل...</div>
        ) : customers.length === 0 ? (
          <EmptyState icon={Users} title="لا يوجد عملاء" description="لم يتم العثور على عملاء" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-right">
                <thead>
                  <tr className="bg-[var(--color-surface-secondary)] text-[11px] font-bold text-[var(--color-text-muted)]">
                    <th className="px-5 py-2.5 font-bold">العميل</th>
                    <th className="px-5 py-2.5 font-bold">الطلبات</th>
                    <th className="px-5 py-2.5 font-bold">المنفق</th>
                    <th className="px-5 py-2.5 font-bold">آخر طلب</th>
                    <th className="px-5 py-2.5 font-bold">التفاصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-subtle)]">
                  {customers.map(c => (
                    <tr key={c.id} onClick={() => openCustomer(c)} tabIndex={0} role="button"
                      className="cursor-pointer text-[12px] transition-colors hover:bg-[var(--color-surface-soft)] focus:outline-none focus-visible:bg-[var(--color-surface-soft)]">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-soft)] text-[13px] font-black text-[var(--color-primary)]">
                            {c.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-[13px] font-bold text-[var(--color-text-primary)]">{c.name}</p>
                            <div className="flex items-center gap-1.5">
                              <p className="text-[11px] text-[var(--color-text-muted)]" dir="ltr">{c.phone}</p>
                              <button onClick={e => { e.stopPropagation(); copyPhone(c.phone); }} className="text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary)]">
                                <Phone className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center rounded-full bg-[var(--color-surface-secondary)] px-2.5 py-1 text-[11px] font-black text-[var(--color-primary)]">{c.ordersCount}</span>
                      </td>
                      <td className="px-5 py-3 text-[13px] font-black text-[var(--color-text-primary)]">{c.totalSpent.toLocaleString()} ج.م</td>
                      <td className="px-5 py-3 text-[11px] font-medium text-[var(--color-text-muted)]">{formatDate(c.lastOrderAt)}</td>
                      <td className="px-5 py-3">
                        <button onClick={e => { e.stopPropagation(); openCustomer(c); }}
                          className="flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-3 py-1.5 text-[11px] font-bold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-surface-hover)]">
                          تفاصيل <ChevronLeft className="h-3.5 w-3.5" />
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

      <Modal isOpen={!!selected} onClose={() => { setSelected(null); setCustomerOrders([]); setOrdersLoading(false); }}
        title={selected ? `تفاصيل العميل — ${selected.name}` : ""} size="lg">
        {selected && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "الاسم", value: selected.name },
                { label: "الهاتف", value: selected.phone, ltr: true },
                { label: "أول طلب", value: formatDate(selected.firstOrderAt) },
                { label: "آخر طلب", value: formatDate(selected.lastOrderAt) },
                { label: "الطلبات", value: `${selected.ordersCount} طلب` },
                { label: "المنفق", value: `${selected.totalSpent.toLocaleString()} ج.م` },
              ].map(({ label, value, ltr }) => (
                <div key={label} className="rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-3.5">
                  <p className="mb-1 text-[10px] font-semibold text-[var(--color-text-muted)]">{label}</p>
                  <p className="text-[13px] font-bold text-[var(--color-text-primary)]" dir={ltr ? "ltr" : undefined}>{value}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <h3 className="text-[11px] font-black tracking-wide text-[var(--color-primary)]">سجل الطلبات ({customerOrders.length})</h3>
              {ordersLoading ? (
                <p className="flex items-center justify-center gap-2 py-4 text-center text-[13px] text-[var(--color-text-muted)]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> جاري تحميل الطلبات...
                </p>
              ) : customerOrders.length === 0 ? (
                <p className="py-4 text-center text-[13px] text-[var(--color-text-muted)]">لا توجد طلبات</p>
              ) : (
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {customerOrders.map(order => (
                    <div key={order.id} className="flex items-center justify-between rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-[12px] font-black text-[var(--color-text-primary)]">#{order.orderNumber}</span>
                        <StatusBadge status={order.status} />
                      </div>
                      <div className="text-right">
                        <p className="text-[13px] font-black text-[var(--color-text-primary)]">{order.total} ج.م</p>
                        <p className="text-[10px] text-[var(--color-text-muted)]">{formatDate(order.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
