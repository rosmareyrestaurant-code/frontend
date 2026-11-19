import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ProductModel } from "@/models/Product";
import {
  success,
  notFound,
  badRequest,
  serverError,
  AppError,
} from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import { toAdminProduct } from "@/lib/serialize";
import { updateProductSchema } from "@/lib/validation";
import { deleteImage } from "@/lib/cloudinary";


export const instant = false;
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    await connectToDatabase();
    const p = await ProductModel.findById(id).lean();
    if (!p) return notFound("المنتج غير موجود");
    return success(toAdminProduct(p as Parameters<typeof toAdminProduct>[0]));
  } catch (e) {
    if (e instanceof AppError)
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    return serverError();
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const parsed = updateProductSchema.safeParse(body);
    if (!parsed.success)
      return badRequest(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");

    await connectToDatabase();
    const updated = await ProductModel.findByIdAndUpdate(
      id,
      { $set: parsed.data },
      { new: true },
    ).lean();
    if (!updated) return notFound("المنتج غير موجود");
    return success(
      toAdminProduct(updated as Parameters<typeof toAdminProduct>[0]),
      "تم تحديث المنتج",
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
    const product = await ProductModel.findByIdAndDelete(id);
    if (!product) return notFound("المنتج غير موجود");
    // حذف الصورة من Cloudinary (best-effort)
    if (product.imagePublicId) await deleteImage(product.imagePublicId);
    return success(null, "تم حذف المنتج");
  } catch (e) {
    if (e instanceof AppError)
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    return serverError();
  }
}
