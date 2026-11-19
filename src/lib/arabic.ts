/**
 * توحيد الكتابة العربية عشان البحث يطابق المتغيرات المختلفة للحرف.
 * مثال: أ / إ / آ -> ا ، ة -> ه ، ى -> ي ، مع إزالة التشكيل.
 */
export function normalizeArabic(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u064B-\u065F]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .trim();
}
