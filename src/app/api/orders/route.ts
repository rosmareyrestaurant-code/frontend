import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ProductModel } from "@/models/Product";
import { OrderModel } from "@/models/Order";
import { StoreSettingsModel } from "@/models/StoreSettings";
import { DeliveryZoneModel } from "@/models/DeliveryZone";
import { CouponModel } from "@/models/Coupon";
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
  PricingCoupon,
} from "@/lib/pricing";
import { rateLimitOrThrow, clientIp } from "@/lib/rate-limit";


export const instant = false;
// 3 محاولات اتصال × 8 ثواني ≈ 25–27 ثانية في أسوأ حالة — 40 ثانية تمنح هامش
// أمان من غير تعليق الطلب. الحد المسموح على كل الخطط لا يقل عن 300 ثانية.
export const maxDuration = 40;

type LeanOrder = {
  _id: unknown;
  orderNumber: string;
  accessToken: string;
  total?: number;
  deliveryFee?: number;
  subtotal?: number;
  discount?: number;
  couponCode?: string;
  couponPercent?: number;
  couponDiscount?: number;
};

/** نفس شكل الاستجابة سواء الطلب ات-create دلوقتي أو كان موجود من محاولة سابقة */
function orderResponse(order: LeanOrder, message: string, status: number) {
  return success(
    {
      orderNumber: order.orderNumber,
      accessToken: order.accessToken,
      orderId: String(order._id),
      total: order.total ?? 0,
      deliveryFee: order.deliveryFee ?? 0,
      subtotal: order.subtotal ?? 0,
      discount: order.discount ?? 0,
      couponCode: order.couponCode,
      couponPercent: order.couponPercent ?? 0,
      couponDiscount: order.couponDiscount ?? 0,
    },
    message,
    status,
  );
}

/** أكواد MongoDB المؤقتة: إعادة انتخاب primary، إغلاق pool، أو انقطاع شبكة */
const TRANSIENT_DB_CODES = new Set([
  6, 7, 89, 91, 189, 262, 9001, 10107, 11600, 11602, 13435, 13436,
]);

/** رقم مرجع التحويل مكرر على طلب تاني — مش خطأ اتصال، رسالة واضحة للعميل */
function isDuplicateTransactionReference(e: unknown) {
  const err = e as {
    code?: number;
    keyPattern?: Record<string, unknown>;
    message?: string;
  };
  return (
    err?.code === 11000 &&
    (!!err.keyPattern?.transactionReference ||
      /transactionReference/.test(err.message ?? ""))
  );
}

/** أخطاء اتصال/شبكة مع قاعدة البيانات — إعادة المحاولة على السيرفر */
function isTransientDbError(e: unknown) {
  const err = e as Error & { code?: number | string; labels?: string[] };
  if (Number(err?.code) === 11000) return false;
  if (TRANSIENT_DB_CODES.has(Number(err?.code))) return true;
  if (err?.labels?.includes("RetryableWriteError")) return true;
  const text = `${err?.name ?? ""} ${err?.message ?? ""} ${err?.code ?? ""}`;
  // ServerSelection بيغطي MongooseServerSelectionError و MongoServerSelectionError
  return /MongoNetwork|ServerSelection|MongoTopologyClosed|MongoNotConnected|MongoPoolCleared|MongoExpiredSession|ECONN|ETIMEDOUT|ENOTFOUND|EHOSTUNREACH|EPIPE|pool|connection .*?(closed|reset)|timed out|not (the )?primary|querySrv|socket/i.test(
    text,
  );
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * إعادة المحاولة على السيرفر بدل ما نقول للعميل «جرّب تاني» — تغطي تقلبات
 * الاتصال القصيرة. آمنة لأن الطلب مربوط بـ clientOrderId (مش هيتكرر).
 */
async function withDbRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (!isTransientDbError(e) || attempt === 3) throw e;
      await sleep(attempt === 1 ? 250 : 800);
    }
  }
  throw lastErr;
}

