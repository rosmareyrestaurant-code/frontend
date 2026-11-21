import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { OrderModel } from "@/models/Order";
import { requireStaff } from "@/lib/auth";
import { ORDER_STATUSES } from "@/lib/constants";
import { toAdminOrder } from "@/lib/serialize";
import { buildCsv, cairoTimestamp, csvResponse } from "@/lib/csv";
import { AppError, serverError } from "@/lib/api-response";
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@/types/admin";

export const instant = false;

const EXPORT_LIMIT = 5000;

export async function GET(req: NextRequest) {
  try {
    await requireStaff();
    await connectToDatabase();

    const sp = req.nextUrl.searchParams;
    const q = sp.get("q")?.trim();
    const status = sp.get("status");
    const dateFrom = sp.get("dateFrom");
    const dateTo = sp.get("dateTo");

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

    const docs = await OrderModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(EXPORT_LIMIT)
      .lean();

    const rows = docs.map((doc) => {
      const order = toAdminOrder(doc as Parameters<typeof toAdminOrder>[0]);
      const items = order.items
        .map((item) => {
          const size = item.selectedSize ? ` (${item.selectedSize.name})` : "";
          return `${item.quantity}× ${item.productName}${size}`;
        })
        .join(" | ");
      return [
        order.orderNumber ?? order.id,
        cairoTimestamp(order.createdAt),
        order.customerName,
        order.customerPhone,
        order.customerAddress,
        order.area ?? "",
        items,
        order.subtotal,
        order.deliveryFee ?? 0,
        order.discount ?? 0,
        order.total,
        PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod,
        ORDER_STATUS_LABELS[order.status] ?? order.status,
        order.notes ?? "",
      ];
    });

    const csv = buildCsv(
      [
        "رقم الطلب",
        "التاريخ",
        "العميل",
        "الهاتف",
        "العنوان",
        "المنطقة",
        "الأصناف",
        "المجموع الفرعي",
        "التوصيل",
        "الخصم",
        "الإجمالي",
        "طريقة الدفع",
        "الحالة",
        "ملاحظات",
      ],
      rows,
    );

    const stamp = cairoTimestamp(new Date()).slice(0, 10);
    return csvResponse(csv, `rosemary-orders-${stamp}.csv`);
  } catch (e) {
    if (e instanceof AppError) {
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    }
    console.error("[GET /api/admin/orders/export]", e);
    return serverError();
  }
}
