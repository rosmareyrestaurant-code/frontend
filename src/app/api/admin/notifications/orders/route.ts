/**
 * GET /api/admin/notifications/orders?since=<epoch-ms>
 * إشعارات الطلبات الجديدة للداشبورد — بتشتغل بالـ polling عشان تشتغل على أي استضافة
 * (Vercel / Hostinger / Namecheap) من غير WebSockets أو Redis.
 */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { OrderModel } from "@/models/Order";
import { success, serverError, AppError } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";

export const instant = false;

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    await connectToDatabase();

    const sinceRaw = Number(req.nextUrl.searchParams.get("since"));
    const since = Number.isFinite(sinceRaw) && sinceRaw > 0 ? new Date(sinceRaw) : null;

    const [newOrders, pendingCount] = await Promise.all([
      since
        ? OrderModel.find({ createdAt: { $gt: since } })
            .sort({ createdAt: -1 })
            .limit(20)
            .select({ orderNumber: 1, customerName: 1, total: 1, createdAt: 1 })
            .lean()
        : Promise.resolve([]),
      OrderModel.countDocuments({ orderStatus: "pending" }),
    ]);

    const res = success({
      orders: newOrders.map((o) => ({
        id: String(o._id),
        orderNumber: o.orderNumber,
        customerName: o.customerName,
        total: o.total,
        createdAt: o.createdAt instanceof Date ? o.createdAt.toISOString() : String(o.createdAt),
      })),
      pendingCount,
      serverTime: Date.now(),
    });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e) {
    if (e instanceof AppError)
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    console.error("[GET /api/admin/notifications/orders]", e);
    return serverError();
  }
}
