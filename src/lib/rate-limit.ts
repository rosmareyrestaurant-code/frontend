/**
 * Rate Limiting بسيط (نافذة منزلقة في الذاكرة).
 *
 * ملاحظة أمان صادقة: التخزين في الذاكرة يكون لكل instance على حدة. على Vercel
 * Serverless، كل instance له ذاكرته، فالحد يكون "أفضل جهد" وليس دقيقاً عبر كل
 * الـ instances. هذا مستوى مناسب لمشروع مطعم صغير/متوسط.
 * لو احتجت دقة عبر كل instances لاحقاً، يمكن ربط Upstash Redis هنا بنفس الواجهة
 * (دالة rateLimit) دون تغيير بقية الكود.
 */
import { AppError } from "./api-response";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
  remaining: number;
}

export function rateLimitCheck(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: windowMs, remaining: limit - 1 };
  }
  bucket.count += 1;
  const remaining = Math.max(0, limit - bucket.count);
  return {
    allowed: bucket.count <= limit,
    retryAfterMs: Math.max(0, bucket.resetAt - now),
    remaining,
  };
}

/** يرمى 429 لو تجاوز الحد — يُستدعى في بداية الـ handlers الحساسة */
export function rateLimitOrThrow(
  key: string,
  limit: number,
  windowMs: number,
): void {
  const res = rateLimitCheck(key, limit, windowMs);
  if (!res.allowed) {
    throw new AppError(
      "RATE_LIMITED",
      "طلبات كثيرة جداً من هذه الجهة، حاول مرة أخرى بعد لحظات",
      429,
    );
  }
}

/** مفتاح限 يستخدم IP العميل من الطلب (آمن: نأخذ أول IP من x-forwarded-for) */
export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
