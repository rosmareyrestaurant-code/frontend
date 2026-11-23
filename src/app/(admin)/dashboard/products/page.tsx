"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import {
  Search, Plus, Pencil, Trash2, Package, ChevronDown, X, Star,
  Upload, Download, Layers, Loader2,
} from "lucide-react";
import { AvailabilityBadge, VisibilityBadge } from "@/components/admin/shared/StatusBadge";
import { Modal } from "@/components/admin/shared/Modal";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { EmptyState } from "@/components/admin/shared/EmptyState";
import { Pagination } from "@/components/admin/shared/Pagination";
import ImageUpload from "@/components/admin/shared/ImageUpload";
import { useToast } from "@/components/admin/shared/Toast";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { exportMenuToExcel, parseMenuWorkbook } from "@/lib/productExcel";
import type { AdminProduct, AdminProductSize } from "@/types/admin";

// Mock data — مفعّلة مؤقتاً للتيست (رجّع تعليقها وشغّل الـ API بعد الانتهاء)
import { MOCK_ADMIN_CATEGORIES } from "@/data/admin/categories";
import { MOCK_ADMIN_PRODUCTS } from "@/data/admin/products";

const USE_MOCK = false; // الموك معطّل — الواجهة متصلة بالـ API

const PER_PAGE = 8;
type ProductForm = Omit<AdminProduct, "id" | "createdAt"> & { imagePublicId?: string };

