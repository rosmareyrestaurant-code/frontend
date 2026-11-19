/**
 * GET /api/admin/customers
 * يستخرج بيانات العملاء من جدول الطلبات (تجميع بالهاتف).
 */
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
import type { PipelineStage } from "mongoose";


export const instant = false;
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    await connectToDatabase();

    const sp = req.nextUrl.searchParams;
    const q = sp.get("q")?.trim();
    const { page, limit, skip } = getPaginationParams(sp);

    const basePipeline: PipelineStage[] = [
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
      basePipeline.push({
        $match: {
          $or: [
            { _id: { $regex: q, $options: "i" } },
            { name: { $regex: q, $options: "i" } },
          ],
        },
      });
    }

    basePipeline.push({ $sort: { lastOrderAt: -1 } });

    const dataPipeline: PipelineStage[] = [
      ...basePipeline,
      { $skip: skip },
      { $limit: limit },
    ];
    const countPipeline: PipelineStage[] = [
      ...basePipeline,
      { $count: "total" },
    ];

    const [customers, countResult] = await Promise.all([
      OrderModel.aggregate(dataPipeline),
      OrderModel.aggregate(countPipeline),
    ]);

    const total: number =
      (countResult[0] as { total?: number })?.total ?? 0;

    return success({
      customers: (
        customers as {
          _id: string;
          name: string;
          addresses: string[];
          ordersCount: number;
          totalSpent: number;
          firstOrderAt: string;
          lastOrderAt: string;
        }[]
      ).map((c) => ({
        id: c._id,
        name: c.name,
        phone: c._id,
        addresses: c.addresses.filter(Boolean),
        ordersCount: c.ordersCount,
        totalSpent: c.totalSpent,
        firstOrderAt: c.firstOrderAt,
        lastOrderAt: c.lastOrderAt,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    if (e instanceof AppError)
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    console.error("[GET /api/admin/customers]", e);
    return serverError();
  }
}
