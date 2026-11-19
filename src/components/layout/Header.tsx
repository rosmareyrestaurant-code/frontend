"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import Logo from "@/components/common/Logo";
import { usePathname, useRouter } from "next/navigation";
import { Search, Heart, ShoppingBag, Menu, X, Utensils, ChevronLeft, BookImage } from "lucide-react";
import { useShop } from "@/context/ShopContext";
import { ALL_PRODUCTS } from "@/data/mockData";
import { useCatalogProducts } from "@/hooks/useCatalog";
import { Product } from "@/types";

const CATEGORY_NAMES: Record<string, string> = {
  pizza: "بيتزا",
  chicken: "كريب ودجاج",
  burger: "سندوتشات وبرجر",
  pasta: "مكرونات",
  drinks: "مشروبات",
};

/**
 * دالة تطبيع الحروف العربية لتحسين دقة البحث (مثال: أ / إ / آ -> ا ، ة -> ه)
 */
function normalizeArabic(text: string): string {
  return text
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\u064B-\u065F]/g, ""); // إزالة التشكيل
}

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
  const catalog = useCatalogProducts(ALL_PRODUCTS, true);

  const navLinks = [
    { label: "الرئيسية", href: "/", active: pathname === "/" },
    { label: "كل الأكلات", href: "/menu", active: pathname === "/menu" },
    { label: "العروض", href: "/offers", active: pathname === "/offers" },
    { label: "التصنيفات", href: "/#categories", active: false },
    { label: "من نحن", href: "/about", active: pathname === "/about" },
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
    <header className="sticky top-0 z-40 w-full bg-[#0e0d0c]/90 backdrop-blur-md border-b border-[#25201c] transition-all">
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
              className={`relative text-sm font-semibold transition-colors duration-200 hover:text-[#ff7a00] ${
                link.active ? "text-[#ff7a00]" : "text-[#d1cbc4]"
              }`}
            >
              {link.label}
              {link.active && (
                <span className="absolute -bottom-2 left-0 right-0 h-0.5 rounded-full bg-[#ff7a00]" />
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
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#857b72]">
              <Search className="h-4 w-4" />
            </span>

            {/* حقل الإدخال */}
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => {
                if (searchQuery.trim().length > 0) {
                  setShowSearchResults(true);
                }
              }}
              placeholder={searchQuery ? "" : `ابحث عن ${animatedSearchText}`}
              className="w-full rounded-full bg-[#1b1714] py-2 sm:py-2.5 pr-9 pl-8 text-xs sm:text-sm text-white placeholder-[#857b72] border border-[#2d2620] focus:border-[#ff7a00] focus:outline-none focus:ring-1 focus:ring-[#ff7a00] transition-all"
            />

            {/* زر مسح البحث */}
            {searchQuery.length > 0 && (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="مسح البحث"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-[#2d2620] text-[#a89f94] hover:bg-[#ff7a00] hover:text-white transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </form>

          {/* القائمة المنسدلة لنتائج البحث اللحظي */}
          {showSearchResults && searchQuery.trim().length > 0 && (
            <div className="fixed inset-x-3 top-[68px] sm:absolute sm:inset-auto sm:top-full sm:right-0 sm:mt-2.5 sm:w-[400px] lg:w-[420px] bg-[#14100e]/98 backdrop-blur-xl border border-[#2d241c] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)] overflow-hidden z-50 transition-all animate-in fade-in-50 zoom-in-95 duration-150">
              {/* شريط رأس القائمة */}
              <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#1b1511] border-b border-[#2d241c]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">نتائج البحث</span>
                  <span className="flex h-5 items-center justify-center rounded-full bg-[#ff7a00]/20 px-2 text-[10px] font-bold text-[#ff7a00]">
                    {searchResults.length} {searchResults.length === 1 ? "وجبة" : "وجبات"}
                  </span>
                </div>
                <span className="text-[11px] text-[#8e8479]">اضغط لاختيار الوجبة</span>
              </div>

              {/* قائمة الوجبات المطابقة */}
              {searchResults.length > 0 ? (
                <div className="max-h-[340px] sm:max-h-[380px] overflow-y-auto divide-y divide-[#241c16] [-ms-overflow-style:none] [scrollbar-width:thin] scrollbar-thin scrollbar-thumb-[#2d241c]">
                  {searchResults.slice(0, 6).map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleProductClick(product)}
                      className="group flex w-full items-center gap-3 p-3 text-right transition-colors hover:bg-[#201813] active:bg-[#271e18]"
                    >
                      {/* صورة الوجبة */}
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#0c0a09] border border-[#2e251e]">
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          sizes="56px"
                          className="object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      </div>

                      {/* تفاصيل الوجبة */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#ff7a00] transition-colors">
                            {product.name}
                          </h4>
                          {product.category && (
                            <span className="shrink-0 text-[10px] font-medium text-[#c4b5a5] bg-[#221b16] px-1.5 py-0.5 rounded border border-[#32271f]">
                              {CATEGORY_NAMES[product.category] || product.category}
                            </span>
                          )}
                        </div>

                        {product.description && (
                          <p className="mt-0.5 text-[11px] text-[#8e8479] truncate">
                            {product.description}
                          </p>
                        )}

                        <div className="mt-1 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-extrabold text-[#ff7a00]">
                              {product.price} ج.م
                            </span>
                            {product.originalPrice && (
                              <span className="text-[10px] text-[#6e6358] line-through">
                                {product.originalPrice} ج.م
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-semibold text-[#ff7a00] flex items-center gap-0.5 opacity-90 group-hover:translate-x-[-2px] transition-transform">
                            طلب الوجبة
                            <ChevronLeft className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                /* حالة عدم وجود نتائج */
                <div className="py-8 px-4 text-center space-y-2">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#1e1713] text-[#ff7a00]/70 border border-[#2d241c]">
                    <Utensils className="h-6 w-6" />
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-white">
                    لم نجد أي وجبة تطابق &quot;{searchQuery}&quot;
                  </p>
                  <p className="text-[11px] text-[#8e8479]">
                    جرب البحث بكلمات أخرى مثل: بيتزا، كريب، برجر، باستا
                  </p>
                </div>
              )}

              {/* زر عرض كل النتائج في صفحة المنيو */}
              {searchResults.length > 0 && (
                <button
                  type="button"
                  onClick={handleSearchSubmit}
                  className="flex w-full items-center justify-center gap-1.5 bg-[#1b1511] py-2.5 px-4 text-xs font-bold text-[#ff7a00] transition-colors hover:bg-[#ff7a00] hover:text-white border-t border-[#2d241c]"
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
            <div className="relative flex h-full w-full items-center justify-center rounded-full bg-[#1b1714] border border-[#2d2620] overflow-hidden transition-all group-hover:border-[#ff7a00]/60">
              <span
                className="absolute inset-0 bg-[#ff7a00] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-full"
                aria-hidden="true"
              />
              <BookImage className="relative z-10 h-4 w-4 text-[#d1cbc4] group-hover:text-white transition-colors duration-200" />
            </div>
          </button>

          {/* أيقونة المفضلة — تظهر على الشاشات الكبيرة */}
          <button
            id="header-fav-btn"
            onClick={() => setIsFavoritesOpen(true)}
            aria-label="عرض المفضلة"
            className="group relative hidden lg:flex h-10 w-10 items-center justify-center active:scale-95 transition-transform"
          >
            <div className="relative flex h-full w-full items-center justify-center rounded-full bg-[#1b1714] border border-[#2d2620] overflow-hidden transition-all group-hover:border-[#ff7a00]/60">
              <span
                className="absolute inset-0 bg-[#ff7a00] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-full"
                aria-hidden="true"
              />
              <Heart className="relative z-10 h-4 w-4 text-[#d1cbc4] group-hover:text-white transition-colors duration-200" />
            </div>
            {favoritesCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#ff3b30] text-[10px] font-bold text-white z-20 shadow-sm">
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
            <div className="relative flex h-full w-full items-center justify-center rounded-full bg-[#1b1714] border border-[#2d2620] overflow-hidden transition-all group-hover:border-[#ff7a00]/60">
              <span
                className="absolute inset-0 bg-[#ff7a00] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-full"
                aria-hidden="true"
              />
              <ShoppingBag className="relative z-10 h-4 w-4 text-[#d1cbc4] group-hover:text-white transition-colors duration-200" />
            </div>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#ff7a00] text-[10px] font-bold text-white shadow-sm z-20">
                {cartCount}
              </span>
            )}
          </button>

          {/* زر القائمة — يظهر على الموبايل والشاشات الصغيرة */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="فتح القائمة"
            className="group relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[#1b1714] border border-[#2d2620] overflow-hidden lg:hidden hover:border-[#ff7a00]/60 active:scale-95"
          >
            <span
              className="absolute inset-0 bg-[#ff7a00] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-full"
              aria-hidden="true"
            />
            <span className="relative z-10 text-white">
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </span>
          </button>
        </div>
      </div>

      {/* قائمة الموبايل المنسدلة (Mobile Menu) — روابط التنقل فقط بعد نقل البحث للهيدر */}
      {isMobileMenuOpen && (
        <div className="border-t border-[#25201c] bg-[#120f0d] px-4 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom))] lg:hidden sm:pb-5 animate-in fade-in-50 slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-1.5">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
                  link.active
                    ? "bg-[#ff7a00]/15 text-[#ff7a00] border border-[#ff7a00]/30"
                    : "text-[#d1cbc4] hover:bg-[#1b1714] hover:text-[#ff7a00]"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
