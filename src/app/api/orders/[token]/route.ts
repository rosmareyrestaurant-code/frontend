/**
 * GET /api/orders/:token
 * يعرض تفاصيل الطلب لصاحبه فقط باستخدام رمز الوصول العشوائي (accessToken).
 * التحقق من الملكية على السيرفر — لا يُقبل رقم الطلب أو الهاتف كبديل.
 * لا يعرض أي بيانات إدارية أو طباعة أو بيانات عملاء آخرين.
 */
import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { OrderModel } from "@/models/Order";
import { success, notFound, serverError } from "@/lib/api-response";
import { toPublicOrder } from "@/lib/serialize";


export const instant = false;
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await params;
    if (!token || token.length < 10) return notFound("الطلب غير موجود");

    await connectToDatabase();

    const order = await OrderModel.findOne({ accessToken: token }).lean();
    if (!order) return notFound("الطلب غير موجود");

    return success(toPublicOrder(order as Parameters<typeof toPublicOrder>[0]));
  } catch (e) {
    console.error("[GET /api/orders/:token]", e);
    return serverError();
  }
}
