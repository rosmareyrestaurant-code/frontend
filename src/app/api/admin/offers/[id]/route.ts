import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { OfferModel } from "@/models/Offer";
import { success, notFound, badRequest, serverError, AppError } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import { toAdminOffer } from "@/lib/serialize";
import { updateOfferSchema } from "@/lib/validation";
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
    const parsed = updateOfferSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");

    await connectToDatabase();
    const updated = await OfferModel.findByIdAndUpdate(id, { $set: parsed.data }, { new: true }).lean();
    if (!updated) return notFound("العرض غير موجود");
    return success(toAdminOffer(updated as Parameters<typeof toAdminOffer>[0]), "تم تحديث العرض");
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
    const offer = await OfferModel.findByIdAndDelete(id);
    if (!offer) return notFound("العرض غير موجود");
    if ((offer as { imagePublicId?: string }).imagePublicId)
      await deleteImage((offer as { imagePublicId: string }).imagePublicId);
    return success(null, "تم حذف العرض");
  } catch (e) {
    if (e instanceof AppError)
      return Response.json({ success: false, error: { code: e.code, message: e.message } }, { status: e.status });
    return serverError();
  }
}
