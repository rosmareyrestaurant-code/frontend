/**
 * بيانات ثابتة للموقع — تُستبدل لاحقاً ببيانات ديناميكية من الباك اند.
 * رقم الواتساب مكتوب بالكود الدولي بدون علامة +.
 */
export const SITE_CONTACT = {
  /** عنوان المكان (يُستبدل لاحقاً من الباك اند) */
  address: "ش. مؤسسة الزكاة، القاهرة، مصر",
  email: "info@rozmary.com",
  phone: "01005526838",
  whatsappNumber: "201005526838",
  whatsappMessage: "أهلاً روزماري! عايز أطلب وجبة",
} as const;

export const WHATSAPP_URL = `https://wa.me/${SITE_CONTACT.whatsappNumber}?text=${encodeURIComponent(SITE_CONTACT.whatsappMessage)}`;

