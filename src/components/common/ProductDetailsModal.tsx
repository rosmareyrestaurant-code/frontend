"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { X, Heart, Plus, Minus, ShoppingBag, Check } from "lucide-react";
import { useShop } from "@/context/ShopContext";
import { Product, ProductSize } from "@/types";
// التعديلات بقت جاية من الـ API نفسه
// import { useCatalogProduct } from "@/hooks/useCatalog";
import { useStoreToast } from "@/components/common/StoreToast";

interface ProductModalInnerProps {
  product: Product;
  onClose: () => void;
}

function ProductModalInner({ product: baseProduct, onClose }: ProductModalInnerProps) {
  const product = baseProduct;
  const { addToCart, toggleFavorite, isFavorite } = useShop();
  const { showStoreToast } = useStoreToast();

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

  const handleAddToCart = () => {
    // لو في حجم محدد، نعمل نسخة من المنتج بالسعر والاسم الصح
    const productToAdd = selectedSize
      ? {
          ...product,
          price: selectedSize.price,
          originalPrice: selectedSize.originalPrice,
          name: `${product.name} (${selectedSize.name})`,
        }
      : product;

    addToCart(productToAdd, quantity, notes, selectedSize?.id);
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
          className={`w-full sm:max-w-lg bg-[#F2F2ED] border border-[#2b241e] shadow-2xl flex flex-col text-white max-sm:rounded-t-[30px] sm:rounded-3xl max-sm:max-h-[88vh] sm:max-h-[90vh] overflow-hidden ${
            isClosing
              ? "anim-sheet-or-modal-out pointer-events-none"
              : "anim-sheet-or-modal pointer-events-auto"
          }`}
        >
          {/* صورة المنتج تغطي أعلى الموديل وجوانبه بالكامل */}
          <div
            className={`relative w-full overflow-hidden bg-[#F2F2ED] group shrink-0 ${
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
              className="absolute left-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-white/95 text-[#26352B] shadow-[0_4px_14px_rgba(0,0,0,0.35)] backdrop-blur-sm transition-all duration-200 hover:bg-white hover:scale-105 active:scale-95"
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
                  <div className="flex items-baseline gap-1 text-[#ff7a00] font-black text-xl sm:text-2xl">
                    <span>{effectivePrice}</span>
                    <span className="text-xs text-[#a89f94]">ج.م</span>
                  </div>
                  {effectiveOriginalPrice && effectiveOriginalPrice > effectivePrice && (
                    <span className="text-xs text-[#736a61] line-through font-medium">
                      {effectiveOriginalPrice} ج.م
                    </span>
                  )}
                </div>
              </div>

              {/* الوصف */}
              <p className="text-xs sm:text-sm text-[#a89f94] leading-relaxed">
                {product.description ||
                  "وجبة شهية ومميزة محضرة طازجة يومياً بأجود المكونات والتوابل الخاصة من مطعم روزماري لإرضاء ذوقك الرفيع."}
              </p>
            </div>

            {/* ━━━ اختيار الحجم (يظهر فقط للمنتجات التي لها أحجام) ━━━ */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-2.5">
                <p className="text-xs sm:text-sm font-bold text-[#d1cbc4] flex items-center gap-1.5">
                  <span>اختار الحجم</span>
                  <span className="text-[10px] text-[#736a61] font-normal">(مطلوب)</span>
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
                            ? "border-[#ff7a00] bg-[#ff7a00]/10 shadow-md shadow-[#ff7a00]/15 scale-[1.03]"
                            : "border-[#2b241e] bg-[#F2F2ED] hover:border-[#ff7a00]/50 hover:bg-[#F2F2ED]"
                        }`}
                      >
                        <span
                          className={`text-xs font-black ${
                            isSelected ? "text-[#fff]" : "text-white"
                          }`}
                        >
                          {size.name}
                        </span>
                        {size.detail && (
                          <span
                            className={`text-[9px] leading-tight text-center ${
                              isSelected ? "text-[#fff]/85" : "text-[#857b72]"
                            }`}
                          >
                            {size.detail}
                          </span>
                        )}
                        <span
                          className={`text-xs font-bold mt-0.5 ${
                            isSelected ? "text-[#fff]" : "text-[#c4b9b0]"
                          }`}
                        >
                          {size.price} ج.م
                        </span>
                        {size.originalPrice && size.originalPrice > size.price && (
                          <span
                            className={`text-[9px] line-through ${
                              isSelected ? "text-[#fff]/70" : "text-[#6b6259]"
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
            <div className="rounded-2xl bg-[#F2F2ED] border border-[#26201a] p-3.5 flex items-center justify-between">
              <div>
                <span className="text-xs sm:text-sm font-bold text-white block">
                  الكمية المطلوبة
                </span>
                <span className="text-[11px] text-[#8a8175]">
                  المجموع: {lineTotal} ج.م
                </span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  disabled={quantity <= 1}
                  aria-label="تقليل الكمية"
                  className="h-8 w-8 flex items-center justify-center rounded-xl bg-[#F2F2ED] border border-[#30251e] text-white hover:bg-[#ff7a00] hover:border-[#ff7a00] disabled:opacity-30 disabled:hover:bg-[#F2F2ED] disabled:hover:border-[#30251e] transition-colors"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>

                <span className="text-base font-black text-[#ff7a00] min-w-[20px] text-center">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={() => setQuantity((prev) => prev + 1)}
                  aria-label="زيادة الكمية"
                  className="h-8 w-8 flex items-center justify-center rounded-xl bg-[#F2F2ED] border border-[#30251e] text-white hover:bg-[#ff7a00] hover:border-[#ff7a00] transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* حقل الملاحظات الخاصة على الوجبة أو العرض */}
            <div className="space-y-1.5">
              <label
                htmlFor="product-notes"
                className="text-xs sm:text-sm font-bold text-[#d1cbc4] flex items-center justify-between"
              >
                <span>
                  {product.category === "offers"
                    ? "ملاحظات وتفاصيل العرض"
                    : "ملاحظات خاصة على الوجبة"}
                </span>
                <span className="text-[10px] text-[#736a61] font-normal">(اختياري)</span>
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
                className="w-full rounded-xl bg-[#F2F2ED] border border-[#2b241e] p-3 text-xs sm:text-sm text-white placeholder-[#685f55] focus:outline-none focus:border-[#ff7a00] transition-colors resize-none"
              />
              <div className="flex justify-between items-center text-[10px] text-[#736a61] px-1">
                <span>
                  {product.category === "offers"
                    ? "سيتم إرفاق اختياراتك وملاحظاتك مع الطلب للمطبخ مباشرة"
                    : "سيتم إرفاق ملاحظاتك مع الطلب للمطبخ مباشرة"}
                </span>
                <span>{notes.length}/150</span>
              </div>
            </div>
          </div>

          {/* تذييل الموديل: زر الإضافة للسلة مع المفضلة والإجمالي */}
          <div className="p-4 sm:p-5 border-t border-[#231d17] bg-[#F2F2ED] shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isAdded}
                className={`flex-1 py-3.5 rounded-xl font-bold text-sm text-white shadow-lg shadow-black/50 transition-all flex items-center justify-center gap-2 ${
                  isAdded
                    ? "bg-emerald-600 scale-[0.99]"
                    : "bg-gradient-to-r from-[#ff7a00] to-[#e66e00] hover:scale-[1.01] active:scale-95"
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
                      {product.category === "offers" ? "اطلب العرض الآن" : "أضف إلى السلة"} • {lineTotal} ج.م
                    </span>
                  </>
                )}
              </button>

              {/* زر المفضلة — بنفس هوفر كارت المنتج (امتلاء #526B58) */}
              <button
                type="button"
                onClick={handleToggleFavorite}
                aria-label={favorited ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
                className="group/fav relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#899B83] bg-white transition-colors duration-200 active:scale-95"
              >
                {!favorited && (
                  <span
                    className="absolute inset-0 translate-y-full rounded-xl bg-[#526B58] transition-transform duration-300 ease-out group-hover/fav:translate-y-0"
                    aria-hidden="true"
                  />
                )}
                <Heart
                  className={`relative z-10 h-5 w-5 transition-colors duration-200 ${
                    favorited
                      ? "fill-[#ff3b30] text-[#ff3b30]"
                      : "text-[#526B58] group-hover/fav:text-[#fff]"
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
