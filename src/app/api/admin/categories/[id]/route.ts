import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { CategoryModel } from "@/models/Category";
import {
  success,
  notFound,
  badRequest,
  serverError,
  AppError,
} from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import { toAdminCategory } from "@/lib/serialize";
import { updateCategorySchema } from "@/lib/validation";
import { deleteImage } from "@/lib/cloudinary";


export const instant = false;
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const parsed = updateCategorySchema.safeParse(body);
    if (!parsed.success)
      return badRequest(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");

    await connectToDatabase();
    const updated = await CategoryModel.findByIdAndUpdate(
      id,
      { $set: parsed.data },
      { new: true },
    ).lean();
    if (!updated) return notFound("التصنيف غير موجود");
    return success(
      toAdminCategory(updated as Parameters<typeof toAdminCategory>[0]),
      "تم تحديث التصنيف",
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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    await connectToDatabase();
    const cat = await CategoryModel.findByIdAndDelete(id);
    if (!cat) return notFound("التصنيف غير موجود");
    if ((cat as { imagePublicId?: string }).imagePublicId)
      await deleteImage((cat as { imagePublicId: string }).imagePublicId);
    return success(null, "تم حذف التصنيف");
  } catch (e) {
    if (e instanceof AppError)
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    return serverError();
  }
}
