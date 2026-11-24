/**
 * بيانات ثابتة للموقع — تُستبدل لاحقاً ببيانات ديناميكية من الباك اند.
 * رقم الواتساب مكتوب بالكود الدولي بدون علامة +.
 */
export const SITE_CONTACT = {
  /** عنوان المكان (يُستبدل لاحقاً من الباك اند) */
  address: "ش. مؤسسة الزكاة، القاهرة، مصر",
  email: "info@rosemary.com",
  phone: "01005526838",
  whatsappNumber: "201005526838",
  whatsappMessage: "أهلاً روزماري! عايز أطلب وجبة",
} as const;

export const WHATSAPP_URL = `https://wa.me/${SITE_CONTACT.whatsappNumber}?text=${encodeURIComponent(SITE_CONTACT.whatsappMessage)}`;

/** الدومين الرسمي — يُستخدم في الـ sitemap وبيانات SEO */
function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  // على Vercel يضيفها النظام تلقائياً — أضمن من APP_URL اللي ممكن يفضل localhost
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "").replace(/\/$/, "")}`;
  const app = process.env.APP_URL?.trim();
  if (app) return app.replace(/\/$/, "");
  return "https://rosmarey.vercel.app";
}

export const SITE_URL = resolveSiteUrl();

export const SOCIAL_PREVIEW_IMAGE_URL =
  "https://res.cloudinary.com/sn3m0yui/image/upload/v1795527004/rosemary-social-preview.jpg";

export const RESTAURANT_NAME = "روزماري";

