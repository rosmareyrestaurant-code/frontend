import * as XLSX from "xlsx";
import { AdminProduct, AdminProductSize } from "@/types/admin";
import { MOCK_ADMIN_CATEGORIES } from "@/data/admin/categories";

/**
 * شكل الملف الحقيقي اللي العميل هيحطه (شيت "بيانات مسطحة" في Rosemary_Menu.xlsx).
 * الاستيراد والتصدير بيستخدموا نفس الصف ده بالترتيب ده بالظبط — مفيش قالب تاني.
 */
export const MENU_HEADERS = [
  "#", "التصنيف (عربي)", "Category (EN)", "الاسم (عربي)", "Name (EN)",
  "المكونات (عربي)", "Ingredients (EN)", "السعر 1", "السعر 2", "السعر 3", "ملاحظات",
] as const;

const CATEGORY_SLUGS: Record<string, string> = {
  "بيتزا سبيشال روزماري": "pizza",
  "بيتزا روزماري": "pizza",
  "بيتزا ميكس روزماري": "pizza",
  "حلو روزماري": "desserts",
  "مشروبات": "drinks",
  "سندوتشات روزماري": "burger",
  "سندوتشات برجر": "burger",
  "إضافات روزماري - أصناف": "extras",
  "إضافات روزماري - جانبية": "extras",
  "ميكس سندوتشات": "burger",
  "باستا روزماري": "pasta",
  "كريب روزماري": "chicken",
  "كريب فراخ": "chicken",
  "ميكس كريب روزماري": "chicken",
};

const CATEGORY_LABELS: Record<string, { ar: string; en: string }> = {
  pizza: { ar: "بيتزا", en: "Pizza" },
  chicken: { ar: "كريب ودجاج", en: "Crepe" },
  burger: { ar: "سندوتشات", en: "Sandwiches" },
  pasta: { ar: "مكرونات", en: "Pasta" },
  drinks: { ar: "مشروبات", en: "Drinks" },
  desserts: { ar: "حلويات", en: "Desserts" },
  extras: { ar: "إضافات روزماري", en: "Rosemary Extras" },
};

