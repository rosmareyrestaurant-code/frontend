import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { BannerModel } from "@/models/Banner";
import { success, notFound, badRequest, serverError, AppError } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import { toAdminBanner } from "@/lib/serialize";
import { updateBannerSchema } from "@/lib/validation";
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
    const parsed = updateBannerSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");

    await connectToDatabase();
    const updated = await BannerModel.findByIdAndUpdate(id, { $set: parsed.data }, { new: true }).lean();
    if (!updated) return notFound("البانر غير موجود");
    return success(toAdminBanner(updated as Parameters<typeof toAdminBanner>[0]), "تم تحديث البانر");
  } catch (e) {
    if (e instanceof AppError)
      return Response.json({ success: false, error: { code: e.code, message: e.message } }, { status: e.status });
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
    const banner = await BannerModel.findByIdAndDelete(id);
    if (!banner) return notFound("البانر غير موجود");
    if ((banner as { imagePublicId?: string }).imagePublicId)
      await deleteImage((banner as { imagePublicId: string }).imagePublicId);
    return success(null, "تم حذف البانر");
  } catch (e) {
    if (e instanceof AppError)
      return Response.json({ success: false, error: { code: e.code, message: e.message } }, { status: e.status });
    return serverError();
  }
}
