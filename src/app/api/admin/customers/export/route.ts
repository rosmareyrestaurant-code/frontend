import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { OrderModel } from "@/models/Order";
import { requireAdmin } from "@/lib/auth";
import { buildCsv, cairoTimestamp, csvResponse } from "@/lib/csv";
import { AppError, serverError } from "@/lib/api-response";
import type { PipelineStage } from "mongoose";

export const instant = false;

const EXPORT_LIMIT = 10000;

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    await connectToDatabase();

    const q = req.nextUrl.searchParams.get("q")?.trim();

    const pipeline: PipelineStage[] = [
      {
        $group: {
          _id: "$customerPhone",
          name: { $last: "$customerName" },
          addresses: { $addToSet: "$customerAddress" },
          ordersCount: { $sum: 1 },
          totalSpent: {
            $sum: {
              $cond: [{ $ne: ["$orderStatus", "cancelled"] }, "$total", 0],
            },
          },
          firstOrderAt: { $min: "$createdAt" },
          lastOrderAt: { $max: "$createdAt" },
        },
      },
    ];

    if (q) {
      pipeline.push({
        $match: {
          $or: [
            { _id: { $regex: q, $options: "i" } },
            { name: { $regex: q, $options: "i" } },
          ],
        },
      });
    }
    pipeline.push({ $sort: { lastOrderAt: -1 } }, { $limit: EXPORT_LIMIT });

    const customers = (await OrderModel.aggregate(pipeline)) as {
      _id: string;
      name: string;
      addresses: string[];
      ordersCount: number;
      totalSpent: number;
      firstOrderAt: Date;
      lastOrderAt: Date;
    }[];

    const rows = customers.map((c) => [
      c.name,
      c._id,
      c.ordersCount,
      c.totalSpent,
      cairoTimestamp(c.firstOrderAt),
      cairoTimestamp(c.lastOrderAt),
      (c.addresses ?? []).filter(Boolean).join(" | "),
    ]);

    const csv = buildCsv(
      ["الاسم", "الهاتف", "عدد الطلبات", "إجمالي الإنفاق", "أول طلب", "آخر طلب", "العناوين"],
      rows,
    );

    const stamp = cairoTimestamp(new Date()).slice(0, 10);
    return csvResponse(csv, `rosemary-customers-${stamp}.csv`);
  } catch (e) {
    if (e instanceof AppError) {
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    }
    console.error("[GET /api/admin/customers/export]", e);
    return serverError();
  }
}