const norm = (v: unknown) => String(v ?? "").replace(/\uFEFF/g, "").trim();
const num = (v: unknown) => {
  const n = Number(String(v ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

function resolveCategory(ar: string, en: string): string {
  if (CATEGORY_SLUGS[ar]) return CATEGORY_SLUGS[ar];
  const known = MOCK_ADMIN_CATEGORIES.find(
    (c) => c.nameAr === ar || c.nameEn === en || c.slug.toLowerCase() === en.toLowerCase(),
  );
  if (known) return known.slug;
  if (/بيتزا|pizza/i.test(`${ar} ${en}`)) return "pizza";
  if (/كريب|دجاج|crepe|chicken/i.test(`${ar} ${en}`)) return "chicken";
  if (/برجر|سندوتش|burger|sandwich/i.test(`${ar} ${en}`)) return "burger";
  if (/مكرون|باستا|pasta/i.test(`${ar} ${en}`)) return "pasta";
  if (/مشروب|عصير|drink|juice/i.test(`${ar} ${en}`)) return "drinks";
  if (/حلو|حلويات|dessert/i.test(`${ar} ${en}`)) return "desserts";
  if (/إضاف|extra/i.test(`${ar} ${en}`)) return "extras";
  return "other";
}

function categoryNames(p: AdminProduct): { ar: string; en: string } {
  const fallback = CATEGORY_LABELS[p.category] ?? { ar: p.category, en: p.category };
  return {
    ar: p.categoryNameAr || fallback.ar,
    en: p.categoryNameEn || fallback.en,
  };
}

/** السعر 1/2/3 في الملف = كبير / وسط / صغير (ترتيب الأسعار من الأعلى للأقل) */
const SIZE_NAMES = ["كبيرة", "وسط", "صغيرة"];

export function parseMenuWorkbook(data: ArrayBuffer): AdminProduct[] {
  const wb = XLSX.read(data, { type: "array" });
  const sheetName =
    wb.Sheets["بيانات مسطحة"]
      ? "بيانات مسطحة"
      : (wb.SheetNames.find((n) => n.includes("مسط")) ?? wb.SheetNames[0]);
  const sheet = wb.Sheets[sheetName];
  if (!sheet) throw new Error("الملف مفيهوش شيتات");

  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "" });
  let headerRow = -1;
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    if (rows[i].some((cell) => norm(cell) === "الاسم (عربي)")) { headerRow = i; break; }
  }
  if (headerRow < 0) throw new Error("لم أجد صف العناوين في الملف");

  const header = rows[headerRow].map(norm);
  const col = (name: string) => header.indexOf(name);
  const ix = {
    order: col("#"),
    catAr: col("التصنيف (عربي)"),
    catEn: col("Category (EN)"),
    name: col("الاسم (عربي)"),
    nameEn: col("Name (EN)"),
    desc: col("المكونات (عربي)"),
    descEn: col("Ingredients (EN)"),
    p1: col("السعر 1"),
    p2: col("السعر 2"),
    p3: col("السعر 3"),
    notes: col("ملاحظات"),
  };
  if (ix.name < 0) throw new Error("الملف مش بيعرف اسم المنتج");

  const products: AdminProduct[] = [];
  for (let r = headerRow + 1; r < rows.length; r++) {
    const row = rows[r];
    const name = norm(row[ix.name]);
    if (!name) continue;

    const catAr = norm(row[ix.catAr]);
    const catEn = norm(row[ix.catEn]);
    const prices = [ix.p1, ix.p2, ix.p3].map((i) => (i >= 0 ? num(row[i]) : 0));
    const sizes: AdminProductSize[] = [];
    prices.forEach((price, i) => {
      if (price > 0) sizes.push({ id: `size-${i + 1}`, name: SIZE_NAMES[i], price, isDefault: false });
    });
    if (sizes.length > 1) {
      const preferred = sizes.find((s) => s.name === "وسط") ?? sizes[0];
      preferred.isDefault = true;
    }

    const defaultPrice = sizes.find((s) => s.isDefault)?.price ?? sizes[0]?.price ?? prices[0] ?? 0;
    const notes = ix.notes >= 0 ? norm(row[ix.notes]) : "";

    products.push({
      id: `menu-${r}-${Date.now().toString(36)}`,
      name,
      nameEn: ix.nameEn >= 0 ? norm(row[ix.nameEn]) : "",
      description: ix.desc >= 0 ? norm(row[ix.desc]) : "",
      descriptionEn: ix.descEn >= 0 ? norm(row[ix.descEn]) : "",
      image: "",
      category: resolveCategory(catAr, catEn),
      categoryNameAr: catAr,
      categoryNameEn: catEn,
      price: defaultPrice,
      sizes: sizes.length ? sizes : undefined,
      notes: notes || undefined,
      menuOrder: ix.order >= 0 ? num(row[ix.order]) : products.length + 1,
      isAvailable: true,
      isVisible: true,
      isFeatured: false,
      createdAt: new Date().toISOString(),
    });
  }

  if (!products.length) throw new Error("الملف مفيهوش منتجات");
  return products;
}

export function exportMenuToExcel(products: AdminProduct[]) {
  const rows: (string | number)[][] = [[...MENU_HEADERS]];

  products.forEach((p, i) => {
    const cat = categoryNames(p);
    const prices: number[] = [0, 0, 0];
    if (p.sizes?.length) {
      p.sizes.forEach((s, index) => {
        const byName = SIZE_NAMES.indexOf(s.name);
        const slot = byName >= 0 ? byName : Math.min(index, 2);
        if (!prices[slot]) prices[slot] = s.price;
      });
    } else {
      prices[0] = p.price;
    }

    rows.push([
      p.menuOrder ?? i + 1,
      cat.ar,
      cat.en,
      p.name,
      p.nameEn ?? "",
      p.description ?? "",
      p.descriptionEn ?? "",
      prices[0] || "",
      prices[1] || "",
      prices[2] || "",
      p.notes ?? "",
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [
    { wch: 5 }, { wch: 24 }, { wch: 24 }, { wch: 22 }, { wch: 22 },
    { wch: 42 }, { wch: 42 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 38 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "بيانات مسطحة");
  XLSX.writeFile(wb, "Rosemary_Menu.xlsx");
}
