"use client";

import { useCallback, useEffect, useState } from "react";
import { NEW_ORDERS_EVENT } from "@/hooks/useNewOrders";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  BadgeDollarSign,
  ChevronLeft,
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
};

function formatOrderDate(iso: string) {
  const d = new Date(iso);
  const date = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${date} - ${time}`;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [offersStats, setOffersStats] = useState({ active: 0, total: 0 });

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

      {/* أحدث الطلبات + أفضل المنتجات مبيعاً */}
      <div className="grid gap-4 xl:grid-cols-5">
        <section className="flex min-w-0 flex-col overflow-hidden rounded-[18px] border border-[#EDE9E0] bg-[#FBF9F6] xl:col-span-3">
          <div className="flex items-center justify-between px-5 pb-3 pt-4">
            <h2 className="text-[15px] font-black text-[#333B2E]">أحدث الطلبات</h2>
            <Link
              href="/dashboard/orders"
              className="flex items-center gap-1 text-[12px] font-bold text-[#50604D] transition-colors hover:text-[#3C4A38]"
            >
              عرض الكل <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="px-5 py-10 text-center text-[13px] text-[#9A9C90]">لا توجد طلبات بعد</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-right">
                <thead>
                  <tr className="bg-[#F4F2EE] text-[11px] font-bold text-[#8F9186]">
                    <th className="px-4 py-2.5 font-bold">رقم الطلب</th>
                    <th className="px-4 py-2.5 font-bold">العميل</th>
                    <th className="px-4 py-2.5 font-bold">المبلغ</th>
                    <th className="px-4 py-2.5 font-bold">الحالة</th>
                    <th className="px-4 py-2.5 font-bold">التاريخ</th>
                    <th className="w-10 px-3 py-2.5" aria-label="عرض الطلب" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EDE5]">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="text-[12px] transition-colors hover:bg-[#F8F6F1]">
                      <td className="px-4 py-3 font-black text-[#333B2E]" dir="ltr">
                        #{order.orderNumber ?? order.id}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#6B7264]">{order.customerName}</td>
                      <td className="px-4 py-3 font-bold text-[#333B2E]">{order.total} ج.م</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3 text-[11px] font-medium text-[#9A9C90]" dir="ltr">
                        {formatOrderDate(order.createdAt)}
                      </td>
                      <td className="px-3 py-3">
                        <Link
                          href="/dashboard/orders"
                          aria-label={`تفاصيل الطلب ${order.orderNumber ?? order.id}`}
                          className="flex h-6 w-6 items-center justify-center rounded-full text-[#B5B2A8] transition-colors hover:bg-[#F0EDE5] hover:text-[#50604D]"
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

        <section className="flex min-w-0 flex-col overflow-hidden rounded-[18px] border border-[#EDE9E0] bg-[#FBF9F6] xl:col-span-2">
          <div className="flex items-center justify-between px-5 pb-3 pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-[18px] w-[18px] text-[#50604D]" strokeWidth={2} />
              <h2 className="text-[15px] font-black text-[#333B2E]">أفضل المنتجات مبيعاً</h2>
            </div>
            <Link
              href="/dashboard/products"
              className="flex items-center gap-1 text-[12px] font-bold text-[#50604D] transition-colors hover:text-[#3C4A38]"
            >
              عرض الكل <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>

          {topProducts.length === 0 ? (
            <p className="px-5 py-10 text-center text-[13px] text-[#9A9C90]">لا توجد مبيعات بعد</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[360px] text-right">
                <thead>
                  <tr className="bg-[#F4F2EE] text-[11px] font-bold text-[#8F9186]">
                    <th className="w-12 px-4 py-2.5 font-bold">#</th>
                    <th className="px-4 py-2.5 font-bold">المنتج</th>
                    <th className="px-4 py-2.5 font-bold">عدد الطلبات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EDE5]">
                  {topProducts.map((product, index) => (
                    <tr key={product.id} className="text-[12px] transition-colors hover:bg-[#F8F6F1]">
                      <td className="px-4 py-2.5">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black ${
                            index < 3 ? "bg-[#DEE3D5] text-[#50604D]" : "bg-[#F0EDE5] text-[#9A9C90]"
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
                          <span className="max-w-[170px] truncate font-semibold text-[#333B2E]">
                            {product.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 font-bold text-[#333B2E]">{product.count}</td>
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
