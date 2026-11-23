"use client";

import Image from "next/image";
import Link from "next/link";
import { X, Heart, ShoppingCart, Trash2, ArrowLeft } from "lucide-react";
import { useShop } from "@/context/ShopContext";
import { useEffect, useRef, useState } from "react";
import { useStoreToast } from "@/components/common/StoreToast";
import { formatPriceRange, getProductPriceRange } from "@/lib/price-range";

export default function FavoritesDrawer() {
  const {
    favorites,
    isFavoritesOpen,
    setIsFavoritesOpen,
    toggleFavorite,
    addToCart,
    favoritesCount,
  } = useShop();

  const { showStoreToast } = useStoreToast();

  const [isVisible, setIsVisible] = useState(isFavoritesOpen);
  const [wasOpen, setWasOpen] = useState(isFavoritesOpen);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const dragYRef = useRef(0);

  // نُبقي الدرج محمّلاً أثناء أنيميشن الخروج ثم نلغيه بعد انتهاء الحركة
  if (isFavoritesOpen !== wasOpen) {
    setWasOpen(isFavoritesOpen);
    if (isFavoritesOpen) setIsVisible(true);
  }

  const isClosing = !isFavoritesOpen && isVisible;

  useEffect(() => {
    if (!isClosing) return;

    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 320);

    return () => clearTimeout(timer);
  }, [isClosing]);

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
    if (dragYRef.current >= 120) setIsFavoritesOpen(false);
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

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* خلفية معتمة (Backdrop) */}
      <div
        onClick={() => setIsFavoritesOpen(false)}
        className={`absolute inset-0 bg-black/80 backdrop-blur-sm ${
          isClosing ? "anim-backdrop-fade-out" : "anim-backdrop-fade"
        }`}
        aria-hidden="true"
      />

      {/* لوحة المفضلة المنزلقة: على الموبايل من الأسفل كـ Bottom Sheet مع انحناء في الأعلى، وعلى الديسكتوب من الجنب بدون أي فراغ */}
      <aside className="fixed max-sm:inset-x-0 max-sm:bottom-0 sm:inset-y-0 sm:left-0 z-50 flex pointer-events-none">
        <div
          style={{
            transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
            transition: isDragging ? "none" : "transform 280ms cubic-bezier(.16,1,.3,1)",
          }}
          className={`w-full sm:w-[420px] max-w-full bg-[var(--color-page-background)] shadow-2xl flex flex-col text-white max-sm:h-[88vh] max-sm:max-h-[92vh] max-sm:rounded-t-[28px] max-sm:border-t max-sm:border-[var(--color-border)] sm:h-full sm:border-r sm:border-[var(--color-border)] ${
            isClosing
              ? "anim-sheet-or-drawer-out pointer-events-none"
              : "anim-sheet-or-drawer pointer-events-auto"
          }`}>
          
          {/* مقبض سحب أنيق للموبايل */}
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchCancel}
            className="mx-auto mt-1 flex h-9 w-20 touch-none items-center justify-center sm:hidden shrink-0"
            aria-label="اسحب لأسفل لإغلاق المفضلة"
          >
            <span className="h-1.5 w-12 rounded-full bg-[var(--color-on-primary)]" />
          </div>

          {/* رأس المفضلة */}
          <div className="flex items-center justify-between px-4 pb-3.5 pt-1.5 sm:p-5 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-[0_8px_16px_-8px_rgba(86,98,74,0.8)]">
                <Heart className="h-5 w-5 fill-[#fff]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  قائمة المفضلة
                </h2>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {favoritesCount} {favoritesCount === 1 ? "وجبة مفضلة" : "وجبات مفضلة"}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsFavoritesOpen(false)}
              aria-label="إغلاق المفضلة"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-[0_6px_14px_-6px_rgba(86,98,74,0.8)] transition-colors hover:bg-[var(--color-primary-hover)] active:scale-95"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* محتوى المفضلة */}
          {favorites.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="h-20 w-20 rounded-2xl border border-[var(--color-primary-hover)] bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-[0_14px_28px_-14px_rgba(86,98,74,0.9)] flex items-center justify-center mb-4">
                <Heart className="h-10 w-10 stroke-[1.5]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">
                لا توجد وجبات في المفضلة
              </h3>
              <p className="text-xs sm:text-sm text-[var(--color-text-muted)] max-w-xs mb-6 leading-relaxed">
                اضغط على أيقونة القلب على أي وجبة تعجبك لتحفظها هنا وتطلبها لاحقاً بكل سهولة!
              </p>
              <Link
                href="/menu"
                onClick={() => setIsFavoritesOpen(false)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-black/40 hover:scale-105 active:scale-95 transition-all"
              >
                <span>تصفح الأكلات والمنيو</span>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 divide-y divide-[var(--color-text-primary)]">
              {favorites.map((product) => {
                const priceRange = getProductPriceRange(product);
                return (
                <div key={product.id} className="pt-3.5 first:pt-0 flex gap-3.5 items-center">
                  {/* صورة الوجبة */}
                  <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden bg-[var(--color-page-background)] shrink-0 border border-[var(--color-border)]">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </div>

                  {/* تفاصيل الوجبة */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-white truncate mb-1">
                      {product.name}
                    </h4>
                    <div className="flex items-baseline gap-1 text-[var(--color-primary)] font-black text-sm mb-2">
                      {priceRange.isRange && (
                        <span className="text-[10px] font-bold text-[var(--color-text-muted)]">من</span>
                      )}
                      <span>{formatPriceRange(priceRange)}</span>
                      <span className="text-[10px] text-[var(--color-text-muted)]">ج.م</span>
                      {priceRange.minOriginal && (
                        <span className="text-[10px] text-[var(--color-text-muted)] line-through mr-1">
                          {priceRange.minOriginal} ج.م
                        </span>
                      )}
                    </div>

                    {/* أزرار الإجراء: إضافة للسلة + حذف */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          addToCart(product);
                          showStoreToast("cart", product.name);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white px-3 py-1.5 text-xs font-bold shadow-md transition-all active:scale-95"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        <span>أضف للسلة</span>
                      </button>

                      <button
                        onClick={() => toggleFavorite(product)}
                        aria-label="إزالة من المفضلة"
                        className="text-[var(--color-text-muted)] hover:text-[#ff3b30] p-1.5 rounded-lg hover:bg-[var(--color-border)] transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}

          {/* تذييل المفضلة */}
          {favorites.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-[var(--color-border)] bg-[var(--color-page-background)]">
              <Link
                href="/menu"
                onClick={() => setIsFavoritesOpen(false)}
                className="w-full py-3 rounded-xl bg-[var(--color-page-background)] border border-[var(--color-text-primary)] hover:border-[var(--color-primary)]/50 text-center font-bold text-sm text-[var(--color-text-primary)] hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <span>تصفح المزيد من الأكلات</span>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
