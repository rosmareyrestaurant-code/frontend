import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { CategoryModel } from "@/models/Category";
import { success, serverError } from "@/lib/api-response";
import { toPublicCategory } from "@/lib/serialize";
import { ProductModel } from "@/models/Product";


export const instant = false;
export async function GET(_req: NextRequest) {
  try {
    await connectToDatabase();

    const categories = await CategoryModel.find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();

    // عدد المنتجات المتاحة لكل تصنيف
    const countsByCategory = await ProductModel.aggregate([
      { $match: { isAvailable: true, isVisible: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(
      countsByCategory.map((c: { _id: string; count: number }) => [c._id, c.count]),
    );

    const data = categories.map((c) =>
      toPublicCategory(c as Parameters<typeof toPublicCategory>[0], countMap.get(c.slug) ?? 0),
    );

    return success(data);
  } catch (e) {
    console.error("[GET /api/categories]", e);
    return serverError();
  }
}
