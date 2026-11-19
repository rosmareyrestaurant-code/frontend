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

    const [
      totalOrders,
      newOrders,
      totalProducts,
      ordersByStatusRaw,
      recentOrderDocs,
      topProductsRaw,
      salesByDayRaw,
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
          },
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
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
      topProducts: (topProductsRaw as { _id: string; name: string; image: string; count: number }[]).map(
        (p) => ({ id: p._id, name: p.name, image: p.image, count: p.count }),
      ),
      salesByDay: (salesByDayRaw as { _id: string; total: number }[]).map(
        (d) => ({ date: d._id, total: d.total }),
      ),
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
