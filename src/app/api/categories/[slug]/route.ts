import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { CategoryModel } from "@/models/Category";
import { ProductModel } from "@/models/Product";
import { success, notFound, serverError } from "@/lib/api-response";
import { toPublicCategory, toPublicProduct } from "@/lib/serialize";


export const instant = false;
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    await connectToDatabase();

    const cat = await CategoryModel.findOne({ slug, isActive: true }).lean();
    if (!cat) return notFound("التصنيف غير موجود");

    const products = await ProductModel.find({
      category: slug,
      isAvailable: true,
      isVisible: true,
    })
      .sort({ menuOrder: 1, createdAt: -1 })
      .lean();

    return success({
      category: toPublicCategory(
        cat as Parameters<typeof toPublicCategory>[0],
        products.length,
      ),
      products: products.map((p) =>
        toPublicProduct(p as Parameters<typeof toPublicProduct>[0]),
      ),
    });
  } catch (e) {
    console.error("[GET /api/categories/:slug]", e);
    return serverError();
  }
}
