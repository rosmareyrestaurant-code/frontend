/** معاينة مبسطة لخصم الكوبون على مستوى عنصر السلة — قبل التحقق النهائي على السيرفر */
import type { CartItem } from "@/types";

export function cartItemPreview(item: CartItem) {
  const itemTotal = item.product.price * item.quantity;
  const discount = item.coupon
    ? Math.min(
        itemTotal,
        Math.round((itemTotal * item.coupon.discountPercent) / 100),
      )
    : 0;
  return { itemTotal, discount, payable: Math.max(0, itemTotal - discount) };
}

export function cartCouponDiscount(cart: CartItem[]): number {
  return cart.reduce((sum, item) => sum + cartItemPreview(item).discount, 0);
}
