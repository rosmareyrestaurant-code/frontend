"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { NEW_ORDERS_EVENT } from "@/hooks/useNewOrders";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  BadgeDollarSign,
  BarChart3,
  CalendarDays,
  ChevronLeft,
  Download,
  Loader2,
  ShoppingBag,
  Tag,
  TrendingUp,
  Ticket,
  UsersRound,
  UtensilsCrossed,
} from "lucide-react";
import { StatCard } from "@/components/admin/shared/StatCard";
import { AdminWelcomeHero } from "@/components/admin/dashboard/AdminWelcomeHero";
import { StatusBadge } from "@/components/admin/shared/StatusBadge";
import { useToast } from "@/components/admin/shared/Toast";
import type { DashboardStats, AdminOrder } from "@/types/admin";

// Mock Data معطّلة — الداشبورد بتقرأ الإحصائيات من الـ API
import { ORDER_STATUSES } from "@/lib/constants";

const EMPTY_STATS: DashboardStats = {
  totalOrders: 0,
  newOrders: 0,
  totalRevenue: 0,
  totalProducts: 0,
  totalCustomers: 0,
  ordersByStatus: ORDER_STATUSES.reduce(
    (acc, s) => ({ ...acc, [s]: 0 }),
    {} as DashboardStats["ordersByStatus"]
  ),
  recentOrders: [],
  topProducts: [],
  salesByDay: [],
  monthlySales: [],
  thisMonth: { orders: 0, revenue: 0, avgOrderValue: 0 },
};

