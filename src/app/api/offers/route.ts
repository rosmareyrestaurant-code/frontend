import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { OfferModel } from "@/models/Offer";
import { success, serverError, withPublicCache } from "@/lib/api-response";
import { toPublicOffer } from "@/lib/serialize";


export const instant = false;
export async function GET(_req: NextRequest) {
  try {
    await connectToDatabase();
    const offers = await OfferModel.find({ isActive: true })
      .sort({ sortOrder: 1 })
      .lean();
    return withPublicCache(
      success(
        offers.map((o) => toPublicOffer(o as Parameters<typeof toPublicOffer>[0])),
      ),
    );
  } catch (e) {
    console.error("[GET /api/offers]", e);
    return serverError();
  }
}
