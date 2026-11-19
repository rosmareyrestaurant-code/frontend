import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { OrderModel } from "@/models/Order";
import {
  success,
  serverError,
  AppError,
  getPaginationParams,
} from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import { toAdminOrder } from "@/lib/serialize";
import { ORDER_STATUSES } from "@/lib/constants";


export const instant = false;
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    await connectToDatabase();

    const sp = req.nextUrl.searchParams;
    const q = sp.get("q")?.trim();
    const status = sp.get("status");
    const dateFrom = sp.get("dateFrom");
    const dateTo = sp.get("dateTo");
    const { page, limit, skip } = getPaginationParams(sp);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};

    if (status && status !== "all" && ORDER_STATUSES.includes(status as never)) {
      filter.orderStatus = status;
    }
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo + "T23:59:59Z");
    }
    if (q) {
      filter.$or = [
        { orderNumber: { $regex: q, $options: "i" } },
        { customerName: { $regex: q, $options: "i" } },
        { customerPhone: { $regex: q, $options: "i" } },
      ];
    }

    const [orders, total] = await Promise.all([
      OrderModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      OrderModel.countDocuments(filter),
    ]);

    return success({
      orders: orders.map((o) => toAdminOrder(o as Parameters<typeof toAdminOrder>[0])),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    if (e instanceof AppError)
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    console.error("[GET /api/admin/orders]", e);
    return serverError();
  }
}