export async function POST(req: NextRequest) {
  let clientOrderIdForDedup: string | undefined;
  try {
    // Rate limiting: 10 طلبات / دقيقة لكل IP
    rateLimitOrThrow(`order:${clientIp(req)}`, 10, 60_000);

    const body = await req.json();
    const parsed = createOrderSchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? "بيانات غير صحيحة";
      return badRequest(msg);
    }

    const {
      items: cartItems,
      customer,
      paymentMethod,
      paymentProofUrl,
      paymentProofPublicId,
      transactionReference,
      clientOrderId,
      couponCode,
    } = parsed.data;
    clientOrderIdForDedup = clientOrderId;
    // السيرفر هو اللي يوحّد الكود — أي قيمة من المتصفح تُعامل كمعاينة فقط
    const requestedCouponCode = couponCode?.trim().toUpperCase() || undefined;

    // التحويل الإلكتروني لازم يكون معاه صورة إثبات
    if (paymentMethod !== "cash" && !paymentProofUrl) {
      return badRequest("ارفع صورة التحويل الأول عشان نأكد الطلب", "PAYMENT_PROOF_REQUIRED");
    }

    const { order: savedOrder, isNew } = await withDbRetry(async () => {
      await connectToDatabase();

      // نفس المحاولة اترسلت قبل كده ونجحت → نرجّع الطلب الموجود بدل ما نكرره
      if (clientOrderId) {
        const existing = await OrderModel.findOne({ clientOrderId }).lean();
        if (existing) {
          return { order: existing as unknown as LeanOrder, isNew: false };
        }
      }

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
        throw new AppError("STORE_CLOSED", msg, 400);
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

      // التحقق من الكوبون في قاعدة البيانات — النسبة لا تُؤخذ من المتصفح
      let coupon: PricingCoupon | undefined;
      if (requestedCouponCode) {
        const couponDoc = await CouponModel.findOne({
          code: requestedCouponCode,
          isActive: true,
        }).lean();
        if (!couponDoc)
          throw new AppError(
            "COUPON_INVALID",
            "كود الخصم غير صالح أو غير مُفعّل",
            400,
          );
        coupon = {
          code: requestedCouponCode,
          discountPercent: Number(
            (couponDoc as { discountPercent?: number }).discountPercent ?? 0,
          ),
        };
      }

      // حساب الأسعار على السيرفر
      const pricing = computeOrderPricing(
        cartItems,
        productsById,
        settings,
        zones as Parameters<typeof computeOrderPricing>[3],
        customer,
        coupon,
      );

      // إنشاء الطلب
      const orderNumber = generateOrderNumber();
      const accessToken = generateAccessToken();

      const created = await OrderModel.create({
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
        couponCode: pricing.couponCode,
        couponPercent: pricing.couponPercent,
        couponDiscount: pricing.couponDiscount,
        total: pricing.total,
        paymentMethod,
        paymentProofUrl: paymentMethod === "cash" ? "" : paymentProofUrl ?? "",
        paymentProofPublicId: paymentMethod === "cash" ? "" : paymentProofPublicId ?? "",
        transactionReference:
          paymentMethod === "cash" ? "" : transactionReference ?? "",
        // حالة الدفع بتتحدد هنا فقط — أي paymentStatus/isPaid قادم من المتصفح بيتجاهل
        paymentStatus: "pending",
        // الطابور بيستقبل الطلبات الجديدة فقط — الطلبات القديمة من غير الحقل مستثناة
        printState: "pending",
        notes: customer.notes ?? "",
        ...(clientOrderId ? { clientOrderId } : {}),
      });

      return { order: created as unknown as LeanOrder, isNew: true };
    });

    return orderResponse(
      savedOrder,
      isNew ? "تم إرسال طلبك بنجاح" : "طلبك اتسجل بالفعل",
      isNew ? 201 : 200,
    );
  } catch (e) {
    if (e instanceof AppError) {
      return Response.json(
        { success: false, error: { code: e.code, message: e.message } },
        { status: e.status },
      );
    }
    console.error("[POST /api/orders]", (e as { code?: unknown }).code ?? "", e);

    // محاولتان متزامنتان بنفس المعرّف → نرجّع الطلب اللي اتسجل
    if ((e as { code?: number }).code === 11000 && clientOrderIdForDedup) {
      try {
        const existing = await OrderModel.findOne({
          clientOrderId: clientOrderIdForDedup,
        }).lean();
        if (existing) {
          return orderResponse(existing as unknown as LeanOrder, "طلبك اتسجل بالفعل", 200);
        }
      } catch (lookupErr) {
        console.error("[POST /api/orders] dedupe lookup", lookupErr);
      }
    }

    if (isDuplicateTransactionReference(e)) {
      return Response.json(
        {
          success: false,
          error: {
            code: "DUPLICATE_TRANSACTION_REFERENCE",
            message:
              "رقم مرجع التحويل مستخدم في طلب آخر — راجع الرقم على إيصال التحويل وحاول تاني",
          },
        },
        { status: 409 },
      );
    }

    if (isTransientDbError(e)) {
      return Response.json(
        {
          success: false,
          error: {
            code: "DB_UNAVAILABLE",
            message: "تعذّر إرسال الطلب دلوقتي — اضغط «تأكيد الطلب» تاني بعد لحظة",
          },
        },
        { status: 503 },
      );
    }

    return serverError();
  }
}
