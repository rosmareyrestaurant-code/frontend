import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { BannerModel } from "@/models/Banner";
import {
  success, badRequest, serverError, AppError, getPaginationParams,
} from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import { toAdminBanner } from "@/lib/serialize";
import { createBannerSchema } from "@/lib/validation";


export const instant = false;
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    await connectToDatabase();

    const sp = req.nextUrl.searchParams;
    const position = sp.get("position");
    const { page, limit, skip } = getPaginationParams(sp);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};
    if (position && position !== "all") filter.position = position;

    const [banners, total] = await Promise.all([
      BannerModel.find(filter).sort({ sortOrder: 1 }).skip(skip).limit(limit).lean(),
      BannerModel.countDocuments(filter),
    ]);

    return success({
      banners: banners.map((b) => toAdminBanner(b as Parameters<typeof toAdminBanner>[0])),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    if (e instanceof AppError)
      return Response.json({ success: false, error: { code: e.code, message: e.message } }, { status: e.status });
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = createBannerSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");

    await connectToDatabase();
    const banner = await BannerModel.create(parsed.data);
    return success(toAdminBanner(banner.toObject() as Parameters<typeof toAdminBanner>[0]), "تم إضافة البانر", 201);
  } catch (e) {
    if (e instanceof AppError)
      return Response.json({ success: false, error: { code: e.code, message: e.message } }, { status: e.status });
    return serverError();
  }
}