function formatOrderDate(iso: string) {
  const d = new Date(iso);
  const date = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${date} - ${time}`;
}

export default function DashboardPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [offersStats, setOffersStats] = useState({ active: 0, total: 0 });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/offers?limit=100")
      .then((r) => r.json())
      .then((d) => {
        const offers: { isActive: boolean }[] = d?.data?.offers ?? [];
        if (d.success) {
          setOffersStats({
            active: offers.filter((o) => o.isActive).length,
            total: d.data.pagination?.total ?? offers.length,
          });
        }
      })
      .catch(() => {});
  }, []);

  const loadStats = useCallback(() => {
    fetch("/api/admin/dashboard")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) setStats(d.data);
        // إذا فشل أو أعاد بيانات فارغة، Mock Data تبقى ظاهرة
      })
      .catch(() => {
        // API غير متاح — Mock Data ظاهرة
      });
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  // طلب جديد وصل — نحدّث الإحصائيات بهدوء
  useEffect(() => {
    const onNewOrders = () => loadStats();
    window.addEventListener(NEW_ORDERS_EVENT, onNewOrders);
    return () => window.removeEventListener(NEW_ORDERS_EVENT, onNewOrders);
  }, [loadStats]);

  const recentOrders: AdminOrder[] = (stats.recentOrders ?? []).slice(0, 5);
  const pendingOrders = stats.ordersByStatus?.pending ?? 0;

  const topProducts = (stats.topProducts ?? []).slice(0, 6);
  const monthlySales = stats.monthlySales ?? [];
  const maxMonthlyRevenue = Math.max(1, ...monthlySales.map((m) => m.revenue));

  const handleExportAnalytics = async () => {
    setExporting(true);
    try {
      const { exportAnalyticsExcel } = await import("@/lib/analyticsExcel");
      exportAnalyticsExcel(stats);
      showToast("تم تصدير التحليلات كملف Excel", "success");
    } catch {
      showToast("تعذّر تصدير التحليلات", "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <AdminWelcomeHero pendingOrders={pendingOrders} />

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          title="إجمالي الطلبات"
          value={stats.totalOrders}
          icon={ShoppingBag}
          trend={{ value: "+12%", positive: true }}
          spark={[4, 6, 5, 7, 6, 9, 8, 10]}
        />
        <StatCard
          title="إجمالي المبيعات"
          value={`${stats.totalRevenue.toLocaleString("en-US")} ج.م`}
          icon={BadgeDollarSign}
          trend={{ value: "+18%", positive: true }}
          spark={[5, 7, 6, 8, 7, 9, 8, 11]}
        />
        <StatCard
          title="المستخدمين الجدد"
          value={stats.totalCustomers}
          icon={UsersRound}
          trend={{ value: "+10%", positive: true }}
          spark={[3, 5, 4, 6, 7, 6, 8, 9]}
        />
        <StatCard
          title="العروض النشطة"
          value={offersStats.active}
          icon={Tag}
          trend={{ value: "+0%", positive: true }}
          spark={[4, 4, 5, 4, 5, 4, 4, 5]}
        />
        <StatCard
          title="إجمالي العروض"
          value={offersStats.total}
          icon={Ticket}
          trend={{ value: "+0%", positive: true }}
          spark={[4, 4, 5, 4, 5, 4, 4, 5]}
        />
        <StatCard
          title="إجمالي المنتجات"
          value={stats.totalProducts}
          icon={UtensilsCrossed}
          trend={{ value: "+0%", positive: true }}
          spark={[6, 6, 7, 7, 8, 8, 8, 9]}
        />
      </div>

      {/* تحليلات المبيعات */}
      <section className="overflow-hidden rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 pb-3 pt-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-[18px] w-[18px] text-[var(--color-primary)]" strokeWidth={2} />
            <h2 className="text-[15px] font-black text-[var(--color-text-primary)]">تحليلات المبيعات</h2>
          </div>
          <button
            type="button"
            onClick={handleExportAnalytics}
            disabled={exporting}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--color-primary-soft)] bg-[var(--color-primary-soft)] px-3 py-1.5 text-[11px] font-bold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary-soft)] disabled:cursor-wait disabled:opacity-70"
          >
            {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            {exporting ? "جاري التصدير..." : "تصدير التحليلات Excel"}
          </button>
        </div>

        <div className="grid gap-3 px-5 pb-4 sm:grid-cols-3">
          <div className="rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-3.5">
            <p className="text-[11px] font-bold text-[var(--color-text-muted)]">طلبات الشهر الحالي</p>
            <p className="mt-1 text-[20px] font-black leading-none text-[var(--color-text-primary)]">{stats.thisMonth.orders}</p>
          </div>
          <div className="rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-3.5">
            <p className="text-[11px] font-bold text-[var(--color-text-muted)]">مبيعات الشهر الحالي</p>
            <p className="mt-1 text-[20px] font-black leading-none text-[var(--color-text-primary)]">
              {stats.thisMonth.revenue.toLocaleString("en-US")} <span className="text-[11px] font-bold text-[var(--color-text-muted)]">ج.م</span>
            </p>
          </div>
          <div className="rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface-secondary)] p-3.5">
            <p className="text-[11px] font-bold text-[var(--color-text-muted)]">متوسط قيمة الطلب</p>
            <p className="mt-1 text-[20px] font-black leading-none text-[var(--color-text-primary)]">
              {stats.thisMonth.avgOrderValue.toLocaleString("en-US")} <span className="text-[11px] font-bold text-[var(--color-text-muted)]">ج.م</span>
            </p>
          </div>
        </div>

        {monthlySales.length === 0 ? (
          <p className="px-5 py-8 text-center text-[13px] text-[var(--color-text-muted)]">لا توجد بيانات مبيعات بعد</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[460px] text-right">
              <thead>
                <tr className="bg-[var(--color-surface-secondary)] text-[11px] font-bold text-[var(--color-text-muted)]">
                  <th className="px-5 py-2.5 font-bold">الشهر</th>
                  <th className="px-5 py-2.5 font-bold">عدد الطلبات</th>
                  <th className="px-5 py-2.5 font-bold">المبيعات</th>
                  <th className="px-5 py-2.5 font-bold">المقارنة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border-subtle)]">
                {monthlySales.map((m, i) => (
                  <tr key={m.month} className={`text-[12px] ${i === monthlySales.length - 1 ? "bg-[var(--color-surface-soft)]" : ""}`}>
                    <td className="px-5 py-3 font-bold text-[var(--color-text-primary)]">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                        {m.label}
                        {i === monthlySales.length - 1 && (
                          <span className="rounded-full bg-[var(--color-primary-soft)] px-1.5 py-0.5 text-[9.5px] font-black text-[var(--color-primary)]">الشهر الحالي</span>
                        )}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-bold text-[var(--color-text-primary)]">{m.orders}</td>
                    <td className="px-5 py-3 font-black text-[var(--color-text-primary)]">{m.revenue.toLocaleString("en-US")} ج.م</td>
                    <td className="px-5 py-3">
                      <div className="h-2 w-full max-w-[160px] overflow-hidden rounded-full bg-[var(--color-surface-hover)]">
                        <div
                          className="h-full rounded-full bg-[var(--color-primary-border)]"
                          style={{ width: `${Math.max(m.revenue > 0 ? 4 : 0, Math.round((m.revenue / maxMonthlyRevenue) * 100))}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* أحدث الطلبات + أفضل المنتجات مبيعاً */}
      <div className="grid gap-4 xl:grid-cols-5">
        <section className="flex min-w-0 flex-col overflow-hidden rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] xl:col-span-3">
          <div className="flex items-center justify-between px-5 pb-3 pt-4">
            <h2 className="text-[15px] font-black text-[var(--color-text-primary)]">أحدث الطلبات</h2>
            <Link
              href="/dashboard/orders"
              className="flex items-center gap-1 text-[12px] font-bold text-[var(--color-primary)] transition-colors hover:text-[var(--color-text-primary)]"
            >
              عرض الكل <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="px-5 py-10 text-center text-[13px] text-[var(--color-text-muted)]">لا توجد طلبات بعد</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-right">
                <thead>
                  <tr className="bg-[var(--color-surface-secondary)] text-[11px] font-bold text-[var(--color-text-muted)]">
                    <th className="px-4 py-2.5 font-bold">رقم الطلب</th>
                    <th className="px-4 py-2.5 font-bold">العميل</th>
                    <th className="px-4 py-2.5 font-bold">المبلغ</th>
                    <th className="px-4 py-2.5 font-bold">الحالة</th>
                    <th className="px-4 py-2.5 font-bold">التاريخ</th>
                    <th className="w-10 px-3 py-2.5" aria-label="عرض الطلب" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-subtle)]">
                  {recentOrders.map((order) => (
                    <tr key={order.id} onClick={() => router.push("/dashboard/orders")}
                      tabIndex={0} role="button" aria-label={`فتح الطلب ${order.orderNumber ?? order.id}`}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push("/dashboard/orders"); } }}
                      className="cursor-pointer text-[12px] transition-colors hover:bg-[var(--color-surface-soft)] focus-visible:bg-[var(--color-surface-soft)] focus-visible:outline-none">
                      <td className="px-4 py-3 font-black text-[var(--color-text-primary)]" dir="ltr">
                        #{order.orderNumber ?? order.id}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[var(--color-text-secondary)]">{order.customerName}</td>
                      <td className="px-4 py-3 font-bold text-[var(--color-text-primary)]">{order.total} ج.م</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3 text-[11px] font-medium text-[var(--color-text-muted)]" dir="ltr">
                        {formatOrderDate(order.createdAt)}
                      </td>
                      <td className="px-3 py-3">
                        <Link
                          href="/dashboard/orders"
                          aria-label={`تفاصيل الطلب ${order.orderNumber ?? order.id}`}
                          className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-border-subtle)] hover:text-[var(--color-primary)]"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="flex min-w-0 flex-col overflow-hidden rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)] xl:col-span-2">
          <div className="flex items-center justify-between px-5 pb-3 pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-[18px] w-[18px] text-[var(--color-primary)]" strokeWidth={2} />
              <h2 className="text-[15px] font-black text-[var(--color-text-primary)]">أفضل المنتجات مبيعاً</h2>
            </div>
            <Link
              href="/dashboard/products"
              className="flex items-center gap-1 text-[12px] font-bold text-[var(--color-primary)] transition-colors hover:text-[var(--color-text-primary)]"
            >
              عرض الكل <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>

          {topProducts.length === 0 ? (
            <p className="px-5 py-10 text-center text-[13px] text-[var(--color-text-muted)]">لا توجد مبيعات بعد</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[360px] text-right">
                <thead>
                  <tr className="bg-[var(--color-surface-secondary)] text-[11px] font-bold text-[var(--color-text-muted)]">
                    <th className="w-12 px-4 py-2.5 font-bold">#</th>
                    <th className="px-4 py-2.5 font-bold">المنتج</th>
                    <th className="px-4 py-2.5 font-bold">الكمية</th>
                    <th className="px-4 py-2.5 font-bold">المبيعات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-subtle)]">
                  {topProducts.map((product, index) => (
                    <tr key={product.id} onClick={() => router.push(`/dashboard/products?edit=${product.id}`)}
                      tabIndex={0} role="button" aria-label={`فتح ${product.name}`}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push(`/dashboard/products?edit=${product.id}`); } }}
                      className="cursor-pointer text-[12px] transition-colors hover:bg-[var(--color-surface-soft)] focus-visible:bg-[var(--color-surface-soft)] focus-visible:outline-none">
                      <td className="px-4 py-2.5">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black ${
                            index < 3 ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]" : "bg-[var(--color-border-subtle)] text-[var(--color-text-muted)]"
                          }`}
                        >
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <Image
                            src={product.image}
                            alt={product.name}
                            width={36}
                            height={36}
                            className="h-9 w-9 shrink-0 rounded-lg object-cover"
                          />
                          <span className="max-w-[170px] truncate font-semibold text-[var(--color-text-primary)]">
                            {product.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 font-bold text-[var(--color-text-primary)]">{product.count}</td>
                      <td className="px-4 py-2.5 font-bold text-[var(--color-primary)]">{product.revenue.toLocaleString("en-US")} ج.م</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

    </div>
  );
}
