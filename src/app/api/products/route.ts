import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ProductModel } from "@/models/Product";
import { success, serverError, getPaginationParams } from "@/lib/api-response";
import { toPublicProduct } from "@/lib/serialize";


export const instant = false;
export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const sp = req.nextUrl.searchParams;

    const q = sp.get("q")?.trim();
    const category = sp.get("category")?.trim();
    const featured = sp.get("featured") === "1";
    const idsParam = sp.get("ids"); // ids=id1,id2,... (للـ cart hydration)
    const sortParam = sp.get("sort") ?? "default"; // default | price-asc | price-desc
    const { page, limit, skip } = getPaginationParams(sp);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: Record<string, any> = { isAvailable: true, isVisible: true };

    if (idsParam) {
      // hydration للسلة والمفضلة — لا نطبّق فلاتر أخرى
      const ids = idsParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const products = await ProductModel.find({ _id: { $in: ids } }).lean();
      return success(
        products.map((p) =>
          toPublicProduct(p as Parameters<typeof toPublicProduct>[0]),
        ),
      );
    }

    if (category) filter.category = category;
    if (featured) filter.isFeatured = true;
    if (q) filter.$text = { $search: q };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let sortQuery: Record<string, any> = { menuOrder: 1, createdAt: -1 };
    if (q) sortQuery = { score: { $meta: "textScore" } };
    else if (sortParam === "price-asc") sortQuery = { price: 1 };
    else if (sortParam === "price-desc") sortQuery = { price: -1 };

    const [products, total] = await Promise.all([
      ProductModel.find(filter, q ? { score: { $meta: "textScore" } } : undefined)
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .lean(),
      ProductModel.countDocuments(filter),
    ]);

    return success({
      products: products.map((p) =>
        toPublicProduct(p as Parameters<typeof toPublicProduct>[0]),
      ),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (e) {
    console.error("[GET /api/products]", e);
    return serverError();
  }
}
