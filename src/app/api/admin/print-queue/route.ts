/**
 * GET /api/admin/print-queue?limit=5
 * الطلبات المستحقة للطباعة على جهاز الكاشير — الموظف المسجّل فقط.
 * لا يغيّر أي بيانات؛ الحجز الفعلي بيحصل في /claim بتحديث ذري.
 */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { OrderModel } from "@/models/Order";
import { success, serverError, AppError } from "@/lib/api-response";
import { requireStaff } from "@/lib/auth";
import { toAdminOrder } from "@/lib/serialize";
import { duePrintFilter } from "@/lib/print-queue";

export const instant = false;

export async function GET(req: NextRequest) {
  try {
    await requireStaff();
    await connectToDatabase();

    const rawLimit = Number(req.nextUrl.searchParams.get("limit"));
    const limit = Number.isFinite(rawLimit)
      ? Math.min(10, Math.max(1, Math.floor(rawLimit)))
      : 5;

    const orders = await OrderModel.find(duePrintFilter())
      .sort({ createdAt: 1 })
      .limit(limit)
      .lean();

    const res = success({
      orders: orders.map((o) =>
        toAdminOrder(o as Parameters<typeof toAdminOrder>[0]),
      ),
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
    console.error("[GET /api/admin/print-queue]", e);
    return serverError();
  }
}
