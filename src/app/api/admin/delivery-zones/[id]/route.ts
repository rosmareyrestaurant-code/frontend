import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { DeliveryZoneModel } from "@/models/DeliveryZone";
import { success, notFound, badRequest, serverError, AppError } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import { toDeliveryZone } from "@/lib/serialize";
import { updateDeliveryZoneSchema } from "@/lib/validation";


export const instant = false;
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await req.json();
    const parsed = updateDeliveryZoneSchema.safeParse(body);
    if (!parsed.success)
      return badRequest(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");

    await connectToDatabase();
    const updated = await DeliveryZoneModel.findByIdAndUpdate(
      id,
      { $set: parsed.data },
      { new: true },
    ).lean();
    if (!updated) return notFound("المنطقة غير موجودة");
    return success(
      toDeliveryZone(updated as Parameters<typeof toDeliveryZone>[0]),
      "تم تحديث المنطقة",
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
    const zone = await DeliveryZoneModel.findByIdAndDelete(id);
    if (!zone) return notFound("المنطقة غير موجودة");
    return success(null, "تم حذف المنطقة");
  } catch (e) {
    if (e instanceof AppError)
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    return serverError();
  }
}
