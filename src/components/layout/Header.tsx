"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/components/common/Logo";
import { usePathname, useRouter } from "next/navigation";
import { Search, Heart, ShoppingBag, ShoppingCart, Menu, X, Utensils, ChevronLeft, BookImage } from "lucide-react";
import { useShop } from "@/context/ShopContext";
// Mock Data معطّلة — البحث بيقرأ من الـ API
// import { ALL_PRODUCTS } from "@/data/mockData";
import { Product } from "@/types";
import { normalizeArabic } from "@/lib/arabic";
import { formatPriceRange, getProductPriceRange } from "@/lib/price-range";
import { SOCIAL_PREVIEW_IMAGE_URL } from "@/data/siteConfig";

const CATEGORY_NAMES: Record<string, string> = {
  pizza: "بيتزا",
  chicken: "كريب",
  burger: "سندوتشات",
  pasta: "مكرونة",
  drinks: "مشروبات",
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { cartCount, favoritesCount, setIsCartOpen, setIsFavoritesOpen, setSelectedProduct, setIsMenuImageOpen } = useShop();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [animatedSearchText, setAnimatedSearchText] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const catalogRequested = useRef(false);

  // كتالوج البحث بيتحمّل أول ما المستخدم يركز على خانة البحث — مش مع فتح كل صفحة
  const ensureCatalog = useCallback(() => {
    if (catalogRequested.current) return;
    catalogRequested.current = true;
    fetch("/api/products?limit=500")
      .then((r) => r.json())
      .then((d) => {
        const products: Product[] = d?.data?.products ?? [];
        setCatalog(products);
      })
      .catch(() => {
        catalogRequested.current = false;
      });
  }, []);

  const navLinks = [
    { label: "الرئيسية", href: "/", active: pathname === "/" },
    { label: "كل الأكلات", href: "/menu", active: pathname === "/menu" },
    { label: "العروض", href: "/offers", active: pathname === "/offers" },
    { label: "التصنيفات", href: "/#categories", active: false },
    { label: "من نحن", href: "/about", active: pathname === "/about" },
    { label: "طلباتي", href: "/my-orders", active: pathname === "/my-orders" },
  ];

  // تصفية المنتجات لحظياً عند الكتابة
  const searchResults = useMemo(() => {
    const raw = searchQuery.trim();
    if (!raw) return [];

    const norm = normalizeArabic(raw);
    return catalog.filter((product) => {
      const nameNorm = normalizeArabic(product.name);
      const descNorm = product.description ? normalizeArabic(product.description) : "";
      const catNorm = normalizeArabic(CATEGORY_NAMES[product.category] || product.category);

      return nameNorm.includes(norm) || descNorm.includes(norm) || catNorm.includes(norm);
    });
  }, [searchQuery, catalog]);

  // إغلاق النتائج عند الضغط في أي مكان خارج شريط البحث
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // التعامل مع اختيار منتج من نتائج البحث اللحظي
  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setShowSearchResults(false);
    setSearchQuery("");
    setIsMobileMenuOpen(false);
  };

  // تقديم نموذج البحث للانتقال لصفحة المنيو مع فلترة الكلمة
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/menu?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchResults(false);
      setIsMobileMenuOpen(false);
    }
  };

  // مسح نص البحث
  const handleClearSearch = () => {
    setSearchQuery("");
    setShowSearchResults(false);
    inputRef.current?.focus();
  };

  useEffect(() => {
    if (searchQuery) return;

    const dishNames = ["بيتزا", "كريب", "برجر", "مكرونة", "مشروبات"];
    let dishIndex = 0;
    let charIndex = 0;
    let deleting = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const updatePlaceholder = () => {
      const dish = dishNames[dishIndex];

      if (!deleting) {
        charIndex += 1;
        setAnimatedSearchText(dish.slice(0, charIndex));

        if (charIndex === dish.length) {
          deleting = true;
          timeoutId = setTimeout(updatePlaceholder, 1200);
          return;
        }
      } else {
        charIndex -= 1;
        setAnimatedSearchText(dish.slice(0, charIndex));

        if (charIndex === 0) {
          deleting = false;
          dishIndex = (dishIndex + 1) % dishNames.length;
        }
      }

      timeoutId = setTimeout(updatePlaceholder, deleting ? 55 : 110);
    };

    timeoutId = setTimeout(() => {
      setAnimatedSearchText("");
      updatePlaceholder();
    }, 450);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return (
    <header className="sticky top-0 z-40 w-full bg-[var(--color-page-background)] backdrop-blur-md border-b border-[var(--color-primary-border)] transition-all">
      <div className="mx-auto flex h-16 sm:h-20 max-w-[1400px] items-center justify-between px-3 sm:px-6 lg:px-8 gap-2 sm:gap-4 lg:gap-6">
        {/* 1. الشعار (Logo) */}
        <Link
          href="/"
          className="shrink-0"
        >
          <Logo />
        </Link>

        {/* 2. روابط التنقل للشاشات الكبيرة (Desktop Nav) */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-7 shrink-0">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`relative text-sm font-semibold transition-colors duration-200 hover:text-[var(--color-text-secondary)] ${
                link.active ? "text-[var(--color-text-secondary)]" : "text-[var(--color-text-primary)]"
              }`}
            >
              {link.label}
              {link.active && (
                <span className="absolute -bottom-2 left-0 right-0 h-0.5 rounded-full bg-[var(--color-icon)]" />
              )}
            </Link>
          ))}
        </nav>

        {/* 3. شريط البحث اللحظي — في المنتصف بين اللوجو والقائمة في الموبايل، وبعد الروابط في الديسكتوب */}
        <div
          ref={searchRef}
          className="relative flex-1 min-w-0 max-w-md lg:max-w-xs xl:max-w-sm mx-1 sm:mx-2 lg:mx-0"
        >
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            {/* أيقونة البحث */}
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-icon)]">
              <Search className="h-4 w-4" />
            </span>

            {/* حقل الإدخال */}
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                ensureCatalog();
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => {
                ensureCatalog();
                if (searchQuery.trim().length > 0) {
                  setShowSearchResults(true);
                }
              }}
              placeholder={searchQuery ? "" : `ابحث عن ${animatedSearchText}`}
              className="w-full rounded-full bg-[var(--color-surface-elevated)] py-2 sm:py-2.5 pr-9 pl-8 text-xs sm:text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] border border-[var(--color-primary-border)] focus:border-[var(--color-icon)] focus:outline-none focus:ring-1 focus:ring-[var(--color-icon)]/30 transition-all"
            />

            {/* زر مسح البحث */}
            {searchQuery.length > 0 && (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="مسح البحث"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-page-background)] text-[var(--color-icon)] hover:bg-[var(--color-icon)] hover:text-white transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </form>

          {/* القائمة المنسدلة لنتائج البحث اللحظي */}
          {showSearchResults && searchQuery.trim().length > 0 && (
            <div className="fixed inset-x-3 top-[68px] sm:absolute sm:inset-auto sm:top-full sm:right-0 sm:mt-2.5 sm:w-[400px] lg:w-[430px] flex flex-col max-sm:max-h-[calc(100dvh-192px-env(safe-area-inset-bottom))] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2.5 shadow-[0_24px_60px_-20px_rgba(38,53,43,0.45)] overflow-hidden z-50 transition-all animate-in fade-in-50 zoom-in-95 duration-150">
              {/* قائمة الوجبات المطابقة */}
              {searchResults.length > 0 ? (
                <div className="max-h-[340px] sm:max-h-[380px] max-sm:max-h-none min-h-0 overflow-y-auto space-y-2.5 [scrollbar-width:thin]">
                  {searchResults.slice(0, 6).map((product) => {
                    const priceRange = getProductPriceRange(product);
                    return (
                    <div
                      key={product.id}
                      className="flex items-center gap-2.5 rounded-2xl border border-[#E9E6DB] bg-[var(--color-surface-elevated)] p-2.5 shadow-[0_8px_18px_-14px_rgba(38,53,43,0.45)]"
                    >
                      {/* صورة الوجبة + التفاصيل */}
                      <button
                        type="button"
                        onClick={() => handleProductClick(product)}
                        className="group flex flex-1 min-w-0 items-center gap-2.5 text-right"
                      >
                        <div className="relative h-[68px] w-[92px] shrink-0 overflow-hidden rounded-xl bg-[var(--color-page-background)]">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            sizes="92px"
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>

                        <div className="flex-1 min-w-0 py-0.5">
                          <h4 className="truncate text-[13px] sm:text-sm font-black text-[var(--color-text-primary)]">
                            {product.name}
                          </h4>
                          {product.description && (
                            <p className="mt-0.5 truncate text-[11px] leading-relaxed text-[var(--color-text-secondary)]">
                              {product.description}
                            </p>
                          )}
                          <div className="mt-1.5 flex items-baseline gap-2">
                            {priceRange.isRange && (
                              <span className="text-[10px] font-bold text-[var(--color-text-muted)]">من</span>
                            )}
                            <span className="text-[13px] font-black text-[var(--color-text-primary)]">
                              {formatPriceRange(priceRange)} ج.م
                            </span>
                            {priceRange.minOriginal && (
                              <span className="text-[10px] text-[var(--color-text-muted)] line-through">
                                {priceRange.minOriginal} ج.م
                              </span>
                            )}
                          </div>
                        </div>
                      </button>

                      {/* أزرار الطلب */}
                      <div className="flex shrink-0 flex-col items-start gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleProductClick(product)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary)] px-3 py-1.5 text-[11px] font-bold text-[var(--color-on-primary)] shadow-[0_6px_14px_-8px_rgba(94,112,84,0.9)] transition-all hover:bg-[var(--color-primary-hover)] active:scale-95"
                        >
                          <span>اطلب الوجبة</span>
                          <ShoppingCart className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              ) : (
                /* حالة عدم وجود نتائج */
                <div className="py-8 px-4 text-center space-y-2">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-elevated)] text-[var(--color-primary-border)]">
                    <Utensils className="h-6 w-6" />
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)]">
                    لم نجد أي وجبة تطابق &quot;{searchQuery}&quot;
                  </p>
                  <p className="text-[11px] text-[var(--color-text-secondary)]">
                    جرب البحث بكلمات أخرى مثل: بيتزا، كريب، برجر، باستا
                  </p>
                </div>
              )}

              {/* زر عرض كل النتائج في صفحة المنيو */}
              {searchResults.length > 0 && (
                <button
                  type="button"
                  onClick={handleSearchSubmit}
                  className="mt-2.5 flex w-full shrink-0 items-center justify-center gap-1.5 rounded-full bg-[var(--color-primary)] py-2.5 px-4 text-xs font-bold text-[var(--color-on-primary)] shadow-[0_8px_18px_-12px_rgba(94,112,84,0.95)] transition-all hover:bg-[var(--color-primary-hover)] active:scale-[0.99]"
                >
                  <span>عرض كل النتائج في صفحة المنيو ({searchResults.length})</span>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* 4. أيقونات الإجراءات (المفضلة والسلة للشاشات الكبيرة + زر القائمة للشاشات الصغيرة) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* أيقونة المنيو المصور — تظهر على الشاشات الكبيرة */}
          <button
            onClick={() => setIsMenuImageOpen(true)}
            aria-label="عرض صورة المنيو"
            className="group relative hidden lg:flex h-10 w-10 items-center justify-center active:scale-95 transition-transform"
          >
            <div className="relative flex h-full w-full items-center justify-center rounded-full bg-[var(--color-surface-elevated)] border border-[var(--color-primary-border)] overflow-hidden transition-all group-hover:border-[var(--color-icon)]">
              <span className="absolute inset-0 bg-[var(--color-icon)] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-full" aria-hidden="true" />
              <BookImage className="relative z-10 h-4 w-4 text-[var(--color-icon)] group-hover:!text-white transition-colors duration-200" />
            </div>
          </button>

          {/* أيقونة المفضلة — تظهر على الشاشات الكبيرة */}
          <button
            id="header-fav-btn"
            onClick={() => setIsFavoritesOpen(true)}
            aria-label="عرض المفضلة"
            className="group relative hidden lg:flex h-10 w-10 items-center justify-center active:scale-95 transition-transform"
          >
            <div className="relative flex h-full w-full items-center justify-center rounded-full bg-[var(--color-surface-elevated)] border border-[var(--color-primary-border)] overflow-hidden transition-all group-hover:border-[var(--color-icon)]">
              <span className="absolute inset-0 bg-[var(--color-icon)] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-full" aria-hidden="true" />
              <Heart className="relative z-10 h-4 w-4 text-[var(--color-icon)] group-hover:!text-white transition-colors duration-200" />
            </div>
            {favoritesCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-icon)] text-[10px] font-bold text-[var(--color-on-primary)] z-20 shadow-sm">
                {favoritesCount}
              </span>
            )}
          </button>

          {/* أيقونة سلة المشتريات — تظهر على الشاشات الكبيرة */}
          <button
            id="header-cart-btn"
            onClick={() => setIsCartOpen(true)}
            aria-label="عرض سلة التسوق"
            className="group relative hidden lg:flex h-10 w-10 items-center justify-center active:scale-95 transition-transform"
          >
            <div className="relative flex h-full w-full items-center justify-center rounded-full bg-[var(--color-surface-elevated)] border border-[var(--color-primary-border)] overflow-hidden transition-all group-hover:border-[var(--color-icon)]">
              <span className="absolute inset-0 bg-[var(--color-icon)] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-full" aria-hidden="true" />
              <ShoppingBag className="relative z-10 h-4 w-4 text-[var(--color-icon)] group-hover:!text-white transition-colors duration-200" />
            </div>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-bold text-[var(--color-on-primary)] shadow-sm z-20">
                {cartCount}
              </span>
            )}
          </button>

          {/* زر القائمة — يظهر على الموبايل والشاشات الصغيرة */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="فتح القائمة"
            className="group relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[var(--color-surface-elevated)] border border-[var(--color-primary-border)] overflow-hidden lg:hidden hover:border-[var(--color-icon)] active:scale-95"
          >
            <span
              className="absolute inset-0 bg-[var(--color-primary)] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-full"
              aria-hidden="true"
            />
            <span className="relative z-10 text-[var(--color-icon)] group-hover:!text-white transition-colors duration-200">
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </span>
          </button>
        </div>
      </div>

      {/* قائمة الموبايل المنسدلة (Mobile Menu) — روابط التنقل فقط بعد نقل البحث للهيدر */}
      {isMobileMenuOpen && (
        <div className="max-h-[calc(100dvh-7rem)] overflow-y-auto overscroll-contain border-t border-[var(--color-primary-border)] bg-[var(--color-page-background)] px-4 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] lg:hidden sm:pb-5 animate-in fade-in-50 slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-1.5">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
                  link.href === "/my-orders" ? "flex flex-col gap-2.5" : ""
                } ${
                  link.active
                    ? "bg-[var(--color-icon)]/10 text-[var(--color-text-secondary)] border border-[var(--color-icon)]/30"
                    : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface-elevated)] hover:text-[var(--color-text-secondary)]"
                }`}
              >
                <span>{link.label}</span>
                {link.href === "/my-orders" && (
                  <span className="relative aspect-[1200/630] w-full overflow-hidden rounded-xl border border-[var(--color-primary-border)] bg-[var(--color-surface-elevated)]">
                    <Image
                      src={SOCIAL_PREVIEW_IMAGE_URL}
                      alt="طيار توصيل ووجبات Rosemary من الساندوتشات والبيتزا والمكرونة والبطاطس والمشروبات"
                      fill
                      sizes="(max-width: 1024px) 90vw, 420px"
                      className="object-cover"
                    />
                  </span>
                )}
              </Link>
            ))}
            {/* صورة المنيو — بديل عن أيقونة الديسكتوب بعد حذفها من البار السفلي */}
            <button
              type="button"
              onClick={() => {
                setIsMenuImageOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="mt-1 flex items-center gap-2.5 rounded-xl border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 px-3.5 py-2.5 text-sm font-bold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/20"
            >
              <BookImage className="h-4 w-4" />
              صورة المنيو
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
