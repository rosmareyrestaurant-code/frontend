import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { DeliveryZoneModel } from "@/models/DeliveryZone";
import { success, badRequest, serverError, AppError } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import { toDeliveryZone } from "@/lib/serialize";
import { deliveryZoneSchema } from "@/lib/validation";


export const instant = false;
export async function GET(_req: NextRequest) {
  try {
    await requireAdmin();
    await connectToDatabase();
    const zones = await DeliveryZoneModel.find().lean();
    return success(
      zones.map((z) => toDeliveryZone(z as Parameters<typeof toDeliveryZone>[0])),
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
    const parsed = deliveryZoneSchema.safeParse(body);
    if (!parsed.success)
      return badRequest(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");

    await connectToDatabase();
    const zone = await DeliveryZoneModel.create(parsed.data);
    return success(
      toDeliveryZone(zone.toObject() as Parameters<typeof toDeliveryZone>[0]),
      "تم إضافة المنطقة",
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
