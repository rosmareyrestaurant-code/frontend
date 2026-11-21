import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { OrderModel } from "@/models/Order";
import { ProductModel } from "@/models/Product";
import { success, serverError, AppError } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import { toAdminOrder } from "@/lib/serialize";
import type { OrderStatus } from "@/types/admin";
import { ORDER_STATUSES } from "@/lib/constants";


export const instant = false;
export async function GET(_req: NextRequest) {
  try {
    await requireAdmin();
    await connectToDatabase();

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const sixMonthsStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));

    const [
      totalOrders,
      newOrders,
      totalProducts,
      ordersByStatusRaw,
      recentOrderDocs,
      topProductsRaw,
      salesByDayRaw,
      monthlySalesRaw,
      thisMonthRaw,
    ] = await Promise.all([
      OrderModel.countDocuments(),
      OrderModel.countDocuments({ orderStatus: "pending" }),
      ProductModel.countDocuments({ isVisible: true }),
      // توزيع الطلبات حسب الحالة
      OrderModel.aggregate([
        { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
      ]),
      // آخر 10 طلبات
      OrderModel.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      // أكثر المنتجات طلباً
      OrderModel.aggregate([
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.productId",
            name: { $first: "$items.productName" },
            image: { $first: "$items.productImage" },
            count: { $sum: "$items.quantity" },
            revenue: {
              $sum: {
                $ifNull: [
                  "$items.itemTotal",
                  { $multiply: ["$items.price", "$items.quantity"] },
                ],
              },
            },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      // مبيعات آخر 30 يوم
      OrderModel.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo },
            orderStatus: { $nin: ["cancelled"] },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            total: { $sum: "$total" },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // مبيعات آخر 6 شهور (بدون الملغي)
      OrderModel.aggregate([
        {
          $match: {
            createdAt: { $gte: sixMonthsStart },
            orderStatus: { $nin: ["cancelled"] },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            orders: { $sum: 1 },
            revenue: { $sum: "$total" },
          },
        },
      ]),
      // ملخص الشهر الحالي
      OrderModel.aggregate([
        {
          $match: {
            createdAt: { $gte: monthStart },
            orderStatus: { $nin: ["cancelled"] },
          },
        },
        { $group: { _id: null, orders: { $sum: 1 }, revenue: { $sum: "$total" } } },
      ]),
    ]);

    // إجمالي المبيعات (الطلبات غير الملغاة)
    const revenueAgg = await OrderModel.aggregate([
      { $match: { orderStatus: { $nin: ["cancelled"] } } },
      { $group: { _id: null, total: { $sum: "$total" } } },
    ]);
    const totalRevenue: number = revenueAgg[0]?.total ?? 0;

    // العملاء الفريدون (بأرقام هواتف مختلفة)
    const totalCustomers = await OrderModel.distinct("customerPhone").then(
      (r) => r.length,
    );

    // بناء Map للحالات
    const ordersByStatus: Record<OrderStatus, number> = {} as Record<
      OrderStatus,
      number
    >;
    for (const s of ORDER_STATUSES) ordersByStatus[s] = 0;
    for (const r of ordersByStatusRaw as { _id: string; count: number }[]) {
      if (r._id in ordersByStatus) ordersByStatus[r._id as OrderStatus] = r.count;
    }

    // مبيعات آخر 6 شهور — بنكمّل الشهور الفاضية بأصفار
    const AR_MONTHS = [
      "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
      "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
    ];
    const monthlyMap = new Map(
      (monthlySalesRaw as { _id: string; orders: number; revenue: number }[]).map((r) => [r._id, r]),
    );
    const monthlySales = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + i, 1));
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      const found = monthlyMap.get(key);
      return {
        month: key,
        label: `${AR_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
        orders: found?.orders ?? 0,
        revenue: found?.revenue ?? 0,
      };
    });

    const thisMonthRow = (thisMonthRaw as { orders: number; revenue: number }[])[0];
    const monthOrders = thisMonthRow?.orders ?? 0;
    const monthRevenue = thisMonthRow?.revenue ?? 0;
    const thisMonth = {
      orders: monthOrders,
      revenue: monthRevenue,
      avgOrderValue: monthOrders ? Math.round(monthRevenue / monthOrders) : 0,
    };

    return success({
      totalOrders,
      newOrders,
      totalRevenue,
      totalProducts,
      totalCustomers,
      ordersByStatus,
      recentOrders: recentOrderDocs.map((o) =>
        toAdminOrder(o as Parameters<typeof toAdminOrder>[0]),
      ),
      topProducts: (
        topProductsRaw as {
          _id: string; name: string; image: string; count: number; revenue: number;
        }[]
      ).map((p) => ({
        id: p._id,
        name: p.name,
        image: p.image,
        count: p.count,
        revenue: p.revenue ?? 0,
      })),
      salesByDay: (salesByDayRaw as { _id: string; total: number }[]).map(
        (d) => ({ date: d._id, total: d.total }),
      ),
      monthlySales,
      thisMonth,
    });
  } catch (e) {
    if (e instanceof AppError)
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    console.error("[GET /api/admin/dashboard]", e);
    return serverError();
  }
}
