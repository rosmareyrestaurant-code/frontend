import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { CategoryModel } from "@/models/Category";
import { success, badRequest, serverError, AppError } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import { reorderCategoriesSchema } from "@/lib/validation";
import { revalidateStorefront } from "@/lib/storefront-tags";

export const instant = false;

/** حفظ ترتيب التصنيفات — المصدر الوحيد للترتيب في كل الشاشات */
export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = reorderCategoriesSchema.safeParse(body);
    if (!parsed.success)
      return badRequest(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");

    await connectToDatabase();
    const { ids } = parsed.data;
    const count = await CategoryModel.countDocuments({ _id: { $in: ids } });
    if (count !== ids.length) return badRequest("بعض التصنيفات غير موجودة — حدّث الصفحة وحاول تاني");

    await CategoryModel.bulkWrite(
      ids.map((id, index) => ({
        updateOne: { filter: { _id: id }, update: { $set: { sortOrder: index + 1 } } },
      })),
    );

    revalidateStorefront();
    return success({ ids }, "تم حفظ ترتيب التصنيفات");
  } catch (e) {
    if (e instanceof AppError)
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    console.error("[PATCH /api/admin/categories/reorder]", e);
    return serverError();
  }
}
