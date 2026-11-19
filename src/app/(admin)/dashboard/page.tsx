"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingBag, TrendingUp, Package, Users,
  Clock, ChevronLeft, Phone,
} from "lucide-react";
import { StatCard } from "@/components/admin/shared/StatCard";
import { AdminWelcomeHero } from "@/components/admin/dashboard/AdminWelcomeHero";
import { MOCK_ORDERS } from "@/data/admin/orders";
import { MOCK_ADMIN_PRODUCTS } from "@/data/admin/products";
import { MOCK_ADMIN_CUSTOMERS } from "@/data/admin/customers";

export default function DashboardPage() {
  const stats = useMemo(() => {
    const pending = MOCK_ORDERS.filter((o) => o.status === "pending").length;
    const revenue = MOCK_ORDERS
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + o.total, 0);
    return { pending, revenue };
  }, []);

  const topProducts = useMemo(() => {
    const counts: Record<string, { name: string; image: string; count: number }> = {};
    MOCK_ORDERS.filter((o) => o.status !== "cancelled").forEach((order) => {
      order.items.forEach((item) => {
        if (!counts[item.productId]) {
          counts[item.productId] = { name: item.productName, image: item.productImage, count: 0 };
        }
        counts[item.productId].count += item.quantity;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([id, v]) => ({ id, ...v }));
  }, []);

  const recentOrders = MOCK_ORDERS.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* بانر الترحيب الهيرو الفاخر للوحة التحكم */}
      <AdminWelcomeHero pendingOrdersCount={stats.pending} adminName="أ/ محمد هشام" />

      {/* البطاقات العلوية */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
        <StatCard
          title="إجمالي الطلبات"
          value={MOCK_ORDERS.length}
          icon={ShoppingBag}
          trend={{ value: "+8% هذا الأسبوع", positive: true }}
        />
        <StatCard
          title="في الانتظار"
          value={stats.pending}
          icon={Clock}
          iconColor="text-yellow-400"
        />
        <StatCard
          title="إجمالي المبيعات"
          value={`${stats.revenue.toLocaleString()} ج.م`}
          icon={TrendingUp}
          iconColor="text-emerald-400"
          trend={{ value: "+12% هذا الشهر", positive: true }}
        />
        <StatCard
          title="المنتجات"
          value={MOCK_ADMIN_PRODUCTS.length}
          icon={Package}
          iconColor="text-sky-400"
          subtitle={`${MOCK_ADMIN_PRODUCTS.filter((p) => p.isAvailable).length} متاح`}
        />
        <StatCard
          title="إجمالي العملاء"
          value={MOCK_ADMIN_CUSTOMERS.length}
          icon={Users}
          iconColor="text-violet-400"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* جدول الطلبات — بيانات العميل ورقم الطلب والسعر فقط */}
        <section className="overflow-hidden rounded-2xl border border-[#26201a] bg-[#141210] lg:col-span-2">
          <div className="flex items-center justify-between border-b border-[#231d17] px-5 py-4">
            <h2 className="text-sm font-bold text-white">آخر الطلبات</h2>
            <Link
              href="/dashboard/orders"
              className="flex items-center gap-1 text-xs font-bold text-[#ff7a00] hover:underline"
            >
              عرض الكل <ChevronLeft className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-right text-sm">
              <thead>
                <tr className="border-b border-[#1e1914] text-[11px] text-[#6f655b]">
                  <th className="px-5 py-3 font-bold">رقم الطلب</th>
                  <th className="px-5 py-3 font-bold">العميل</th>
                  <th className="px-5 py-3 font-bold">الهاتف</th>
                  <th className="px-5 py-3 font-bold">الإجمالي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e1914]">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="transition-colors hover:bg-[#171310]">
                    <td className="px-5 py-3.5">
                      <span className="inline-flex rounded-lg bg-[#ff7a00]/10 px-2 py-1 text-xs font-black text-[#ff9838] ring-1 ring-[#ff7a00]/20">
                        #{order.id}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-bold text-white">
                      {order.customerName}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span dir="ltr" className="text-[11px] text-[#8a8076]">
                          {order.customerPhone}
                        </span>
                        <a
                          href={`tel:${order.customerPhone}`}
                          aria-label={`الاتصال بـ ${order.customerName}`}
                          className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/25 transition-colors hover:bg-emerald-500/25"
                        >
                          <Phone className="h-3 w-3" />
                        </a>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-black text-[#ff7a00]">
                      {order.total} ج.م
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* الأكثر طلباً */}
        <section className="rounded-2xl border border-[#26201a] bg-[#141210]">
          <div className="border-b border-[#231d17] px-5 py-4">
            <h2 className="text-sm font-bold text-white">الأكثر طلباً</h2>
          </div>
          <div className="divide-y divide-[#1e1914]">
            {topProducts.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                <span className="w-4 shrink-0 text-xs font-black text-[#5a4f45]">{i + 1}</span>
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-[#1a1512]">
                  <Image src={p.image} alt={p.name} fill className="object-cover" sizes="36px" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-white">{p.name}</p>
                </div>
                <span className="shrink-0 text-xs font-black text-[#ff7a00]">{p.count}×</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
