"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Search, Star, TrendingUp, Sparkles,
} from "lucide-react";
import { EmptyState } from "@/components/admin/shared/EmptyState";
import { useToast } from "@/components/admin/shared/Toast";
import { MOCK_ADMIN_CATEGORIES } from "@/data/admin/categories";
import { ALL_PRODUCTS } from "@/data/mockData";
import {
  CATALOG_EVENT, CATALOG_KEY, readCatalog, writeCatalog,
} from "@/hooks/useCatalog";
import {
  POPULAR_THRESHOLD, usePopularEntries,
} from "@/hooks/usePopularProducts";
import { AdminProduct } from "@/types/admin";

const catName = (slug: string) =>
  MOCK_ADMIN_CATEGORIES.find((c) => c.slug === slug)?.nameAr ??
  (slug === "desserts" ? "حلويات" : slug === "extras" ? "إضافات روزماري" : slug);

export default function PopularProductsPage() {
  const { showToast } = useToast();
  const entries = usePopularEntries();
  const [catalog, setCatalog] = useState<AdminProduct[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"popular" | "all">("popular");

  useEffect(() => {
    const load = () => setCatalog(readCatalog());
    const onCustom = () => load();
    const onStorage = (e: StorageEvent) => {
      if (e.key === CATALOG_KEY) load();
    };
    queueMicrotask(load);
    window.addEventListener(CATALOG_EVENT, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CATALOG_EVENT, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const popularCount = entries.filter((e) => e.isPopular).length;

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries
      .filter((e) => (tab === "popular" ? e.isPopular : true))
      .filter((e) => !q || e.product.name.toLowerCase().includes(q))
      .sort((a, b) => {
        if (a.isPopular !== b.isPopular) return a.isPopular ? -1 : 1;
        return b.weeklyOrders - a.weeklyOrders;
      });
  }, [entries, search, tab]);

  const isManualOn = (id: string) => !!catalog.find((p) => p.id === id)?.isFeatured;

  const toggleManual = (id: string, turnOn: boolean) => {
    const entry = entries.find((e) => e.product.id === id);
    if (entry?.auto) {
      showToast("هذا المنتج تجاوز 50 طلباً خلال الأسبوع ويُضاف تلقائياً", "warning");
      return;
    }

    const existing = catalog.find((p) => p.id === id);
    let next: AdminProduct[];

    if (existing) {
      next = catalog.map((p) =>
        p.id === id ? { ...p, isFeatured: turnOn } : p,
      );
    } else if (turnOn) {
      const base = ALL_PRODUCTS.find((p) => p.id === id);
      if (!base) {
        showToast("تعذّر العثور على المنتج", "error");
        return;
      }
      next = [
        {
          id: base.id,
          name: base.name,
          description: base.description ?? "",
          image: base.image,
          category: base.category,
          price: base.price,
          originalPrice: base.originalPrice,
          sizes: base.sizes?.map((s) => ({ ...s })),
          isAvailable: true,
          isVisible: true,
          isFeatured: true,
          createdAt: new Date().toISOString(),
        },
        ...catalog,
      ];
    } else {
      showToast("المنتج مش مضاف يدوياً أصلاً", "warning");
      return;
    }

    writeCatalog(next);
    showToast(
      turnOn
        ? "تمت إضافة المنتج إلى «الأكثر طلباً» في الصفحة الرئيسية"
        : "تمت إزالة المنتج من «الأكثر طلباً»",
      "success",
    );
  };

  return (
    <div className="space-y-5">
      {/* شرح النظام */}
      <div className="flex items-start gap-3 rounded-2xl border border-[#ff7a00]/20 bg-[#ff7a00]/[0.06] px-4 py-3.5">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#ff7a00]" />
        <p className="text-xs leading-relaxed text-[#c4b9ad]">
          المنتج بيظهر في سكشن «الأكثر طلباً» في الصفحة الرئيسية لو الأدمن ضافه يدوياً،
          أو لو اطلب <span className="font-black text-[#ff9a3d]">{POPULAR_THRESHOLD} مرة أو أكتر خلال آخر 7 أيام</span> —
          في الحالة دي بيتضاف تلقائياً ومفيش داعي تضيفه بنفسك. التحديث بيحصل فوراً في الموقع.
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
                ["popular", `الأكثر طلباً (${popularCount})`],
                ["all", `كل المنتجات (${entries.length})`],
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

        {rows.length === 0 ? (
          <EmptyState
            icon={Star}
            title={tab === "popular" ? "لا توجد منتجات في القائمة" : "لا توجد منتجات مطابقة"}
            description={
              tab === "popular"
                ? "أضف منتجاً يدوياً أو انتظر حتى يصل إلى 50 طلباً خلال الأسبوع."
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
                  <th className="px-4 py-3 font-bold">طلبات آخر 7 أيام</th>
                  <th className="px-5 py-3 font-bold">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a1612]">
                {rows.map((entry) => {
                  const p = entry.product;
                  const adminFeatured = isManualOn(p.id);
                  const progress = Math.min(100, Math.round((entry.weeklyOrders / POPULAR_THRESHOLD) * 100));

                  return (
                    <tr key={p.id} className={`transition-colors hover:bg-[#F2F2ED] ${entry.isPopular ? "bg-[#ff7a00]/[0.025]" : ""}`}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-[#2a231d] bg-[#F2F2ED]">
                            <Image src={p.image} alt={p.name} fill sizes="44px" className="object-cover" unoptimized={p.image.startsWith("data:")} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-bold text-white">{p.name}</p>
                            <p className="text-[11px] text-[#8a8076]">{p.price} ج.م</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-[#a89f94]">{catName(p.category)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`w-9 text-left text-xs font-black ${entry.auto ? "text-emerald-400" : "text-white"}`}>
                            {entry.weeklyOrders}
                          </span>
                          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[#F2F2ED]">
                            <div
                              className={`h-full rounded-full ${entry.auto ? "bg-emerald-400" : "bg-[#ff7a00]"}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-[#5a4f45]">/ {POPULAR_THRESHOLD}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {entry.auto ? (
                          <span
                            title="تمت إضافته تلقائياً لتجاوزه 50 طلباً خلال الأسبوع"
                            className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold text-emerald-400 opacity-80"
                          >
                            <TrendingUp className="h-3.5 w-3.5" /> تلقائي
                          </span>
                        ) : adminFeatured || entry.manual ? (
                          <button
                            onClick={() => toggleManual(p.id, false)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#ff7a00]/30 bg-[#ff7a00]/15 px-3 py-1.5 text-[11px] font-bold text-[#ff9a3d] transition-colors hover:bg-[#ff7a00]/25"
                          >
                            <Star className="h-3.5 w-3.5 fill-current" /> إزالة
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleManual(p.id, true)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#2f2720] bg-[#F2F2ED] px-3 py-1.5 text-[11px] font-bold text-[#a89f94] transition-colors hover:border-[#ff7a00]/40 hover:text-[#ff9a3d]"
                          >
                            <Star className="h-3.5 w-3.5" /> إضافة للأكثر طلباً
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
