"use client";

import Image from "next/image";
import Link from "next/link";
import { X, Heart, ShoppingCart, Trash2, ArrowLeft } from "lucide-react";
import { useShop } from "@/context/ShopContext";
import { useEffect, useRef, useState } from "react";
import { useStoreToast } from "@/components/common/StoreToast";

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
  const touchStartY = useRef<number | null>(null);

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
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const distance = (e.touches[0]?.clientY ?? touchStartY.current) - touchStartY.current;
    if (distance > 0) setDragY(Math.min(distance, 180));
  };

  const handleTouchEnd = () => {
    if (dragY > 90) setIsFavoritesOpen(false);
    setDragY(0);
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
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ transform: dragY > 0 ? `translateY(${dragY}px)` : undefined, transition: dragY > 0 ? "none" : undefined }}
          className={`w-full sm:w-[420px] max-w-full bg-[#120f0d] shadow-2xl flex flex-col text-white max-sm:h-[88vh] max-sm:max-h-[92vh] max-sm:rounded-t-[28px] max-sm:border-t max-sm:border-[#2b241e] sm:h-full sm:border-r sm:border-[#26201a] ${
            isClosing
              ? "anim-sheet-or-drawer-out pointer-events-none"
              : "anim-sheet-or-drawer pointer-events-auto"
          }`}>
          
          {/* مقبض سحب أنيق للموبايل */}
          <div className="w-12 h-1.5 rounded-full bg-[#3a3129] mx-auto mt-2.5 mb-1 sm:hidden shrink-0" />

          {/* رأس المفضلة */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#231d17]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#ff3b30]/15 text-[#ff3b30] border border-[#ff3b30]/30">
                <Heart className="h-5 w-5 fill-[#ff3b30]" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white">
                  قائمة المفضلة
                </h2>
                <span className="text-xs text-[#a89f94]">
                  {favoritesCount} {favoritesCount === 1 ? "وجبة مفضلة" : "وجبات مفضلة"}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsFavoritesOpen(false)}
              aria-label="إغلاق المفضلة"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1c1613] text-[#a89f94] hover:text-white hover:bg-[#251e19] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* محتوى المفضلة */}
          {favorites.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <div className="h-20 w-20 rounded-2xl bg-[#1b1512] border border-[#2b241e] text-[#736a61] flex items-center justify-center mb-4">
                <Heart className="h-10 w-10 stroke-[1.5]" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">
                لا توجد وجبات في المفضلة
              </h3>
              <p className="text-xs sm:text-sm text-[#a89f94] max-w-xs mb-6 leading-relaxed">
                اضغط على أيقونة القلب على أي وجبة تعجبك لتحفظها هنا وتطلبها لاحقاً بكل سهولة!
              </p>
              <Link
                href="/menu"
                onClick={() => setIsFavoritesOpen(false)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff7a00] to-[#e66e00] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-black/40 hover:scale-105 active:scale-95 transition-all"
              >
                <span>تصفح الأكلات والمنيو</span>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 divide-y divide-[#1e1914]">
              {favorites.map((product) => (
                <div key={product.id} className="pt-3.5 first:pt-0 flex gap-3.5 items-center">
                  {/* صورة الوجبة */}
                  <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden bg-[#1a1412] shrink-0 border border-[#26201a]">
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
                    <div className="flex items-baseline gap-1 text-[#ff7a00] font-black text-sm mb-2">
                      <span>{product.price}</span>
                      <span className="text-[10px] text-[#a89f94]">ج.م</span>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <span className="text-[10px] text-[#736a61] line-through mr-1">
                          {product.originalPrice} ج.م
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
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#ff7a00] hover:bg-[#e66e00] text-white px-3 py-1.5 text-xs font-bold shadow-md transition-all active:scale-95"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        <span>أضف للسلة</span>
                      </button>

                      <button
                        onClick={() => toggleFavorite(product)}
                        aria-label="إزالة من المفضلة"
                        className="text-[#736a61] hover:text-[#ff3b30] p-1.5 rounded-lg hover:bg-[#1a1412] transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* تذييل المفضلة */}
          {favorites.length > 0 && (
            <div className="p-4 sm:p-5 border-t border-[#231d17] bg-[#15110e]">
              <Link
                href="/menu"
                onClick={() => setIsFavoritesOpen(false)}
                className="w-full py-3 rounded-xl bg-[#1f1915] border border-[#2f251f] hover:border-[#ff7a00]/50 text-center font-bold text-sm text-[#d1cbc4] hover:text-white transition-all flex items-center justify-center gap-2"
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
