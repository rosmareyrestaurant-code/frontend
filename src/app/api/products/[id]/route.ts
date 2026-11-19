import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ProductModel } from "@/models/Product";
import { success, notFound, serverError } from "@/lib/api-response";
import { toPublicProduct } from "@/lib/serialize";


export const instant = false;
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const product = await ProductModel.findOne({
      _id: id,
      isAvailable: true,
      isVisible: true,
    }).lean();

    if (!product) return notFound("المنتج غير موجود");
    return success(toPublicProduct(product as Parameters<typeof toPublicProduct>[0]));
  } catch (e) {
    console.error("[GET /api/products/:id]", e);
    return serverError();
  }
}
