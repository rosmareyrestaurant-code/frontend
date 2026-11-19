import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ProductModel } from "@/models/Product";
import {
  success,
  badRequest,
  serverError,
  AppError,
  getPaginationParams,
} from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth";
import { toAdminProduct } from "@/lib/serialize";
import { createProductSchema } from "@/lib/validation";


export const instant = false;
export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    await connectToDatabase();

    const sp = req.nextUrl.searchParams;
    const q = sp.get("q")?.trim();
    const category = sp.get("category");
    const isAvailable = sp.get("isAvailable");
    const isVisible = sp.get("isVisible");
    const { page, limit, skip } = getPaginationParams(sp);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = {};
    if (category && category !== "all") filter.category = category;
    if (isAvailable === "true") filter.isAvailable = true;
    else if (isAvailable === "false") filter.isAvailable = false;
    if (isVisible === "true") filter.isVisible = true;
    else if (isVisible === "false") filter.isVisible = false;
    if (q) filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { nameEn: { $regex: q, $options: "i" } },
    ];

    const [products, total] = await Promise.all([
      ProductModel.find(filter)
        .sort({ menuOrder: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ProductModel.countDocuments(filter),
    ]);

    return success({
      products: products.map((p) =>
        toAdminProduct(p as Parameters<typeof toAdminProduct>[0]),
      ),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    if (e instanceof AppError)
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    console.error("[GET /api/admin/products]", e);
    return serverError();
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success)
      return badRequest(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");

    await connectToDatabase();
    const product = await ProductModel.create(parsed.data);
    return success(
      toAdminProduct(product.toObject() as Parameters<typeof toAdminProduct>[0]),
      "تم إضافة المنتج",
      201,
    );
  } catch (e) {
    if (e instanceof AppError)
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    console.error("[POST /api/admin/products]", e);
    return serverError();
  }
}
