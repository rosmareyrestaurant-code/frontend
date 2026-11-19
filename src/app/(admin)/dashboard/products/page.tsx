"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  Search, Plus, Pencil, Trash2, Package, ChevronDown, X, Star,
  Upload, Download, FileSpreadsheet, Layers,
} from "lucide-react";
import { AvailabilityBadge, VisibilityBadge } from "@/components/admin/shared/StatusBadge";
import { Modal } from "@/components/admin/shared/Modal";
import { ConfirmDialog } from "@/components/admin/shared/ConfirmDialog";
import { EmptyState } from "@/components/admin/shared/EmptyState";
import { Pagination } from "@/components/admin/shared/Pagination";
import ImageUpload from "@/components/admin/shared/ImageUpload";
import { useToast } from "@/components/admin/shared/Toast";
import { MOCK_ADMIN_CATEGORIES } from "@/data/admin/categories";
import { CATALOG_EVENT, CATALOG_KEY, readCatalog, writeCatalog } from "@/hooks/useCatalog";
import { exportMenuToExcel, parseMenuWorkbook } from "@/lib/productExcel";
import { AdminProduct, AdminProductSize } from "@/types/admin";

const PER_PAGE = 8;

type ProductForm = Omit<AdminProduct, "id" | "createdAt">;

const EMPTY_FORM: ProductForm = {
  name: "", description: "", image: "", category: "pizza",
  price: 0, originalPrice: undefined, sizes: [],
  isAvailable: true, isVisible: true, isFeatured: false,
};

