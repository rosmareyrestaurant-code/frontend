import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { BannerModel } from "@/models/Banner";
import { success, serverError, withPublicCache } from "@/lib/api-response";
import { toPublicBanner } from "@/lib/serialize";


export const instant = false;
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const position = req.nextUrl.searchParams.get("position");
    const now = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { isActive: true };
    if (position) filter.position = position;

    const banners = await BannerModel.find(filter)
      .sort({ sortOrder: 1 })
      .lean();

    // فلتر التواريخ (startDate/endDate) على المستوى التطبيقي
    const active = banners.filter((b) => {
      if (b.startDate && b.startDate > now) return false;
      if (b.endDate && b.endDate < now) return false;
      return true;
    });

    return withPublicCache(
      success(
        active.map((b) =>
          toPublicBanner(b as Parameters<typeof toPublicBanner>[0]),
        ),
      ),
    );
  } catch (e) {
    console.error("[GET /api/banners]", e);
    return serverError();
  }
}
