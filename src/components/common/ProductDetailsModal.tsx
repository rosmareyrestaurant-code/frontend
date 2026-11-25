"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { X, Heart, Plus, Minus, ShoppingBag, Check, TicketPercent, Loader2 } from "lucide-react";
import { useShop } from "@/context/ShopContext";
import { AppliedCoupon, Product, ProductSize } from "@/types";
// التعديلات بقت جاية من الـ API نفسه
// import { useCatalogProduct } from "@/hooks/useCatalog";
import { useStoreToast } from "@/components/common/StoreToast";

interface ProductModalInnerProps {
  product: Product;
  onClose: () => void;
}

function ProductModalInner({ product: baseProduct, onClose }: ProductModalInnerProps) {
  const product = baseProduct;
  const { addToCart, toggleFavorite, isFavorite, validateCoupon } = useShop();
  const { showStoreToast, showMessage } = useStoreToast();

  const defaultSize: ProductSize | null =
    product.sizes?.find((s) => s.isDefault) ?? product.sizes?.[0] ?? null;

  const [selectedSize, setSelectedSize] = useState<ProductSize | null>(defaultSize);

  // لما بيانات الكتالوج المرفوعة تتحمل، حدّث الحجم المختار للأحجام الجديدة
  useEffect(() => {
    const sizes = product.sizes ?? [];
    queueMicrotask(() => {
      if (!sizes.length) {
        setSelectedSize(null);
        return;
      }
      setSelectedSize(
        (prev) =>
          sizes.find((s) => s.id === prev?.id) ??
          sizes.find((s) => s.isDefault) ??
          sizes[0],
      );
    });
  }, [product.sizes]);

  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponOk, setCouponOk] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // بدء أنيميشن الخروج أولاً، ثم إلغاء تحميل الموديل بعد انتهاء الحركة
  const requestClose = useCallback(() => {
    if (closeTimer.current) return;
    setIsClosing(true);
    closeTimer.current = setTimeout(() => {
      closeTimer.current = null;
      onClose();
    }, 320);
  }, [onClose]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  // إغلاق الموديل عند الضغط على زر Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        requestClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [requestClose]);

  const favorited = isFavorite(product.id);

  // السعر الفعلي: من الحجم المختار أو من المنتج مباشرة
  const effectivePrice = selectedSize ? selectedSize.price : product.price;
  const effectiveOriginalPrice = selectedSize
    ? selectedSize.originalPrice
    : product.originalPrice;

  const lineTotal = effectivePrice * quantity;
  const lineDiscount = appliedCoupon
    ? Math.min(lineTotal, Math.round((lineTotal * appliedCoupon.discountPercent) / 100))
    : 0;
  const payableLineTotal = lineTotal - lineDiscount;

  const handleApplyCoupon = async () => {
    const typed = couponInput.trim().toUpperCase();
    if (!typed) {
      setAppliedCoupon(null);
      setCouponMessage("تمت إزالة كود الخصم");
      setCouponOk(true);
      showMessage("تمت إزالة كود الخصم", "success");
      return;
    }

    setCouponLoading(true);
    const result = await validateCoupon(typed);
    setCouponLoading(false);
    setCouponOk(result.ok);
    setCouponMessage(result.message);
    if (result.ok && result.coupon) setAppliedCoupon(result.coupon);
    else setAppliedCoupon(null);
    showMessage(result.message, result.ok ? "success" : "error");
  };

  const handleAddToCart = async () => {
    // لو العميل كتب كود ولم يضغط «تطبيق»، نتحقق منه قبل الإضافة للسلة
    const typed = couponInput.trim().toUpperCase();
    let couponToApply: AppliedCoupon | null = appliedCoupon;
    if (!typed) {
      couponToApply = null;
    } else if (!appliedCoupon || typed !== appliedCoupon.code) {
      setCouponLoading(true);
      const result = await validateCoupon(typed);
      setCouponLoading(false);
      setCouponOk(result.ok);
      setCouponMessage(result.message);
      if (!result.ok || !result.coupon) {
        setAppliedCoupon(null);
        showMessage(result.message, "error");
        return;
      }
      couponToApply = result.coupon;
      setAppliedCoupon(result.coupon);
    }

    // لو في حجم محدد، نعمل نسخة من المنتج بالسعر والاسم الصح
    const productToAdd = selectedSize
      ? {
          ...product,
          price: selectedSize.price,
          originalPrice: selectedSize.originalPrice,
          name: `${product.name} (${selectedSize.name})`,
        }
      : product;

    addToCart(productToAdd, quantity, notes, selectedSize?.id, couponToApply ?? undefined);
    setIsAdded(true);
    showStoreToast("cart", productToAdd.name);
    setTimeout(() => {
      setIsAdded(false);
      requestClose();
    }, 1150);
  };

  const handleToggleFavorite = () => {
    if (!isFavorite(product.id)) showStoreToast("favorite", product.name);
    toggleFavorite(product);
  };

  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const dragYRef = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.matchMedia("(min-width: 640px)").matches) return;
    touchStartY.current = e.touches[0]?.clientY ?? null;
    dragYRef.current = 0;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const distance = (e.touches[0]?.clientY ?? touchStartY.current) - touchStartY.current;
    const nextY = distance > 0 ? Math.min(distance, 520) : 0;
    dragYRef.current = nextY;
    setDragY(nextY);
  };

  const handleTouchEnd = () => {
    if (dragYRef.current >= 120) requestClose();
    else {
      setDragY(0);
      dragYRef.current = 0;
    }
    setIsDragging(false);
    touchStartY.current = null;
  };

  const handleTouchCancel = () => {
    setDragY(0);
    dragYRef.current = 0;
    setIsDragging(false);
    touchStartY.current = null;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* خلفية معتمة (Backdrop) */}
      <div
        onClick={requestClose}
        className={`fixed inset-0 bg-black/80 backdrop-blur-md ${
          isClosing ? "anim-backdrop-fade-out" : "anim-backdrop-fade"
        }`}
        aria-hidden="true"
      />

      {/* غلاف الموديل المتجاوب: في الموبايل Bottom Sheet من الأسفل، وفي الديسكتوب Centered Modal في المنتصف */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-modal-title"
          style={{
            transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
            transition: isDragging ? "none" : "transform 280ms cubic-bezier(.16,1,.3,1)",
          }}
          className={`w-full sm:max-w-lg bg-[var(--color-page-background)] border border-[var(--color-border)] shadow-2xl flex flex-col text-white max-sm:rounded-t-[30px] sm:rounded-3xl max-sm:max-h-[88vh] sm:max-h-[90vh] overflow-hidden ${
            isClosing
              ? "anim-sheet-or-modal-out pointer-events-none"
              : "anim-sheet-or-modal pointer-events-auto"
          }`}
        >
          {/* صورة المنتج تغطي أعلى الموديل وجوانبه بالكامل */}
          <div
            className={`relative w-full overflow-hidden bg-[var(--color-page-background)] group shrink-0 ${
              product.image.includes("/promo/")
                ? "aspect-[3967/1475]"
                : "h-48 sm:h-56"
            }`}
          >
            <Image
              src={product.image} unoptimized={product.image.startsWith("data:")}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, 500px"
              priority
            />

            {/* مقبض السحب للموبايل — فوق الصورة */}
            <div
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchCancel}
              className="absolute top-1.5 left-1/2 z-20 flex h-8 w-24 -translate-x-1/2 touch-none items-center justify-center sm:hidden"
              aria-label="اسحب لأسفل لإغلاق تفاصيل المنتج"
            >
              <span className="h-1.5 w-11 rounded-full bg-white/85 shadow-[0_1px_5px_rgba(0,0,0,0.45)]" />
            </div>

            {/* زر إغلاق الموديل — واضح فوق الصورة */}
            <button
              type="button"
              onClick={requestClose}
              aria-label="إغلاق النافذة"
              className="icon-close absolute left-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/95 shadow-[0_4px_14px_rgba(0,0,0,0.35)] backdrop-blur-sm transition-all duration-200 hover:bg-[var(--color-surface-elevated)] hover:scale-105 active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* محتوى الموديل القابل للتمرير */}
          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">

            {/* تفاصيل المنتج: الاسم والأسعار والوصف */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <h3
                  id="product-modal-title"
                  className="text-lg sm:text-xl font-black text-white leading-tight"
                >
                  {product.name}
                </h3>

                {/* السعر — يتغير حسب الحجم المختار */}
                <div className="flex flex-col items-end shrink-0">
                  <div className="flex items-baseline gap-1 text-[var(--color-primary)] font-black text-xl sm:text-2xl">
                    <span>{effectivePrice}</span>
                    <span className="text-xs text-[var(--color-text-muted)]">ج.م</span>
                  </div>
                  {effectiveOriginalPrice && effectiveOriginalPrice > effectivePrice && (
                    <span className="text-xs text-[var(--color-text-muted)] line-through font-medium">
                      {effectiveOriginalPrice} ج.م
                    </span>
                  )}
                </div>
              </div>

              {/* الوصف */}
              <p className="text-xs sm:text-sm text-[var(--color-text-muted)] leading-relaxed">
                {product.description ||
                  "وجبة شهية ومميزة محضرة طازجة يومياً بأجود المكونات والتوابل الخاصة من مطعم روزماري لإرضاء ذوقك الرفيع."}
              </p>
            </div>

            {/* ━━━ اختيار الحجم (يظهر فقط للمنتجات التي لها أحجام) ━━━ */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-2.5">
                <p className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)] flex items-center gap-1.5">
                  <span>اختار الحجم</span>
                  <span className="text-[10px] text-[var(--color-text-muted)] font-normal">(مطلوب)</span>
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {product.sizes.map((size) => {
                    const isSelected = selectedSize?.id === size.id;
                    return (
                      <button
                        key={size.id}
                        type="button"
                        onClick={() => setSelectedSize(size)}
                        className={`flex flex-col items-center gap-0.5 rounded-xl border p-2.5 transition-all duration-200 ${
                          isSelected
                            ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 shadow-md shadow-[var(--color-primary)]/15 scale-[1.03]"
                            : "border-[var(--color-border)] bg-[var(--color-page-background)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-page-background)]"
                        }`}
                      >
                        <span
                          className={`text-xs font-black ${
                            isSelected ? "text-[var(--color-on-primary)]" : "text-white"
                          }`}
                        >
                          {size.name}
                        </span>
                        {size.detail && (
                          <span
                            className={`text-[9px] leading-tight text-center ${
                              isSelected ? "text-[var(--color-on-primary)]/85" : "text-[var(--color-text-muted)]"
                            }`}
                          >
                            {size.detail}
                          </span>
                        )}
                        <span
                          className={`text-xs font-bold mt-0.5 ${
                            isSelected ? "text-[var(--color-on-primary)]" : "text-[var(--color-text-muted)]"
                          }`}
                        >
                          {size.price} ج.م
                        </span>
                        {size.originalPrice && size.originalPrice > size.price && (
                          <span
                            className={`text-[9px] line-through ${
                              isSelected ? "text-[var(--color-on-primary)]/70" : "text-[var(--color-text-muted)]"
                            }`}
                          >
                            {size.originalPrice} ج.م
                          </span>
                        )}

                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* اختيار الكمية */}
            <div className="rounded-2xl bg-[var(--color-page-background)] border border-[var(--color-border)] p-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs sm:text-sm font-bold text-white block">
                  الكمية المطلوبة
                </span>
                <span className="text-[11px] text-[var(--color-text-muted)]">
                  المجموع: {lineTotal} ج.م
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  disabled={quantity <= 1}
                  aria-label="تقليل الكمية"
                  className="h-8 w-8 flex items-center justify-center rounded-xl bg-[var(--color-page-background)] border border-[var(--color-border)] text-white hover:bg-[var(--color-primary)] hover:border-[var(--color-primary)] disabled:opacity-30 disabled:hover:bg-[var(--color-page-background)] disabled:hover:border-[var(--color-border)] transition-colors"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>

                <span className="text-base font-black text-[var(--color-primary)] min-w-[20px] text-center">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={() => setQuantity((prev) => prev + 1)}
                  aria-label="زيادة الكمية"
                  className="h-8 w-8 flex items-center justify-center rounded-xl bg-[var(--color-page-background)] border border-[var(--color-border)] text-white hover:bg-[var(--color-primary)] hover:border-[var(--color-primary)] transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* حقل الملاحظات الخاصة على الوجبة أو العرض */}
            <div className="space-y-1.5">
              <label
                htmlFor="product-notes"
                className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)] flex items-center justify-between"
              >
                <span>
                  {product.category === "offers"
                    ? "ملاحظات وتفاصيل العرض"
                    : "ملاحظات خاصة على الوجبة"}
                </span>
                <span className="text-[10px] text-[var(--color-text-muted)] font-normal">(اختياري)</span>
              </label>
              <textarea
                id="product-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                maxLength={150}
                placeholder={
                  product.category === "offers"
                    ? "مثل: اختيارات الساندوتشات، صوصات إضافية، كانز دايت أو عادي..."
                    : "مثل: بدون بصل، صوص زيادة، درجة التسوية، بدون كاتشب..."
                }
                className="w-full rounded-xl bg-[var(--color-page-background)] border border-[var(--color-border)] p-3 text-xs sm:text-sm text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors resize-none"
              />
              <div className="flex justify-between items-center text-[10px] text-[var(--color-text-muted)] px-1">
                <span>
                  {product.category === "offers"
                    ? "سيتم إرفاق اختياراتك وملاحظاتك مع الطلب للمطبخ مباشرة"
                    : "سيتم إرفاق ملاحظاتك مع الطلب للمطبخ مباشرة"}
                </span>
                <span>{notes.length}/150</span>
              </div>
            </div>

            {/* كود الخصم — يُطبّق على هذا المنتج فقط */}
            <div className="space-y-1.5">
              <label
                htmlFor="product-coupon"
                className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)] flex items-center justify-between"
              >
                <span className="flex items-center gap-1.5">
                  <TicketPercent className="h-3.5 w-3.5 text-[var(--color-primary)]" />
                  كود خصم المنتج
                </span>
                <span className="text-[10px] text-[var(--color-text-muted)] font-normal">(اختياري)</span>
              </label>
              <div className="flex gap-2">
                <input
                  id="product-coupon"
                  value={couponInput}
                  onChange={(e) => {
                    setCouponInput(e.target.value.toUpperCase());
                    setAppliedCoupon(null);
                    setCouponMessage("");
                  }}
                  dir="ltr"
                  maxLength={30}
                  placeholder="مثال: ROS10"
                  className="min-w-0 flex-1 rounded-xl bg-[var(--color-page-background)] border border-[var(--color-border)] px-3 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-white placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={couponLoading}
                  className="shrink-0 rounded-xl border border-[var(--color-primary-border)] bg-[var(--color-primary)] px-4 py-2.5 text-xs font-bold text-[var(--color-on-primary)] transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "تطبيق"}
                </button>
              </div>
              <p className="text-[10px] text-[var(--color-text-muted)]">الخصم هيطبّق على المنتج ده فقط.</p>
              {appliedCoupon && (
                <div className="rounded-lg border border-[var(--color-success)]/30 bg-[var(--color-success)]/10 px-2.5 py-1.5 text-[11px] font-bold text-[var(--color-success)]">
                  كود {appliedCoupon.code} — خصم {appliedCoupon.discountPercent}%
                </div>
              )}
              {couponMessage && (
                <p className={`text-[10px] font-semibold ${couponOk ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"}`}>
                  {couponMessage}
                </p>
              )}
            </div>
          </div>

          {/* تذييل الموديل: زر الإضافة للسلة مع المفضلة والإجمالي */}
          <div className="p-4 sm:p-5 border-t border-[var(--color-border)] bg-[var(--color-page-background)] shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isAdded}
                className={`flex-1 py-3.5 rounded-xl font-bold text-sm text-[var(--color-on-primary)] shadow-lg shadow-black/50 transition-all flex items-center justify-center gap-2 ${
                  isAdded
                    ? "bg-emerald-600 scale-[0.99]"
                    : "bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] hover:scale-[1.01] active:scale-95"
                }`}
              >
                {isAdded ? (
                  <>
                    <Check className="h-5 w-5" />
                    <span>
                      تمت إضافة {product.category === "offers" ? "العرض" : "الوجبة"} للسلة بنجاح!
                    </span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4" />
                    <span>
                      {product.category === "offers" ? "اطلب العرض الآن" : "أضف إلى السلة"} • {payableLineTotal} ج.م
                    </span>
                  </>
                )}
              </button>

              {/* زر المفضلة — بنفس هوفر كارت المنتج (امتلاء var(--color-icon)) */}
              <button
                type="button"
                onClick={handleToggleFavorite}
                aria-label={favorited ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
                className="group/fav relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[var(--color-primary-border)] bg-[var(--color-surface-elevated)] transition-colors duration-200 active:scale-95"
              >
                {!favorited && (
                  <span
                    className="absolute inset-0 translate-y-full rounded-xl bg-[var(--color-icon)] transition-transform duration-300 ease-out group-hover/fav:translate-y-0"
                    aria-hidden="true"
                  />
                )}
                <Heart
                  className={`relative z-10 h-5 w-5 transition-colors duration-200 ${
                    favorited
                      ? "fill-[#ff3b30] text-[#ff3b30]"
                      : "text-[var(--color-icon)] group-hover/fav:text-[var(--color-on-primary)]"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetailsModal() {
  const { selectedProduct, setSelectedProduct } = useShop();

  if (!selectedProduct) return null;

  return (
    <ProductModalInner
      key={selectedProduct.id}
      product={selectedProduct}
      onClose={() => setSelectedProduct(null)}
    />
  );
}
