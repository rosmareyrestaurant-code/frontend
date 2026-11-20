import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { CategoryModel } from "@/models/Category";
import { ProductModel } from "@/models/Product";
import {
  success,
  badRequest,
  conflict,
  serverError,
  AppError,
} from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import { toAdminCategory } from "@/lib/serialize";
import { createCategorySchema } from "@/lib/validation";
import { revalidateStorefront } from "@/lib/storefront-tags";


export const instant = false;
export async function GET(_req: NextRequest) {
  try {
    await requireAdmin();
    await connectToDatabase();

    const categories = await CategoryModel.find()
      .sort({ sortOrder: 1 })
      .lean();

    // عدد المنتجات لكل تصنيف
    const counts = await ProductModel.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(
      (counts as { _id: string; count: number }[]).map((c) => [c._id, c.count]),
    );

    return success(
      categories.map((c) =>
        toAdminCategory(
          c as Parameters<typeof toAdminCategory>[0],
          countMap.get(c.slug) ?? 0,
        ),
      ),
    );
  } catch (e) {
    if (e instanceof AppError)
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = createCategorySchema.safeParse(body);
    if (!parsed.success)
      return badRequest(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");

    await connectToDatabase();
    const exists = await CategoryModel.findOne({ slug: parsed.data.slug });
    if (exists) return conflict("هذا الـ slug مستخدم بالفعل");

    const cat = await CategoryModel.create(parsed.data);
    revalidateStorefront();
    return success(
      toAdminCategory(cat.toObject() as Parameters<typeof toAdminCategory>[0]),
      "تم إضافة التصنيف",
      201,
    );
  } catch (e) {
    if (e instanceof AppError)
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    return serverError();
  }
}
