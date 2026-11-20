/**
 * POST /api/admin/products/import
 * استيراد ملف إكسيل: يضيف المنتجات الجديدة ويحدّث الموجود (مطابقة بالاسم).
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { connectToDatabase } from "@/lib/mongodb";
import { ProductModel } from "@/models/Product";
import { success, badRequest, serverError, AppError } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import { importProductSchema } from "@/lib/validation";
import { revalidateStorefront } from "@/lib/storefront-tags";


export const instant = false;
const bodySchema = z.object({
  products: z.array(importProductSchema).min(1, "الملف مفيهوش منتجات").max(500),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success)
      return badRequest(parsed.error.issues[0]?.message ?? "بيانات الملف غير صحيحة");

    await connectToDatabase();

    let added = 0;
    let updated = 0;
    for (const product of parsed.data.products) {
      const existing = await ProductModel.findOne({
        name: { $regex: `^${product.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
      });
      if (existing) {
        await ProductModel.updateOne({ _id: existing._id }, { $set: product });
        updated++;
      } else {
        await ProductModel.create(product);
        added++;
      }
    }

    revalidateStorefront();
    return success({ added, updated }, `تم إضافة ${added} وتحديث ${updated} منتج`);
  } catch (e) {
    if (e instanceof AppError)
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    console.error("[POST /api/admin/products/import]", e);
    return serverError();
  }
}
