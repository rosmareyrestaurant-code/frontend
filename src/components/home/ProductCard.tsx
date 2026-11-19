"use client";

import Image from "next/image";
import { Heart, ShoppingCart } from "lucide-react";
import { Product } from "@/types";
import { useShop } from "@/context/ShopContext";
import { useCatalogProduct } from "@/hooks/useCatalog";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product: baseProduct }: ProductCardProps) {
  // الصورة/السعر/الأحجام اللي الأدمن رفعها من ملف أو إكسيل
  const product = useCatalogProduct(baseProduct);
  const { toggleFavorite, isFavorite, setSelectedProduct } = useShop();

  const favorited = isFavorite(product.id);

  const handleOpenModal = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setSelectedProduct(product);
  };

  const handleToggleFavorite = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    toggleFavorite(product);
  };

  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  return (
    <div
      onClick={() => setSelectedProduct(product)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setSelectedProduct(product);
        }
      }}
      className="group relative flex h-full flex-col justify-between rounded-2xl bg-gradient-to-b from-[#181411] to-[#100e0c] p-3.5 border border-[#26201a] shadow-lg shadow-black/40 cursor-pointer select-none sm:p-3"
    >
      {/* بادج الخصم: نصه فوق الكارت ونصه جوه — زي عدّاد بانرات العروض */}
      {discountPercent && (
        <span className="absolute top-0 right-3 z-20 inline-flex -translate-y-1/2 items-center rounded-full bg-gradient-to-r from-[#ef4444] to-[#ff7a00] px-3 py-1 text-[11px] font-black text-white shadow-lg shadow-black/50 ring-2 ring-[#0b0a09] select-none">
          خصم {discountPercent}%
        </span>
      )}

      {/* صورة المنتج — مع مسافة تفصل بين البادج المعلق والصورة */}
      <div className="group/img relative mx-auto mt-2.5 h-32 w-full overflow-hidden rounded-xl bg-[#14110e] sm:h-36">
        <Image
          src={product.image} unoptimized={product.image.startsWith("data:")}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover/img:scale-110"
          sizes="(max-width: 640px) 220px, 260px"
        />
      </div>

      {/* تفاصيل المنتج */}
      <div className="mt-2.5 space-y-1 text-right">
        <h3 className="text-sm font-bold text-white transition-colors line-clamp-1">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-[11px] text-[#8c8277] line-clamp-1 leading-relaxed">
            {product.description}
          </p>
        )}
      </div>

      {/* منطقة السعر والأزرار في الأسفل */}
      <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-[#231e18]">
        {/* السعر الحالي وبجانبه السعر القديم المشطوب بخط خفيف */}
        <div className="flex min-w-0 flex-1 items-baseline gap-2 flex-wrap">
          {/* السعر الحالي */}
          <div className="flex items-baseline gap-1">
            <span className="text-base sm:text-lg font-black text-[#ff7a00]">
              {product.price}
            </span>
            <span className="text-[11px] font-bold text-[#a89f94]">
              ج.م
            </span>
          </div>

          {/* السعر القديم المشطوب بخط خفيف وأنيق */}
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-xs sm:text-sm font-medium text-[#8a8175] line-through decoration-[#8a8175]/60 decoration-1">
              {product.originalPrice} ج.م
            </span>
          )}
        </div>

        {/* أزرار الإجراءات: المفضلة (أحمر) + السلة (برتقالي) بتصميم مربع rounded-xl متناسق */}
        <div className="flex shrink-0 items-center gap-1">
          {/* زر المفضلة — مربع rounded-xl ويمتلئ بالأحمر عند الهاوفر */}
          <button
            type="button"
            onClick={handleToggleFavorite}
            aria-label={favorited ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
            className={`group/fav relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200 overflow-hidden active:scale-90 ${
              favorited
                ? "bg-[#ff3b30] border-[#ff3b30] text-white shadow-md shadow-red-900/30"
                : "bg-[#1c1815] border-[#2b241e] hover:border-[#ff3b30]/60"
            }`}
          >
            {!favorited && (
              <span
                className="absolute inset-0 bg-[#ff3b30] translate-y-full group-hover/fav:translate-y-0 transition-transform duration-300 ease-out rounded-xl"
                aria-hidden="true"
              />
            )}
            <Heart
              className={`relative z-10 h-4 w-4 transition-colors duration-200 sm:h-3.5 sm:w-3.5 ${
                favorited
                  ? "fill-white text-white"
                  : "text-[#a89f94] group-hover/fav:text-white"
              }`}
            />
          </button>

          {/* زر السلة — يفتح نافذة تفاصيل الوجبة والملاحظات والكميات */}
          <button
            type="button"
            onClick={handleOpenModal}
            aria-label={`تحديد كمية وملاحظات ${product.name}`}
            className="group/cart relative flex h-9 w-9 items-center justify-center rounded-xl font-bold transition-all duration-200 active:scale-90 overflow-hidden shadow-sm bg-[#1c1815] border border-[#2b241e] hover:border-[#ff7a00]/60"
          >
            <span
              className="absolute inset-0 bg-[#ff7a00] translate-y-full group-hover/cart:translate-y-0 transition-transform duration-300 ease-out rounded-xl"
              aria-hidden="true"
            />
            <ShoppingCart className="relative z-10 h-4 w-4 text-[#a89f94] group-hover/cart:text-white transition-colors duration-200 sm:h-3.5 sm:w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