const EMPTY_FORM: ProductForm = {
  name: "", description: "", image: "", imagePublicId: "", category: "pizza",
  price: 0, originalPrice: undefined, sizes: [], addons: [],
  isAvailable: true, isVisible: true, isFeatured: false,
};
const newSize = (): AdminProductSize => ({
  id: `size-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
  name: "", price: 0, isDefault: false,
});

export default function ProductsPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [categories, setCategories] = useState<{ slug: string; nameAr: string }[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [catFilter, setCatFilter] = useState("all");
  const [availFilter, setAvailFilter] = useState<"all" | "true" | "false">("all");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<AdminProduct | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [pendingImport, setPendingImport] = useState<AdminProduct[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const loadedOnce = useRef(false);

  const fetchProducts = useCallback(async () => {
    if (USE_MOCK) {
      const q = debouncedSearch.trim();
      const filtered = MOCK_ADMIN_PRODUCTS.filter((p) =>
        (catFilter === "all" || p.category === catFilter) &&
        (availFilter === "all" || String(p.isAvailable) === availFilter) &&
        (!q || p.name.includes(q))
      );
      setProducts(filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE));
      setTotal(filtered.length);
      setLoading(false);
      loadedOnce.current = true;
      return;
    }
    // التحميل الكامل يظهر أول مرة بس — بعد كده بنحدّث بهدوء من غير ما الجدول يختفي
    if (loadedOnce.current) setRefreshing(true);
    else setLoading(true);
    try {
      const sp = new URLSearchParams({ page: String(page), limit: String(PER_PAGE) });
      if (debouncedSearch) sp.set("q", debouncedSearch);
      if (catFilter !== "all") sp.set("category", catFilter);
      if (availFilter !== "all") sp.set("isAvailable", availFilter);
      const res = await fetch(`/api/admin/products?${sp}`);
      const d = await res.json();
      if (d.success) { setProducts(d.data.products); setTotal(d.data.pagination.total); }
      else showToast(d.error?.message ?? "فشل التحميل", "error");
    } catch { showToast("خطأ في الاتصال", "error"); }
    finally { loadedOnce.current = true; setLoading(false); setRefreshing(false); }
  }, [page, debouncedSearch, catFilter, availFilter, showToast]);

  useEffect(() => { queueMicrotask(() => { void fetchProducts(); }); }, [fetchProducts]);

  useEffect(() => {
    if (USE_MOCK) return;
    fetch("/api/admin/categories?limit=50").then(r => r.json()).then(d => {
      if (d.success) setCategories(d.data.map((c: { slug: string; nameAr: string }) => ({ slug: c.slug, nameAr: c.nameAr })));
    }).catch(() => {});
  }, []);

  const totalPages = Math.ceil(total / PER_PAGE);
  const catName = (slug: string) => categories.find(c => c.slug === slug)?.nameAr ?? slug;

  const openAdd = () => { setEditProduct(null); setForm({ ...EMPTY_FORM, sizes: [] }); setModalOpen(true); };
  const openEdit = (p: AdminProduct) => {
    setEditProduct(p);
    setForm({ name: p.name, description: p.description, image: p.image,
      imagePublicId: (p as AdminProduct & { imagePublicId?: string }).imagePublicId ?? "",
      category: p.category,
      price: p.price, originalPrice: p.originalPrice, sizes: (p.sizes ?? []).map(s => ({ ...s })),
      addons: (p.addons ?? []).map(a => ({ ...a })),
      nameEn: p.nameEn, categoryNameAr: p.categoryNameAr, categoryNameEn: p.categoryNameEn,
      descriptionEn: p.descriptionEn, notes: p.notes, menuOrder: p.menuOrder,
      isAvailable: p.isAvailable, isVisible: p.isVisible, isFeatured: p.isFeatured,
    });
    setModalOpen(true);
  };

  // فتح منتج مباشرةً من أي جدول تاني عبر /dashboard/products?edit=<id>
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("edit");
    if (!id) return;
    window.history.replaceState(null, "", "/dashboard/products");
    fetch(`/api/admin/products/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.data) openEdit(d.data as AdminProduct);
        else showToast(d.error?.message ?? "مش قادر أفتح المنتج", "error");
      })
      .catch(() => showToast("خطأ في الاتصال", "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveProduct = async () => {
    if (!form.name.trim()) { showToast("اسم المنتج مطلوب", "error"); return; }
    const sizes = (form.sizes ?? []).filter(s => s.name.trim() && s.price > 0);
    const price = sizes.find(s => s.isDefault)?.price ?? sizes[0]?.price ?? form.price;
    if (!price) { showToast("لازم تدخل سعر", "error"); return; }
    if (USE_MOCK) {
      if (editProduct) {
        setProducts((prev) => prev.map((p) => p.id === editProduct.id ? { ...p, ...form, price, sizes: sizes.length ? sizes : p.sizes } : p));
        showToast("تم تحديث المنتج", "success");
      } else {
        setProducts((prev) => [{ ...(form as AdminProduct), id: `prd-${Date.now()}`, price, sizes: sizes.length ? sizes : undefined, createdAt: new Date().toISOString() }, ...prev]);
        setTotal((t) => t + 1);
        showToast("تمت إضافة المنتج", "success");
      }
      setModalOpen(false);
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, price, sizes: sizes.length ? sizes : undefined };
      const url = editProduct ? `/api/admin/products/${editProduct.id}` : "/api/admin/products";
      const method = editProduct ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await res.json();
      if (d.success) {
        const saved = d.data as AdminProduct;
        showToast(editProduct ? "تم تحديث المنتج" : "تمت إضافة المنتج", "success");
        setModalOpen(false);
        // بنحدّث الصف في مكانه بدل ما نعيد تحميل الجدول كله
        if (editProduct) {
          setProducts((prev) => prev.map((p) => (p.id === saved.id ? saved : p)));
        } else {
          setProducts((prev) => [saved, ...prev].slice(0, PER_PAGE));
          setTotal((t) => t + 1);
        }
      } else { showToast(d.error?.message ?? "فشل الحفظ", "error"); }
    } catch { showToast("خطأ في الاتصال", "error"); }
    finally { setSaving(false); }
  };

  const deleteProduct = async (id: string) => {
    if (USE_MOCK) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setTotal((t) => Math.max(0, t - 1));
      showToast("تم حذف المنتج", "warning");
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      const d = await res.json();
      if (d.success) {
        const wasLastOnPage = products.length === 1 && page > 1;
        setProducts((prev) => prev.filter((p) => p.id !== id));
        setTotal((t) => Math.max(0, t - 1));
        showToast("تم حذف المنتج", "warning");
        if (wasLastOnPage) setPage((p) => p - 1);
        else if (page === 1) void fetchProducts();
      } else showToast(d.error?.message ?? "فشل الحذف", "error");
    } catch { showToast("خطأ في الاتصال", "error"); }
    finally { setDeletingId(null); }
  };

  const toggleAvail = async (id: string, current: boolean) => {
    if (USE_MOCK) {
      setProducts((prev) => prev.map((p) => p.id === id ? { ...p, isAvailable: !current } : p));
      showToast("تم تحديث التوفر", "success");
      return;
    }
    // تحديث فوري في الواجهة، ولو الطلب فشل نرجّع الحالة زي ما كانت
    setProducts((prev) => prev.map((p) => p.id === id ? { ...p, isAvailable: !current } : p));
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "PATCH",
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isAvailable: !current }) });
      const d = await res.json();
      if (d.success) showToast("تم تحديث التوفر", "success");
      else {
        setProducts((prev) => prev.map((p) => p.id === id ? { ...p, isAvailable: current } : p));
        showToast(d.error?.message ?? "فشل تحديث التوفر", "error");
      }
    } catch {
      setProducts((prev) => prev.map((p) => p.id === id ? { ...p, isAvailable: current } : p));
      showToast("خطأ", "error");
    }
  };

  const updateSize = (index: number, patch: Partial<AdminProductSize>) =>
    setForm(p => {
      const sizes = (p.sizes ?? []).map((s, i) => (i === index ? { ...s, ...patch } : s));
      const defIndex = sizes.findIndex(s => s.isDefault);
      const isDefaultSize = (defIndex === -1 ? 0 : defIndex) === index;
      return {
        ...p,
        sizes,
        price: isDefaultSize && patch.price !== undefined ? patch.price : p.price,
      };
    });
  const makeDefaultSize = (index: number) =>
    setForm(p => ({
      ...p,
      price: (p.sizes ?? [])[index]?.price ?? p.price,
      sizes: (p.sizes ?? []).map((s, i) => ({ ...s, isDefault: i === index })),
    }));

  const handleExcel = async (file?: File) => {
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      setPendingImport(parseMenuWorkbook(data));
    } catch (err) {
      showToast(err instanceof Error ? err.message : "تعذّر قراءة الملف", "error");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const confirmImport = async () => {
    if (!pendingImport) return;
    if (USE_MOCK) {
      const existingNames = new Set(MOCK_ADMIN_PRODUCTS.map((m) => m.name.trim()));
      const added = pendingImport.filter((p) => !existingNames.has(p.name.trim())).length;
      const updated = pendingImport.length - added;
      setProducts((prev) => {
        const next = [...prev];
        pendingImport.forEach((p, i) => {
          const idx = next.findIndex((m) => m.name.trim() === p.name.trim());
          if (idx >= 0) next[idx] = { ...next[idx], ...p, id: next[idx].id };
          else next.unshift({ ...p, id: `prd-import-${Date.now()}-${i}`, createdAt: new Date().toISOString() });
        });
        return next;
      });
      setTotal((t) => t + added);
      showToast(`تم إضافة ${added} وتحديث ${updated} منتج`, "success");
      setPendingImport(null);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: pendingImport }),
      });
      const d = await res.json();
      if (d.success) showToast(`تم إضافة ${d.data.added} وتحديث ${d.data.updated} منتج`, "success");
      else showToast(d.error?.message ?? "فشل الاستيراد", "error");
    } catch {
      showToast("خطأ في الاتصال أثناء الاستيراد", "error");
    }
    setPendingImport(null);
    fetchProducts();
    setSaving(false);
  };

  const handleExport = async () => {
    if (USE_MOCK) {
      const q = search.trim();
      const all = MOCK_ADMIN_PRODUCTS.filter((p) =>
        (catFilter === "all" || p.category === catFilter) &&
        (availFilter === "all" || String(p.isAvailable) === availFilter) &&
        (!q || p.name.includes(q))
      );
      exportMenuToExcel(all);
      showToast(`تم تنزيل ${all.length} منتج`, "success");
      return;
    }
    try {
      const all: AdminProduct[] = [];
      let pageNo = 1;
      let pages = 1;
      do {
        const sp = new URLSearchParams({ page: String(pageNo), limit: "100" });
        if (search) sp.set("q", search);
        if (catFilter !== "all") sp.set("category", catFilter);
        if (availFilter !== "all") sp.set("isAvailable", availFilter);
        const res = await fetch(`/api/admin/products?${sp}`);
        const d = await res.json();
        if (!d.success) break;
        all.push(...d.data.products);
        pages = d.data.pagination.pages;
        pageNo++;
      } while (pageNo <= pages);
      exportMenuToExcel(all);
      showToast(`تم تنزيل ${all.length} منتج`, "success");
    } catch {
      showToast("تعذّر تجهيز ملف الإكسيل", "error");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="ابحث باسم المنتج..."
              className="w-full rounded-full border border-[var(--color-control-border)] bg-[var(--color-surface)] py-2.5 pe-4 ps-10 text-[13px] text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] transition-colors focus:border-[var(--color-primary-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-border)]/20" />
            {search && <button onClick={() => setSearch("")} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary)]" aria-label="مسح البحث"><X className="h-3.5 w-3.5" /></button>}
          </div>
          <div className="relative">
            <select value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(1); }}
              className="w-full min-w-[150px] appearance-none rounded-full border border-[var(--color-control-border)] bg-[var(--color-surface)] py-2.5 pe-4 ps-9 text-[13px] font-semibold text-[var(--color-text-primary)] focus:border-[var(--color-primary-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-border)]/20">
              <option value="all">كل التصنيفات</option>
              {categories.map(c => <option key={c.slug} value={c.slug}>{c.nameAr}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-muted)]" />
          </div>
          <div className="relative">
            <select value={availFilter} onChange={e => { setAvailFilter(e.target.value as "all" | "true" | "false"); setPage(1); }}
              className="w-full min-w-[140px] appearance-none rounded-full border border-[var(--color-control-border)] bg-[var(--color-surface)] py-2.5 pe-4 ps-9 text-[13px] font-semibold text-[var(--color-text-primary)] focus:border-[var(--color-primary-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-border)]/20">
              <option value="all">كل الحالات</option>
              <option value="true">متاح</option>
              <option value="false">غير متاح</option>
            </select>
            <ChevronDown className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--color-text-muted)]" />
          </div>
          <button onClick={openAdd} className="flex shrink-0 items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-[13px] font-bold text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-primary-hover)]">
            <Plus className="h-4 w-4" /> إضافة منتج
          </button>
        </div>
        {/* Excel import/export */}
        <div className="flex flex-wrap items-center gap-2 rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5">
          <span className="min-w-[180px] flex-1 text-[11px] font-semibold text-[var(--color-text-muted)]">استيراد / تصدير المنتجات من ملف الإكسيل</span>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={e => handleExcel(e.target.files?.[0])} />
          <button onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 rounded-full border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] px-3.5 py-1.5 text-[11px] font-bold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary-soft)]">
            <Upload className="h-3.5 w-3.5" /> استيراد إكسيل
          </button>
          <button onClick={handleExport}
            className="flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-3.5 py-1.5 text-[11px] font-bold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-surface-hover)]">
            <Download className="h-3.5 w-3.5" /> تصدير إكسيل
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="px-5 pb-3 pt-4">
          <h2 className="flex items-center gap-2 text-[15px] font-black text-[var(--color-text-primary)]">
            المنتجات <span className="text-[12px] font-bold text-[var(--color-text-muted)]">({total})</span>
            {refreshing && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--color-text-muted)]">
                <Loader2 className="h-3 w-3 animate-spin" /> تحديث
              </span>
            )}
          </h2>
        </div>
        {loading ? (
          <div className="py-12 text-center text-[13px] text-[var(--color-text-muted)] animate-pulse">جاري التحميل...</div>
        ) : products.length === 0 ? (
          <EmptyState icon={Package} title="لا توجد منتجات" action={<button onClick={openAdd} className="rounded-full bg-[var(--color-primary)] px-4 py-2 text-[12px] font-bold text-[var(--color-on-primary)]">إضافة منتج</button>} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[750px] text-right">
                <thead>
                  <tr className="bg-[var(--color-surface-secondary)] text-[11px] font-bold text-[var(--color-text-muted)]">
                    <th className="px-5 py-2.5 font-bold">المنتج</th>
                    <th className="px-5 py-2.5 font-bold">التصنيف</th>
                    <th className="px-5 py-2.5 font-bold">السعر</th>
                    <th className="px-5 py-2.5 font-bold">التوفر</th>
                    <th className="px-5 py-2.5 font-bold">الظهور</th>
                    <th className="px-5 py-2.5 font-bold">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-subtle)]">
                  {products.map(p => (
                    <tr key={p.id} onClick={() => openEdit(p)}
                      tabIndex={0} role="button" aria-label={`تعديل ${p.name}`}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openEdit(p); } }}
                      className="cursor-pointer text-[12px] transition-colors hover:bg-[var(--color-surface-soft)] focus-visible:bg-[var(--color-surface-soft)] focus-visible:outline-none">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[10px] border border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
                            {p.image ? <Image src={p.image} alt={p.name} fill className="object-cover" sizes="44px" unoptimized={p.image.startsWith("data:")} />
                              : <Package className="m-auto h-5 w-5 text-[var(--color-text-muted)]" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-[13px] font-bold text-[var(--color-text-primary)]">{p.name}</p>
                              {p.isFeatured && <Star className="h-3 w-3 fill-[#C08A2E] text-[#C08A2E]" />}
                            </div>
                            <p className="max-w-[200px] truncate text-[11px] text-[var(--color-text-muted)]">
                              {p.sizes?.length ? `${p.sizes.length} أحجام` : p.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-[12px] font-medium text-[var(--color-text-secondary)]">{p.categoryNameAr || catName(p.category)}</td>
                      <td className="px-5 py-3">
                        <p className="text-[13px] font-black text-[var(--color-text-primary)]">{p.price} ج.م</p>
                        {p.originalPrice && <p className="text-[11px] text-[var(--color-text-muted)] line-through">{p.originalPrice} ج.م</p>}
                      </td>
                      <td className="px-5 py-3">
                        <button onClick={(e) => { e.stopPropagation(); toggleAvail(p.id, p.isAvailable); }}><AvailabilityBadge available={p.isAvailable} /></button>
                      </td>
                      <td className="px-5 py-3"><VisibilityBadge visible={p.isVisible} /></td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={(e) => { e.stopPropagation(); openEdit(p); }}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-primary)]">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setDeleteId(p.id); }} disabled={deletingId === p.id}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] transition-colors hover:bg-[#FBE4E0] hover:text-[#C25B4F] disabled:opacity-60">
                            {deletingId === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={total} itemsPerPage={PER_PAGE} />
            </div>
          </>
        )}
      </div>

      {/* Product Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editProduct ? "تعديل المنتج" : "إضافة منتج جديد"} size="md">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--color-text-muted)]">اسم المنتج *</label>
              <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full rounded-[12px] border border-[var(--color-control-border)] bg-[var(--color-surface-soft)] px-4 py-2.5 text-[13px] text-[var(--color-text-primary)] focus:border-[var(--color-primary-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-border)]/20" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--color-text-muted)]">الاسم بالإنجليزية</label>
              <input type="text" value={form.nameEn ?? ""} dir="ltr" onChange={e => setForm(p => ({ ...p, nameEn: e.target.value }))}
                className="w-full rounded-[12px] border border-[var(--color-control-border)] bg-[var(--color-surface-soft)] px-4 py-2.5 text-[13px] text-[var(--color-text-primary)] focus:border-[var(--color-primary-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-border)]/20" />
            </div>
          </div>
          <ImageUpload value={form.image}
            onChange={img => setForm(p => ({ ...p, image: img }))}
            onPublicIdChange={pid => setForm(p => ({ ...p, imagePublicId: pid }))}
            label="صورة المنتج" hint="المقاس المفضل: 1000×600 بيكسل (نسبة 5:3) — JPG / PNG / WebP، أقل من 8 ميجا" folder="rozmaly/products" />
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--color-text-muted)]">الوصف</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2}
              className="w-full resize-none rounded-[12px] border border-[var(--color-control-border)] bg-[var(--color-surface-soft)] px-4 py-2.5 text-[13px] text-[var(--color-text-primary)] focus:border-[var(--color-primary-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-border)]/20" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--color-text-muted)]">التصنيف</label>
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="w-full rounded-[12px] border border-[var(--color-control-border)] bg-[var(--color-surface-soft)] px-4 py-2.5 text-[13px] text-[var(--color-text-primary)] focus:border-[var(--color-primary-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-border)]/20">
                {categories.map(c => <option key={c.slug} value={c.slug}>{c.nameAr}</option>)}
                {!categories.length && <option value="pizza">بيتزا</option>}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[var(--color-text-muted)]">السعر (ج.م) *</label>
              <input type="number" min={0} value={form.price} onChange={e => {
                const price = Number(e.target.value);
                setForm(p => {
                  const sizes = p.sizes ?? [];
                  if (!sizes.length) return { ...p, price };
                  const defIndex = sizes.findIndex(s => s.isDefault);
                  const target = defIndex === -1 ? 0 : defIndex;
                  return { ...p, price, sizes: sizes.map((s, i) => (i === target ? { ...s, price } : s)) };
                });
              }}
                className="w-full rounded-[12px] border border-[var(--color-control-border)] bg-[var(--color-surface-soft)] px-4 py-2.5 text-[13px] text-[var(--color-text-primary)] focus:border-[var(--color-primary-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-border)]/20" />
              {(form.sizes ?? []).length > 0 && (
                <p className="text-[10px] font-medium text-[var(--color-text-muted)]">بيتزامن مع سعر الحجم الافتراضي</p>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[var(--color-text-muted)]">السعر قبل الخصم (اختياري)</label>
            <input type="number" min={0} value={form.originalPrice ?? ""} onChange={e => setForm(p => ({ ...p, originalPrice: e.target.value ? Number(e.target.value) : undefined }))}
              className="w-full rounded-[12px] border border-[var(--color-control-border)] bg-[var(--color-surface-soft)] px-4 py-2.5 text-[13px] text-[var(--color-text-primary)] focus:border-[var(--color-primary-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-border)]/20" />
          </div>
          {/* الأحجام */}
          <div className="space-y-3 rounded-[14px] border border-[var(--color-control-border)] bg-[var(--color-surface-secondary)] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-[var(--color-primary)]" />
                <p className="text-xs font-bold text-[var(--color-text-secondary)]">الأحجام / القطع</p>
              </div>
              <button type="button" onClick={() => setForm(p => ({ ...p, sizes: [...(p.sizes ?? []), newSize()] }))}
                className="flex items-center gap-1 rounded-full border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] px-3 py-1.5 text-[11px] font-bold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary-soft)]">
                <Plus className="h-3.5 w-3.5" /> إضافة حجم
              </button>
            </div>
            {(form.sizes ?? []).map((s, i) => (
              <div key={s.id} className="grid grid-cols-[1fr_80px_80px_auto] gap-2 rounded-[10px] border border-[var(--color-control-border)] bg-[var(--color-surface-soft)] p-2">
                <input type="text" value={s.name} placeholder="كبير / قطعة..." onChange={e => updateSize(i, { name: e.target.value })}
                  className="min-w-0 rounded-[8px] border border-[var(--color-control-border)] bg-[var(--color-surface)] px-2.5 py-2 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-primary-border)] focus:outline-none" />
                <input type="number" min={0} value={s.price || ""} placeholder="السعر" onChange={e => updateSize(i, { price: Number(e.target.value) })}
                  className="min-w-0 rounded-[8px] border border-[var(--color-control-border)] bg-[var(--color-surface)] px-2 py-2 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-primary-border)] focus:outline-none" />
                <input type="number" min={0} value={s.originalPrice ?? ""} placeholder="قبل الخصم" onChange={e => updateSize(i, { originalPrice: e.target.value ? Number(e.target.value) : undefined })}
                  className="min-w-0 rounded-[8px] border border-[var(--color-control-border)] bg-[var(--color-surface)] px-2 py-2 text-xs text-[var(--color-text-primary)] focus:border-[var(--color-primary-border)] focus:outline-none" />
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => makeDefaultSize(i)} title="افتراضي"
                    className={`flex h-8 w-8 items-center justify-center rounded-full border ${s.isDefault ? "border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]" : "border-[var(--color-control-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"}`}>
                    <Star className={`h-3.5 w-3.5 ${s.isDefault ? "fill-current" : ""}`} />
                  </button>
                  <button type="button" onClick={() => setForm(p => ({ ...p, sizes: (p.sizes ?? []).filter((_, idx) => idx !== i) }))}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-control-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[#C25B4F]">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-4">
            {[{ key: "isAvailable", label: "متاح للطلب" }, { key: "isVisible", label: "ظاهر في المنيو" }, { key: "isFeatured", label: "منتج مميز" }].map(({ key, label }) => (
              <label key={key} className="flex cursor-pointer select-none items-center gap-2">
                <input type="checkbox" checked={(form as unknown as Record<string, boolean>)[key]}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.checked }))}
                  className="h-4 w-4 rounded accent-[var(--color-primary)]" />
                <span className="text-[13px] font-medium text-[var(--color-text-secondary)]">{label}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-3 border-t border-[var(--color-border-subtle)] pt-3">
            <button onClick={() => setModalOpen(false)} className="rounded-full bg-[var(--color-border-subtle)] px-4 py-2.5 text-[12px] font-bold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-border)]">إلغاء</button>
            <button onClick={saveProduct} disabled={saving}
              className="rounded-full bg-[var(--color-primary)] px-5 py-2.5 text-[12px] font-bold text-[var(--color-on-primary)] transition-colors hover:bg-[var(--color-primary-hover)] disabled:opacity-70">
              {saving ? "جاري الحفظ..." : editProduct ? "حفظ التعديلات" : "إضافة المنتج"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={() => { deleteProduct(deleteId!); setDeleteId(null); }}
        message="هل أنت متأكد من حذف هذا المنتج؟" confirmText="حذف المنتج" />
      <ConfirmDialog isOpen={!!pendingImport} onClose={() => setPendingImport(null)} onConfirm={confirmImport}
        message={`سيتم استيراد ${pendingImport?.length ?? 0} منتج. هل تريد المتابعة؟`} confirmText="استيراد" />
    </div>
  );
}
