import { revalidateTag } from "next/cache";

/** تاج واحد لكل بيانات واجهة العملاء (منيو + تصنيفات + بانرات) */
export const STOREFRONT_TAG = "storefront";

/**
 * يُستدعى من Route Handlers الخاصة بالأدمن بعد أي تعديل،
 * عشان الزائر يشوف التعديل من أول طلب (من غير انتظار الكاش الزمني).
 */
export function revalidateStorefront() {
  revalidateTag(STOREFRONT_TAG, { expire: 0 });
}
