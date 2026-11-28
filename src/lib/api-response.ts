/**
 * أدوات استجابة الـ API الموحّدة + معالجة الأخطاء.
 * صيغة موحّدة:
 *   success: { success: true, data, message? }
 *   error:   { success: false, error: { code, message } }
 */
import { NextRequest } from "next/server";
import { ZodError } from "zod";
import { PAGINATION } from "./constants";

/** خطأ تطبيقي يحمل code + HTTP status */
export class AppError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export const success = <T>(data: T, message?: string, status = 200) =>
  Response.json({ success: true, data, message }, { status });

export const error = (code: string, message: string, status = 400) =>
  Response.json({ success: false, error: { code, message } }, { status });

/* اختصارات شائعة */
export const badRequest = (message: string, code = "BAD_REQUEST") =>
  error(code, message, 400);
export const unauthorized = (message = "غير مصرّح") =>
  error("UNAUTHORIZED", message, 401);
export const forbidden = (message = "ممنوع الوصول") =>
  error("FORBIDDEN", message, 403);
export const notFound = (message = "غير موجود") =>
  error("NOT_FOUND", message, 404);
export const conflict = (message: string) => error("CONFLICT", message, 409);
export const tooMany = (message = "طلبات كثيرة جداً، حاول لاحقاً") =>
  error("RATE_LIMITED", message, 429);
export const serverError = (message = "خطأ في الخادم") =>
  error("SERVER_ERROR", message, 500);

/**
 * يضيف ترويسات كاش عامة للاستجابة، فيستفيد منها الـ proxy/CDN الموجود قدام
 * التطبيق (مثل nginx أو Cloudflare) — كل الزوار بياخدوا نفس النسخة في أقل وقت
 * بدل ما كل واحد يضرب الداتابيز.
 */
export const withPublicCache = (res: Response, seconds = 60) => {
  res.headers.set(
    "Cache-Control",
    `public, s-maxage=${seconds}, stale-while-revalidate=300`,
  );
  return res;
};

/** يحوّل خطأ Zod إلى رسالة عربية مقروءة */
export function zodErrorToMessage(err: ZodError): string {
  const first = err.issues[0];
  if (!first) return "بيانات غير صحيحة";
  const path = first.path.length ? first.path.join(".") : "value";
  return `حقل غير صحيح (${path}): ${first.message}`;
}

/**
 * يلفّ Route Handler بـ try/catch موحّد.
 * للـ handlers التي تأخذ dynamic params.
 */
export function withHandler(
  fn: (
    request: NextRequest,
    ctx: { params: Promise<Record<string, string>> },
  ) => Promise<Response>,
) {
  return async (
    request: NextRequest,
    ctx: { params: Promise<Record<string, string>> },
  ): Promise<Response> => {
    try {
      return await fn(request, ctx);
    } catch (e) {
      if (e instanceof AppError) return error(e.code, e.message, e.status);
      if (e instanceof ZodError) return badRequest(zodErrorToMessage(e));
      if (process.env.NODE_ENV === "development") {
        console.error("[api] unhandled:", e);
      } else {
        console.error("[api] unhandled error");
      }
      return serverError();
    }
  };
}

/** للـ handlers بدون dynamic params */
export function withSimpleHandler(
  fn: (request: NextRequest) => Promise<Response>,
) {
  return async (request: NextRequest): Promise<Response> => {
    try {
      return await fn(request);
    } catch (e) {
      if (e instanceof AppError) return error(e.code, e.message, e.status);
      if (e instanceof ZodError) return badRequest(zodErrorToMessage(e));
      if (process.env.NODE_ENV === "development") {
        console.error("[api] unhandled:", e);
      }
      return serverError();
    }
  };
}

/** يقرأ page/limit من الـ query مع تطبيق حدود آمنة */
export function getPaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(
    1,
    Number(searchParams.get("page")) || PAGINATION.defaultPage,
  );
  let limit =
    Number(searchParams.get("limit")) || PAGINATION.defaultLimit;
  if (!Number.isFinite(limit) || limit < 1) limit = PAGINATION.defaultLimit;
  if (limit > PAGINATION.maxLimit) limit = PAGINATION.maxLimit;
  return { page, limit, skip: (page - 1) * limit };
}
