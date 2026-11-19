import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { DeliveryZoneModel } from "@/models/DeliveryZone";
import { success, serverError } from "@/lib/api-response";
import { toDeliveryZone } from "@/lib/serialize";


export const instant = false;
export async function GET(_req: NextRequest) {
  try {
    await connectToDatabase();
    const zones = await DeliveryZoneModel.find({ isActive: true }).lean();
    return success(
      zones.map((z) => toDeliveryZone(z as Parameters<typeof toDeliveryZone>[0])),
    );
  } catch (e) {
    console.error("[GET /api/delivery-zones]", e);
    return serverError();
  }
}
