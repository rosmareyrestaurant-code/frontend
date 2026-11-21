"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, Star, Sparkles } from "lucide-react";
import { EmptyState } from "@/components/admin/shared/EmptyState";
import { useToast } from "@/components/admin/shared/Toast";
import type { AdminProduct } from "@/types/admin";

export default function PopularProductsPage() {
  const { showToast } = useToast();
  const router = useRouter();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<{ slug: string; nameAr: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"popular" | "all">("popular");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const all: AdminProduct[] = [];
      let pageNo = 1;
      let pages = 1;
      do {
        const res = await fetch(`/api/admin/products?page=${pageNo}&limit=100`);
        const d = await res.json();
        if (!d.success) break;
        all.push(...d.data.products);
        pages = d.data.pagination.pages;
        pageNo++;
      } while (pageNo <= pages);
      setProducts(all);
    } catch {
      showToast("خطأ في تحميل المنتجات", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchProducts();
    });
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCategories(d.data);
      })
      .catch(() => {});
  }, [fetchProducts]);

  const catName = (slug: string) =>
    categories.find((c) => c.slug === slug)?.nameAr ?? slug;

  const popular = useMemo(() => products.filter((p) => p.isFeatured), [products]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = tab === "popular" ? popular : products;
    return base.filter(
      (p) => !q || p.name.toLowerCase().includes(q) || (p.nameEn ?? "").toLowerCase().includes(q),
    );
  }, [products, popular, search, tab]);

  const toggleFeatured = async (id: string, turnOn: boolean) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: turnOn }),
      });
      const d = await res.json();
      if (d.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, isFeatured: turnOn } : p)),
        );
        showToast(
          turnOn
            ? "تمت إضافة المنتج إلى «الأكثر طلباً» في الصفحة الرئيسية"
            : "تمت إزالة المنتج من «الأكثر طلباً»",
          "success",
        );
      } else {
        showToast(d.error?.message ?? "فشل التحديث", "error");
      }
    } catch {
      showToast("خطأ في الاتصال", "error");
    }
  };

  return (
    <div className="space-y-5">
      {/* شرح النظام */}
      <div className="flex items-start gap-3 rounded-2xl border border-[#ff7a00]/20 bg-[#ff7a00]/[0.06] px-4 py-3.5">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#ff7a00]" />
        <p className="text-xs leading-relaxed text-[#c4b9ad]">
          المنتجات المميزة هنا هي اللي بتظهر في سكشن «الأكثر طلباً» في الصفحة الرئيسية،
          وأي تعديل بيتحدّث فوراً على الموقع.
        </p>
      </div>

      {/* القائمة */}
      <div className="overflow-hidden rounded-2xl border border-[#26201a] bg-[#F2F2ED]">
        <div className="flex flex-col gap-3 border-b border-[#231d17] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-bold text-white">قائمة المنتجات الأكثر طلباً</h2>
            <p className="mt-1 text-[11px] text-[#8a8076]">أضف أو استبعد المنتجات وستظهر فوراً على الموقع</p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex rounded-xl border border-[#2a231d] bg-[#F2F2ED] p-1">
              {([
                ["popular", `الأكثر طلباً (${popular.length})`],
                ["all", `كل المنتجات (${products.length})`],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                    tab === key ? "bg-[#ff7a00] text-white" : "text-[#a89f94] hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5a4f45]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ابحث عن منتج..."
                className="w-full rounded-xl border border-[#2a241f] bg-[#F2F2ED] py-2.5 pr-9 pl-4 text-sm text-white placeholder-[#5a4f45] focus:border-[#ff7a00] focus:outline-none sm:w-56"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-[13px] text-[#9A9C90] animate-pulse">جاري التحميل...</div>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Star}
            title={tab === "popular" ? "لا توجد منتجات في القائمة" : "لا توجد منتجات مطابقة"}
            description={
              tab === "popular"
                ? "أضف منتجاً من تبويب «كل المنتجات» ليظهر في الصفحة الرئيسية."
                : "جرّب كلمة بحث أخرى."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-right text-sm">
              <thead>
                <tr className="border-b border-[#1e1914] text-[11px] text-[#5a4f45]">
                  <th className="px-5 py-3 font-bold">المنتج</th>
                  <th className="px-4 py-3 font-bold">التصنيف</th>
                  <th className="px-4 py-3 font-bold">الحالة</th>
                  <th className="px-5 py-3 font-bold">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1612]">
                {rows.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => router.push(`/dashboard/products?edit=${p.id}`)}
                    tabIndex={0} role="button" aria-label={`تعديل ${p.name}`}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); router.push(`/dashboard/products?edit=${p.id}`); } }}
                    className={`cursor-pointer transition-colors hover:bg-[#F2F2ED] focus-visible:bg-[#F2F2ED] focus-visible:outline-none ${p.isFeatured ? "bg-[#ff7a00]/[0.025]" : ""}`}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-[#2a231d] bg-[#F2F2ED]">
                          <Image
                            src={p.image || "/images/logo-rosemary-green.png"}
                            alt={p.name}
                            fill
                            sizes="44px"
                            className="object-cover"
                            unoptimized={p.image.startsWith("data:") || !p.image}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-bold text-white">{p.name}</p>
                          <p className="text-[11px] text-[#8a8076]">{p.price} ج.م</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#a89f94]">{catName(p.category)}</td>
                    <td className="px-4 py-3">
                      {p.isFeatured ? (
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#ff7a00]/30 bg-[#ff7a00]/15 px-3 py-1.5 text-[11px] font-bold text-[#ff9a3d]">
                          <Star className="h-3.5 w-3.5 fill-current" /> ظاهر في الرئيسية
                        </span>
                      ) : (
                        <span className="text-[11px] text-[#5a4f45]">غير مميز</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {p.isFeatured ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleFeatured(p.id, false); }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#ff7a00]/30 bg-[#ff7a00]/15 px-3 py-1.5 text-[11px] font-bold text-[#ff9a3d] transition-colors hover:bg-[#ff7a00]/25"
                        >
                          <Star className="h-3.5 w-3.5 fill-current" /> إزالة
                        </button>
                      ) : (
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleFeatured(p.id, true); }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#2f2720] bg-[#F2F2ED] px-3 py-1.5 text-[11px] font-bold text-[#a89f94] transition-colors hover:border-[#ff7a00]/40 hover:text-[#ff9a3d]"
                        >
                          <Star className="h-3.5 w-3.5" /> إضافة للأكثر طلباً
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
