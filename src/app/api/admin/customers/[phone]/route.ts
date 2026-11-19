/**
 * GET /api/admin/customers/:phone
 * ملف العميل + سجل طلباته كاملاً.
 */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { OrderModel } from "@/models/Order";
import { success, notFound, serverError, AppError } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import { toAdminOrder } from "@/lib/serialize";


export const instant = false;
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ phone: string }> },
) {
  try {
    await requireAdmin();
    const { phone } = await params;
    await connectToDatabase();

    const orders = await OrderModel.find({ customerPhone: phone })
      .sort({ createdAt: -1 })
      .lean();

    if (!orders.length) return notFound("لا توجد طلبات لهذا العميل");

    const totalSpent = orders
      .filter((o) => (o as { orderStatus: string }).orderStatus !== "cancelled")
      .reduce((s, o) => s + ((o as { total: number }).total ?? 0), 0);

    const addresses = [
      ...new Set(
        orders.map((o) => (o as { customerAddress: string }).customerAddress).filter(Boolean),
      ),
    ];

    return success({
      customer: {
        id: phone,
        name: (orders[0] as { customerName: string }).customerName,
        phone,
        addresses,
        ordersCount: orders.length,
        totalSpent,
        firstOrderAt: (orders[orders.length - 1] as { createdAt: Date }).createdAt,
        lastOrderAt: (orders[0] as { createdAt: Date }).createdAt,
      },
      orders: orders.map((o) =>
        toAdminOrder(o as Parameters<typeof toAdminOrder>[0]),
      ),
    });
  } catch (e) {
    if (e instanceof AppError)
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    console.error("[GET /api/admin/customers/:phone]", e);
    return serverError();
  }
}
