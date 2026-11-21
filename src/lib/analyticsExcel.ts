import * as XLSX from "xlsx";
import type { DashboardStats } from "@/types/admin";

/** يصدّر تحليلات الداشبورد في ملف Excel واحد بثلاث شيتات */
export function exportAnalyticsExcel(stats: DashboardStats) {
  const wb = XLSX.utils.book_new();

  const summaryRows: (string | number)[][] = [
    ["تحليلات روزماري", ""],
    ["تاريخ التصدير", new Date().toLocaleString("ar-EG")],
    [],
    ["المؤشر", "القيمة"],
    ["إجمالي الطلبات", stats.totalOrders],
    ["طلبات قيد الانتظار", stats.ordersByStatus?.pending ?? 0],
    ["طلبات تم توصيلها", stats.ordersByStatus?.delivered ?? 0],
    ["طلبات ملغية", stats.ordersByStatus?.cancelled ?? 0],
    ["إجمالي المبيعات (ج.م)", stats.totalRevenue],
    ["مبيعات الشهر الحالي (ج.م)", stats.thisMonth.revenue],
    ["طلبات الشهر الحالي", stats.thisMonth.orders],
    ["متوسط قيمة الطلب (ج.م)", stats.thisMonth.avgOrderValue],
    ["عدد العملاء", stats.totalCustomers],
  ];
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryRows);
  summaryWs["!cols"] = [{ wch: 30 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, "ملخص");

  const monthlyRows: (string | number)[][] = [
    ["الشهر", "عدد الطلبات", "المبيعات (ج.م)"],
    ...stats.monthlySales.map((m) => [m.label, m.orders, m.revenue]),
  ];
  const monthlyWs = XLSX.utils.aoa_to_sheet(monthlyRows);
  monthlyWs["!cols"] = [{ wch: 20 }, { wch: 14 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, monthlyWs, "المبيعات الشهرية");

  const topRows: (string | number)[][] = [
    ["#", "المنتج", "الكمية المباعة", "إجمالي المبيعات (ج.م)"],
    ...stats.topProducts.map((p, i) => [i + 1, p.name, p.count, p.revenue]),
  ];
  const topWs = XLSX.utils.aoa_to_sheet(topRows);
  topWs["!cols"] = [{ wch: 5 }, { wch: 34 }, { wch: 14 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, topWs, "الأكثر طلباً");

  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Rosemary-Analytics-${date}.xlsx`);
}