const newSize = (): AdminProductSize => ({
  id: `size-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
  name: "", price: 0, isDefault: false,
});

export default function ProductsPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [availFilter, setAvailFilter] = useState<"all" | "true" | "false">("all");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<AdminProduct | null>(null);
  const [form, setForm] = useState<ProductForm>(EMPTY_FORM);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<AdminProduct[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = () => setProducts(readCatalog());
    const onCustom = () => load();
    const onStorage = (e: StorageEvent) => { if (e.key === CATALOG_KEY) load(); };
    queueMicrotask(load);
    window.addEventListener(CATALOG_EVENT, onCustom);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CATALOG_EVENT, onCustom);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const persist = (next: AdminProduct[]) => { setProducts(next); writeCatalog(next); };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchSearch = !q || p.name.toLowerCase().includes(q) || (p.nameEn ?? "").toLowerCase().includes(q);
      const matchCat = catFilter === "all" || p.category === catFilter;
      const matchAvail = availFilter === "all" || String(p.isAvailable) === availFilter;
      return matchSearch && matchCat && matchAvail;
    });
  }, [products, search, catFilter, availFilter]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const openAdd = () => { setEditProduct(null); setForm({ ...EMPTY_FORM, sizes: [] }); setModalOpen(true); };
  const openEdit = (p: AdminProduct) => {
    setEditProduct(p);
    setForm({
      name: p.name, description: p.description, image: p.image, category: p.category,
      price: p.price, originalPrice: p.originalPrice, sizes: (p.sizes ?? []).map((s) => ({ ...s })),
      nameEn: p.nameEn, categoryNameAr: p.categoryNameAr, categoryNameEn: p.categoryNameEn,
      descriptionEn: p.descriptionEn, notes: p.notes, menuOrder: p.menuOrder,
      isAvailable: p.isAvailable, isVisible: p.isVisible, isFeatured: p.isFeatured,
    });
    setModalOpen(true);
  };

  const saveProduct = () => {
    if (!form.name.trim()) { showToast("اسم المنتج مطلوب", "error"); return; }
    const sizes = (form.sizes ?? []).filter((s) => s.name.trim() && s.price > 0);
    const price = sizes.find((s) => s.isDefault)?.price ?? sizes[0]?.price ?? form.price;
    if (!price) { showToast("لازم تدخل سعر المنتج أو سعر حجم واحد على الأقل", "error"); return; }

    const clean: ProductForm = {
      ...form,
      name: form.name.trim(),
      price,
      sizes: sizes.length ? sizes : undefined,
    };
    if (editProduct) {
      persist(products.map((p) => (p.id === editProduct.id ? { ...p, ...clean } : p)));
      showToast("تم تحديث المنتج بنجاح", "success");
    } else {
      persist([{ ...clean, id: `prod-${Date.now()}`, createdAt: new Date().toISOString() }, ...products]);
      showToast("تمت إضافة المنتج بنجاح", "success");
    }
    setModalOpen(false);
  };

  const deleteProduct = (id: string) => {
    persist(products.filter((p) => p.id !== id));
    showToast("تم حذف المنتج", "warning");
  };

  const toggleAvail = (id: string) => {
    persist(products.map((p) => (p.id === id ? { ...p, isAvailable: !p.isAvailable } : p)));
    showToast("تم تحديث حالة التوفر", "success");
  };

  const updateSize = (index: number, patch: Partial<AdminProductSize>) =>
    setForm((p) => ({
      ...p,
      sizes: (p.sizes ?? []).map((s, i) => (i === index ? { ...s, ...patch } : s)),
    }));

  const makeDefaultSize = (index: number) =>
    setForm((p) => ({
      ...p,
      sizes: (p.sizes ?? []).map((s, i) => ({ ...s, isDefault: i === index })),
    }));

  const handleExcel = async (file?: File) => {
    if (!file) return;
    try {
      const data = await file.arrayBuffer();
      const imported = parseMenuWorkbook(data);
      setPendingImport(imported);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "تعذّر قراءة ملف الإكسيل", "error");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const confirmImport = () => {
    if (!pendingImport) return;
    persist(pendingImport);
    showToast(`تم استيراد ${pendingImport.length} منتج من ملف الإكسيل`, "success");
    setPendingImport(null);
    setPage(1);
  };

  const catName = (slug: string) =>
    MOCK_ADMIN_CATEGORIES.find((c) => c.slug === slug)?.nameAr ??
    (slug === "desserts" ? "حلويات" : slug === "extras" ? "إضافات روزماري" : slug);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5a4f45]" />
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="ابحث باسم المنتج..."
              className="w-full rounded-xl bg-[#141210] border border-[#2a241f] py-2.5 pr-9 pl-4 text-sm text-white placeholder-[#5a4f45] focus:border-[#ff7a00] focus:outline-none transition-colors" />
            {search && <button onClick={() => setSearch("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5a4f45] hover:text-white"><X className="h-3.5 w-3.5" /></button>}
          </div>
          <div className="relative">
            <select value={catFilter} onChange={(e) => { setCatFilter(e.target.value); setPage(1); }}
              className="appearance-none rounded-xl bg-[#141210] border border-[#2a241f] py-2.5 pr-4 pl-7 text-sm text-white focus:border-[#ff7a00] focus:outline-none min-w-[140px]">
              <option value="all">كل التصنيفات</option>
              {Array.from(new Set(products.map((p) => p.category))).map((slug) => (
                <option key={slug} value={slug}>{catName(slug)}</option>
              ))}
            </select>
            <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#5a4f45] pointer-events-none" />
          </div>
          <div className="relative">
            <select value={availFilter} onChange={(e) => { setAvailFilter(e.target.value as "all" | "true" | "false"); setPage(1); }}
              className="appearance-none rounded-xl bg-[#141210] border border-[#2a241f] py-2.5 pr-4 pl-7 text-sm text-white focus:border-[#ff7a00] focus:outline-none min-w-[130px]">
              <option value="all">كل الحالات</option>
              <option value="true">متاح</option>
              <option value="false">غير متاح</option>
            </select>
            <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#5a4f45] pointer-events-none" />
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 rounded-xl bg-[#ff7a00] hover:bg-[#e66e00] px-4 py-2.5 text-sm font-bold text-white transition-colors shrink-0">
            <Plus className="h-4 w-4" /> إضافة منتج
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#2a241f] bg-[#141210] px-3 py-2.5">
          <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
          <span className="text-[11px] text-[#8a8076] flex-1 min-w-[180px]">
            استيراد / تصدير كل المنتجات من ملف الإكسيل بنفس شكل ملف المنيو
          </span>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => handleExcel(e.target.files?.[0])}
          />
          <button onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-500/20 transition-colors">
            <Upload className="h-3.5 w-3.5" /> استيراد إكسيل
          </button>
          <button onClick={() => {
            exportMenuToExcel(products);
            showToast("تم تنزيل ملف المنتجات", "success");
          }}
            className="flex items-center gap-1.5 rounded-lg border border-[#ff7a00]/30 bg-[#ff7a00]/10 px-3 py-1.5 text-xs font-bold text-[#ffb066] hover:bg-[#ff7a00]/20 transition-colors">
            <Download className="h-3.5 w-3.5" /> تصدير إكسيل
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-[#141210] border border-[#26201a] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#231d17]">
          <h2 className="text-sm font-bold text-white">المنتجات ({filtered.length})</h2>
        </div>
        {paginated.length === 0 ? (
          <EmptyState icon={Package} title="لا توجد منتجات" description="لم يتم العثور على منتجات مطابقة" action={<button onClick={openAdd} className="rounded-xl bg-[#ff7a00] px-4 py-2 text-sm font-bold text-white">إضافة منتج</button>} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm min-w-[750px]">
                <thead>
                  <tr className="text-[11px] text-[#5a4f45] border-b border-[#1e1914]">
                    <th className="px-5 py-3 font-bold">المنتج</th>
                    <th className="px-5 py-3 font-bold">التصنيف</th>
                    <th className="px-5 py-3 font-bold">السعر</th>
                    <th className="px-5 py-3 font-bold">التوفر</th>
                    <th className="px-5 py-3 font-bold">الظهور</th>
                    <th className="px-5 py-3 font-bold">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a1612]">
                  {paginated.map((p) => (
                    <tr key={p.id} className="hover:bg-[#1a1512] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="relative h-11 w-11 rounded-xl overflow-hidden bg-[#1a1512] shrink-0 border border-[#2a231d]">
                            {p.image
                              ? <Image src={p.image} alt={p.name} fill unoptimized={p.image.startsWith("data:")} className="object-cover" sizes="44px" />
                              : <Package className="h-5 w-5 text-[#5a4f45] m-auto" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-bold text-white">{p.name}</p>
                              {p.isFeatured && <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />}
                            </div>
                            <p className="text-[11px] text-[#5a4f45] truncate max-w-[200px]">
                              {p.sizes?.length ? `${p.sizes.length} أحجام / قطع` : p.description}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-[#a89f94]">{p.categoryNameAr || catName(p.category)}</td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-black text-[#ff7a00]">{p.price} ج.م</p>
                        {p.originalPrice && <p className="text-[11px] text-[#5a4f45] line-through">{p.originalPrice} ج.م</p>}
                      </td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => toggleAvail(p.id)}>
                          <AvailabilityBadge available={p.isAvailable} />
                        </button>
                      </td>
                      <td className="px-5 py-3.5"><VisibilityBadge visible={p.isVisible} /></td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => openEdit(p)} aria-label={`تعديل ${p.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1f1915] border border-[#2a231d] text-[#8a8076] hover:text-[#ff7a00] hover:border-[#ff7a00]/40 transition-colors">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => setDeleteId(p.id)} aria-label={`حذف ${p.name}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1f1915] border border-[#2a231d] text-[#8a8076] hover:text-red-400 hover:border-red-500/30 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3">
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} totalItems={filtered.length} itemsPerPage={PER_PAGE} />
            </div>
          </>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editProduct ? "تعديل المنتج" : "إضافة منتج جديد"} size="md">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#a89f94]">اسم المنتج *</label>
              <input type="text" value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="مثال: بيتزا بيبروني"
                className="w-full rounded-xl bg-[#1a1512] border border-[#2a231d] px-4 py-2.5 text-sm text-white placeholder-[#5a4f45] focus:border-[#ff7a00] focus:outline-none transition-colors" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#a89f94]">الاسم بالإنجليزية (اختياري)</label>
              <input type="text" value={form.nameEn ?? ""} dir="ltr"
                onChange={(e) => setForm((p) => ({ ...p, nameEn: e.target.value }))}
                placeholder="Pizza Pepperoni"
                className="w-full rounded-xl bg-[#1a1512] border border-[#2a231d] px-4 py-2.5 text-sm text-white placeholder-[#5a4f45] focus:border-[#ff7a00] focus:outline-none transition-colors" />
            </div>
          </div>

          <ImageUpload
            value={form.image}
            onChange={(image) => setForm((p) => ({ ...p, image }))}
            label="صورة المنتج"
            hint="الصورة تُرفع كملف من جهازك وتظهر في الموقع — ما فيش رابط الصورة"
            previewClassName="aspect-[16/9]"
          />

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#a89f94]">الوصف / المكونات</label>
            <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2}
              className="w-full rounded-xl bg-[#1a1512] border border-[#2a231d] px-4 py-2.5 text-sm text-white placeholder-[#5a4f45] focus:border-[#ff7a00] focus:outline-none transition-colors resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#a89f94]">التصنيف</label>
              <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="w-full rounded-xl bg-[#1a1512] border border-[#2a231d] px-4 py-2.5 text-sm text-white focus:border-[#ff7a00] focus:outline-none">
                {Array.from(new Set([
                  ...MOCK_ADMIN_CATEGORIES.map((c) => c.slug),
                  ...products.map((p) => p.category),
                ])).map((slug) => (
                  <option key={slug} value={slug}>{catName(slug)}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#a89f94]">السعر (ج.م) *</label>
              <input type="number" min={0} value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))}
                className="w-full rounded-xl bg-[#1a1512] border border-[#2a231d] px-4 py-2.5 text-sm text-white focus:border-[#ff7a00] focus:outline-none transition-colors" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#a89f94]">السعر قبل الخصم (اختياري)</label>
            <input type="number" min={0} value={form.originalPrice ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, originalPrice: e.target.value ? Number(e.target.value) : undefined }))}
              className="w-full rounded-xl bg-[#1a1512] border border-[#2a231d] px-4 py-2.5 text-sm text-white focus:border-[#ff7a00] focus:outline-none transition-colors" />
          </div>

          {/* الأحجام / القطع */}
          <div className="space-y-3 rounded-xl border border-[#2a231d] bg-[#15110e] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-[#ff7a00]" />
                <div>
                  <p className="text-xs font-bold text-[#c4b9ad]">الأحجام / القطع</p>
                  <p className="text-[10px] text-[#6b6259]">سيبها فاضية لو المنتج سعره واحد</p>
                </div>
              </div>
              <button type="button" onClick={() => setForm((p) => ({ ...p, sizes: [...(p.sizes ?? []), newSize()] }))}
                className="flex items-center gap-1 rounded-lg border border-[#ff7a00]/30 bg-[#ff7a00]/10 px-3 py-1.5 text-[11px] font-bold text-[#ffb066] hover:bg-[#ff7a00]/20 transition-colors">
                <Plus className="h-3.5 w-3.5" /> إضافة حجم
              </button>
            </div>

            {(form.sizes ?? []).map((s, i) => (
              <div key={s.id} className="grid grid-cols-[1fr_80px_80px_auto] gap-2 rounded-lg bg-[#1a1512] border border-[#2a231d] p-2">
                <input type="text" value={s.name} placeholder="كبير / قطعة..."
                  onChange={(e) => updateSize(i, { name: e.target.value })}
                  className="min-w-0 rounded-lg bg-[#141210] border border-[#2a231d] px-2.5 py-2 text-xs text-white placeholder-[#5a4f45] focus:border-[#ff7a00] focus:outline-none" />
                <input type="number" min={0} value={s.price || ""} placeholder="السعر"
                  onChange={(e) => updateSize(i, { price: Number(e.target.value) })}
                  className="min-w-0 rounded-lg bg-[#141210] border border-[#2a231d] px-2 py-2 text-xs text-white placeholder-[#5a4f45] focus:border-[#ff7a00] focus:outline-none" />
                <input type="number" min={0} value={s.originalPrice ?? ""} placeholder="قبل الخصم"
                  onChange={(e) => updateSize(i, { originalPrice: e.target.value ? Number(e.target.value) : undefined })}
                  className="min-w-0 rounded-lg bg-[#141210] border border-[#2a231d] px-2 py-2 text-xs text-white placeholder-[#5a4f45] focus:border-[#ff7a00] focus:outline-none" />
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => makeDefaultSize(i)} title="الحجم الافتراضي"
                    className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors ${s.isDefault ? "bg-[#ff7a00]/20 border-[#ff7a00]/50 text-[#ff7a00]" : "bg-[#141210] border-[#2a231d] text-[#5a4f45] hover:text-[#ff7a00]"}`}>
                    <Star className={`h-3.5 w-3.5 ${s.isDefault ? "fill-current" : ""}`} />
                  </button>
                  <button type="button" onClick={() => setForm((p) => ({ ...p, sizes: (p.sizes ?? []).filter((_, idx) => idx !== i) }))}
                    title="حذف الحجم"
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#141210] border border-[#2a231d] text-[#5a4f45] hover:text-red-400 hover:border-red-500/30 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-4">
            {[
              { key: "isAvailable", label: "متاح للطلب" },
              { key: "isVisible",   label: "ظاهر في المنيو" },
              { key: "isFeatured",  label: "منتج مميز" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={(form as unknown as Record<string, boolean>)[key]}
                  onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.checked }))}
                  className="h-4 w-4 rounded accent-[#ff7a00]" />
                <span className="text-sm text-[#c4b9ad]">{label}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-3 justify-end pt-2 border-t border-[#231d17]">
            <button onClick={() => setModalOpen(false)} className="rounded-xl bg-[#1c1613] border border-[#2a231d] px-4 py-2.5 text-sm font-bold text-[#a89f94] hover:text-white transition-colors">إلغاء</button>
            <button onClick={saveProduct} className="rounded-xl bg-[#ff7a00] hover:bg-[#e66e00] px-5 py-2.5 text-sm font-bold text-white transition-colors">{editProduct ? "حفظ التعديلات" : "إضافة المنتج"}</button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteProduct(deleteId!)}
        message="هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذه العملية."
        confirmText="حذف المنتج"
      />

      <ConfirmDialog
        isOpen={!!pendingImport}
        onClose={() => setPendingImport(null)}
        onConfirm={confirmImport}
        message={`سيتم استبدال كل المنتجات الحالية بـ ${pendingImport?.length ?? 0} منتج من ملف الإكسيل. هل تريد المتابعة؟`}
        confirmText="استيراد المنتجات"
      />
    </div>
  );
}
