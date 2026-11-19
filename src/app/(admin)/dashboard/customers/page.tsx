"use client";

import { useState, useMemo } from "react";
import { Search, Users, Phone, X, ChevronLeft } from "lucide-react";
import { Modal } from "@/components/admin/shared/Modal";
import { EmptyState } from "@/components/admin/shared/EmptyState";
import { Pagination } from "@/components/admin/shared/Pagination";
import { MOCK_ADMIN_CUSTOMERS } from "@/data/admin/customers";
import { MOCK_ORDERS } from "@/data/admin/orders";
import { AdminCustomer } from "@/types/admin";
import { useToast } from "@/components/admin/shared/Toast";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";

const PER_PAGE = 7;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "2-digit" });
}

export default function CustomersPage() {
  const { showToast } = useToast();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AdminCustomer | null>(null);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return MOCK_ADMIN_CUSTOMERS;
    return MOCK_ADMIN_CUSTOMERS.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
    );
  }, [search]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // طلبات العميل المحدد
  const customerOrders = useMemo(
    () => MOCK_ORDERS.filter((o) => selected && o.customerPhone === selected.phone),
    [selected]
  );

  /**
   * الدفع كاش فقط، والإحصاء يُحسب من الطلبات المُسلّمة فعلياً.
   * لا نعرض أرقاماً ثابتة حتى لا نبالغ في اللي العميل أنفقه.
   */
  const deliveredStats = useMemo(() => {
    const map = new Map<string, { count: number; spent: number }>();
    MOCK_ORDERS.filter((o) => o.status === "delivered").forEach((o) => {
      const prev = map.get(o.customerPhone) ?? { count: 0, spent: 0 };
      map.set(o.customerPhone, { count: prev.count + 1, spent: prev.spent + o.total });
    });
    return map;
  }, []);

  const getStats = (phone: string) => deliveredStats.get(phone) ?? { count: 0, spent: 0 };

  const copyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone).then(() => showToast("تم نسخ الهاتف", "success"));
  };

  return (
    <div className="space-y-5">
      {/* بحث */}
      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5a4f45]" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="ابحث بالاسم أو الهاتف..."
          className="w-full rounded-xl bg-[#141210] border border-[#2a241f] py-2.5 pr-9 pl-4 text-sm text-white placeholder-[#5a4f45] focus:border-[#ff7a00] focus:outline-none transition-colors"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a4f45] hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* جدول */}
      <div className="rounded-2xl bg-[#141210] border border-[#26201a] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#231d17]">
          <h2 className="text-sm font-bold text-white">العملاء ({filtered.length})</h2>
        </div>

        {paginated.length === 0 ? (
          <EmptyState icon={Users} title="لا يوجد عملاء" description="لم يتم العثور على عملاء مطابقين" />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm min-w-[640px]">
                <thead>
                  <tr className="text-[11px] text-[#5a4f45] border-b border-[#1e1914]">
                    <th className="px-5 py-3 font-bold">العميل</th>
                    <th className="px-5 py-3 font-bold">طلبات مُسلّمة</th>
                    <th className="px-5 py-3 font-bold">المنفق (مُسلّمة)</th>
                    <th className="px-5 py-3 font-bold">آخر طلب</th>
                    <th className="px-5 py-3 font-bold">التفاصيل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1612]">
                  {paginated.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => setSelected(c)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelected(c);
                        }
                      }}
                      tabIndex={0}
                      role="button"
                      aria-label={`عرض بيانات العميل ${c.name}`}
                      className="cursor-pointer transition-colors hover:bg-[#1a1512] focus:outline-none focus-visible:bg-[#1a1512] focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[#ff7a00]/40"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#ff7a00]/15 text-[#ff7a00] font-black text-sm border border-[#ff7a00]/20">
                            {c.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{c.name}</p>
                            <div className="flex items-center gap-1.5">
                              <p className="text-[11px] text-[#5a4f45]" dir="ltr">{c.phone}</p>
                              <button onClick={(e) => { e.stopPropagation(); copyPhone(c.phone); }} aria-label={`نسخ هاتف ${c.name}`} className="text-[#5a4f45] hover:text-[#ff7a00] transition-colors">
                                <Phone className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center rounded-full bg-[#ff7a00]/15 text-[#ff7a00] border border-[#ff7a00]/25 px-2.5 py-0.5 text-xs font-black">
                          {getStats(c.phone).count}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-black text-[#ff7a00] text-sm">{getStats(c.phone).spent.toLocaleString()} ج.م</td>
                      <td className="px-5 py-3.5 text-xs text-[#5a4f45]">{formatDate(c.lastOrderAt)}</td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); setSelected(c); }}
                          className="flex items-center gap-1 rounded-lg bg-[#1f1915] border border-[#2a231d] px-3 py-1.5 text-xs font-bold text-[#a89f94] hover:text-white hover:border-[#ff7a00]/40 transition-colors"
                        >
                          تفاصيل <ChevronLeft className="h-3.5 w-3.5" />
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

      {/* Modal تفاصيل العميل */}
      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={selected ? `تفاصيل العميل — ${selected.name}` : ""} size="lg">
        {selected && (
          <div className="space-y-5">
            {/* بيانات العميل */}
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: "الاسم",         value: selected.name },
                { label: "الهاتف",        value: selected.phone, ltr: true },
                { label: "أول طلب",       value: formatDate(selected.firstOrderAt) },
                { label: "آخر طلب",       value: formatDate(selected.lastOrderAt) },
                { label: "الطلبات المُسلّمة", value: `${getStats(selected.phone).count} طلب` },
                { label: "المنفق (مُسلّمة)", value: `${getStats(selected.phone).spent.toLocaleString()} ج.م` },
              ].map(({ label, value, ltr }) => (
                <div key={label} className="rounded-xl bg-[#1a1512] border border-[#2a231d] p-3.5">
                  <p className="text-[10px] text-[#5a4f45] mb-1">{label}</p>
                  <p className="text-sm font-bold text-white" dir={ltr ? "ltr" : undefined}>{value}</p>
                </div>
              ))}
            </div>

            {/* عناوين */}
            {selected.addresses.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-[#ff7a00] uppercase tracking-wider">العناوين المسجلة</h3>
                {selected.addresses.map((addr, i) => (
                  <div key={i} className="rounded-xl bg-[#1a1512] border border-[#2a231d] px-4 py-3 text-sm text-[#c4b9ad]">
                    {addr}
                  </div>
                ))}
              </div>
            )}

            {/* سجل الطلبات */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-[#ff7a00] uppercase tracking-wider">سجل الطلبات ({customerOrders.length})</h3>
              {customerOrders.length === 0 ? (
                <p className="text-sm text-[#5a4f45] py-4 text-center">لا توجد طلبات مسجلة في النظام الحالي</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {customerOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between rounded-xl bg-[#1a1512] border border-[#2a231d] px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-white">#{order.id}</span>
                        <StatusBadge status={order.status} />
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-[#ff7a00]">{order.total} ج.م</p>
                        <p className="text-[10px] text-[#5a4f45]">{formatDate(order.createdAt)}</p>
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
