import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { OfferModel } from "@/models/Offer";
import { success, badRequest, serverError, AppError, getPaginationParams } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import { toAdminOffer } from "@/lib/serialize";
import { createOfferSchema } from "@/lib/validation";


export const instant = false;
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    await connectToDatabase();
    const { page, limit, skip } = getPaginationParams(req.nextUrl.searchParams);

    const [offers, total] = await Promise.all([
      OfferModel.find().sort({ sortOrder: 1 }).skip(skip).limit(limit).lean(),
      OfferModel.countDocuments(),
    ]);

    return success({
      offers: offers.map((o) => toAdminOffer(o as Parameters<typeof toAdminOffer>[0])),
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
    const parsed = createOfferSchema.safeParse(body);
    if (!parsed.success) return badRequest(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");

    await connectToDatabase();
    const offer = await OfferModel.create(parsed.data);
    return success(toAdminOffer(offer.toObject() as Parameters<typeof toAdminOffer>[0]), "تم إضافة العرض", 201);
  } catch (e) {
    if (e instanceof AppError)
      return Response.json({ success: false, error: { code: e.code, message: e.message } }, { status: e.status });
    return serverError();
  }
}
