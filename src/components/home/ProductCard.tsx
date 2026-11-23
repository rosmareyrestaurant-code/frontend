"use client";

import Image from "next/image";
import { Heart, ShoppingCart } from "lucide-react";
import { Product } from "@/types";
import { useShop } from "@/context/ShopContext";
// التعديلات بقت جاية من الـ API نفسه
// import { useCatalogProduct } from "@/hooks/useCatalog";
import { useStoreToast } from "@/components/common/StoreToast";
import { formatPriceRange, getProductPriceRange } from "@/lib/price-range";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product: baseProduct }: ProductCardProps) {
  const product = baseProduct;
  const { toggleFavorite, isFavorite, setSelectedProduct } = useShop();
  const { showStoreToast } = useStoreToast();

  const favorited = isFavorite(product.id);

  const handleOpenModal = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setSelectedProduct(product);
  };

  const handleToggleFavorite = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    if (!favorited) showStoreToast("favorite", product.name);
    toggleFavorite(product);
  };

  const priceRange = getProductPriceRange(product);
  const discountPercent = priceRange.discountPercent;

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
      className="group relative flex h-full flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-elevated)] shadow-[0_2px_10px_rgba(24,24,14,0.06)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(24,24,14,0.12)] cursor-pointer select-none"
    >
      {/* بادج الخصم: نصه متداخل مع الكارت ونصه خارجه */}
      {discountPercent && (
        <span className="absolute -top-2.5 left-3 z-20 rounded-md bg-[#b45309] px-2.5 py-1 text-[10px] font-bold leading-none text-[var(--color-on-primary)] shadow-md shadow-black/20">
          خصم {discountPercent}%
        </span>
      )}

      {/* صورة المنتج — تغطي أعلى الكارت وجوانبه بدون فراغ */}
      <div className="relative aspect-[5/3] w-full overflow-hidden rounded-t-2xl bg-[var(--color-surface-secondary)]">
        <Image
          src={product.image || "/images/logo-rosemary-green.png"}
          unoptimized={product.image.startsWith("data:") || !product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          sizes="(max-width: 640px) 220px, 260px"
        />
      </div>

      {/* تفاصيل المنتج */}
      <div className="flex flex-1 flex-col px-2.5 pb-2.5 pt-2 text-center">
        <h3 className="line-clamp-1 text-[13px] font-black leading-snug text-[var(--color-text-primary)] transition-colors group-hover:text-[var(--color-primary)] sm:text-sm">
          {product.name}
        </h3>
        {product.description && (
          <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-[var(--color-text-muted)]">
            {product.description}
          </p>
        )}

        <div className="mt-auto pt-2.5">
          {/* السعر الحالي وبجانبه السعر القديم المشطوب */}
          <div className="flex items-baseline justify-center gap-2">
            {priceRange.isRange && (
              <span className="text-[11px] font-bold text-[var(--color-text-muted)]">من</span>
            )}
            <span className="text-[17px] font-black leading-none text-[var(--color-text-primary)]">
              {formatPriceRange(priceRange)}
              <span className="mr-1 text-[11px] font-bold">ج.م</span>
            </span>
            {priceRange.minOriginal && (
              <span className="text-[11px] font-medium text-[var(--color-text-muted)] line-through decoration-[var(--color-text-muted)]/70 decoration-1">
                {priceRange.minOriginal} ج.م
              </span>
            )}
          </div>

          {/* زر إضافة للسلة + المفضلة */}
          <div className="mt-2.5 flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenModal}
              aria-label={`تحديد كمية وملاحظات ${product.name}`}
              className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[var(--color-primary)] text-[12px] font-bold leading-none text-[var(--color-on-primary)] transition-colors duration-200 hover:bg-[var(--color-primary-hover)] active:scale-[0.99]"
            >
              <ShoppingCart className="h-4 w-4" />
              أضف للسلة
            </button>

            <button
              type="button"
              onClick={handleToggleFavorite}
              aria-label={favorited ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
              className="group/fav relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--color-primary-border)] bg-[var(--color-surface-elevated)] transition-colors duration-200 active:scale-95"
            >
              {!favorited && (
                <span
                  className="absolute inset-0 translate-y-full rounded-lg bg-[var(--color-icon)] transition-transform duration-300 ease-out group-hover/fav:translate-y-0"
                  aria-hidden="true"
                />
              )}
              <Heart
                className={`relative z-10 h-4 w-4 transition-colors duration-200 ${
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
  );
}
