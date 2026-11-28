"use client";

export interface BulkDeleteResult {
  succeeded: string[];
  failed: string[];
}

/**
 * حذف عدة صفوف باستخدام الـ DELETE المفرد الموجود بالفعل في كل API.
 * بنفّذ واحد ورا التاني عشان ما نزودش الحمل على السيرفر، وبنرجّع قائمة
 * الناجحين والفاشلين بدل ما نرمي استثناء في أول فشل.
 */
export async function bulkDelete(
  ids: string[],
  urlFor: (id: string) => string,
): Promise<BulkDeleteResult> {
  const succeeded: string[] = [];
  const failed: string[] = [];

  for (const id of ids) {
    try {
      const res = await fetch(urlFor(id), { method: "DELETE" });
      const data = (await res.json().catch(() => null)) as {
        success?: boolean;
        error?: { message?: string };
      } | null;

      if (!res.ok || data?.success === false) failed.push(id);
      else succeeded.push(id);
    } catch {
      failed.push(id);
    }
  }

  return { succeeded, failed };
}
