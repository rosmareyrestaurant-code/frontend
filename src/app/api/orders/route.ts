import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ProductModel } from "@/models/Product";
import { OrderModel } from "@/models/Order";
import { StoreSettingsModel } from "@/models/StoreSettings";
import { DeliveryZoneModel } from "@/models/DeliveryZone";
import {
  success,
  badRequest,
  serverError,
  AppError,
} from "@/lib/api-response";
import { createOrderSchema } from "@/lib/validation";
import {
  computeOrderPricing,
  generateOrderNumber,
  generateAccessToken,
  PricingProduct,
} from "@/lib/pricing";
import { rateLimitOrThrow, clientIp } from "@/lib/rate-limit";


export const instant = false;
export async function POST(req: NextRequest) {
  try {
    // Rate limiting: 10 طلبات / دقيقة لكل IP
    rateLimitOrThrow(`order:${clientIp(req)}`, 10, 60_000);

    const body = await req.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "بيانات غير صحيحة";
      return badRequest(msg);
    }

    const { items: cartItems, customer, paymentMethod, paymentProofUrl, paymentProofPublicId } =
      parsed.data;

    // التحويل الإلكتروني لازم يكون معاه صورة إثبات
    if (paymentMethod !== "cash" && !paymentProofUrl) {
      return badRequest("ارفع صورة التحويل الأول عشان نأكد الطلب", "PAYMENT_PROOF_REQUIRED");
    }

    await connectToDatabase();

    // جلب إعدادات المتجر (رسوم التوصيل والحد الأدنى)
    const settingsDoc = await StoreSettingsModel.findOne().lean();
    const settings = {
      deliveryFee: (settingsDoc as { deliveryFee?: number } | null)?.deliveryFee ?? 0,
      minimumOrder: (settingsDoc as { minimumOrder?: number } | null)?.minimumOrder ?? 0,
    };

    if (settingsDoc && !(settingsDoc as { isStoreOpen?: boolean }).isStoreOpen) {
      const msg =
        (settingsDoc as { closedMessage?: string }).closedMessage ||
        "المتجر مغلق حالياً";
      return badRequest(msg, "STORE_CLOSED");
    }

    // جلب المنتجات من الـ DB (لا نثق بالأسعار القادمة من المتصفح)
    const productIds = cartItems.map((i) => i.productId);
    const dbProducts = await ProductModel.find({
      _id: { $in: productIds },
    }).lean();

    const productsById = new Map<string, PricingProduct>(
      dbProducts.map((p) => [
        String(p._id),
        p as unknown as PricingProduct,
      ]),
    );

    // جلب مناطق التوصيل للتحقق من التوصيل المجاني
    const zones = await DeliveryZoneModel.find({ isActive: true }).lean();

    // حساب الأسعار على السيرفر
    const pricing = computeOrderPricing(
      cartItems,
      productsById,
      settings,
      zones as Parameters<typeof computeOrderPricing>[3],
      customer,
    );

    // إنشاء الطلب
    const orderNumber = generateOrderNumber();
    const accessToken = generateAccessToken();

    const order = await OrderModel.create({
      orderNumber,
      accessToken,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      area: customer.areaName ?? customer.areaId ?? "",
      items: pricing.items,
      subtotal: pricing.subtotal,
      deliveryFee: pricing.deliveryFee,
      discount: pricing.discount,
      total: pricing.total,
      paymentMethod,
      paymentProofUrl: paymentMethod === "cash" ? "" : paymentProofUrl ?? "",
      paymentProofPublicId: paymentMethod === "cash" ? "" : paymentProofPublicId ?? "",
      notes: customer.notes ?? "",
    });

    return success(
      {
        orderNumber,
        accessToken,
        orderId: String(order._id),
        total: pricing.total,
        deliveryFee: pricing.deliveryFee,
        subtotal: pricing.subtotal,
      },
      "تم إرسال طلبك بنجاح",
      201,
    );
  } catch (e) {
    if (e instanceof AppError) {
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    }
    console.error("[POST /api/orders]", e);
    return serverError();
  }
}
