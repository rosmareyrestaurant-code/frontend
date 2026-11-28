"use client";

import { useCallback, useMemo, useState } from "react";

/**
 * اختيار متعدد عام لصفوف الجداول / البطاقات.
 * لا يعتمد على نوع الصف — بيتعامل مع معرّفات نصية بس، عشان يُستخدم في كل
 * جداول الداش بورد بنفس الطريقة.
 * لو اتبعت validIds، المعرّفات اللي اختفت من القائمة (بحث/فلتر/حذف) بتتستبعد
 * من النتيجة بدون ما نكتب setState داخل effect.
 */
export function useRowSelection(validIds?: string[]) {
  const [rawSelectedIds, setRawSelectedIds] = useState<string[]>([]);
  const validKey = validIds?.join("\u0000") ?? "";

  const visibleIds = useMemo(
    () => (validKey ? validKey.split("\u0000") : []),
    [validKey],
  );

  const selectedIds = useMemo(() => {
    if (!validIds) return rawSelectedIds;
    const valid = new Set(visibleIds);
    return rawSelectedIds.filter((id) => valid.has(id));
  }, [rawSelectedIds, validIds, visibleIds]);

  const isSelected = useCallback(
    (id: string) => selectedIds.includes(id),
    [selectedIds],
  );

  const toggle = useCallback((id: string) => {
    setRawSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }, []);

  const toggleAll = useCallback((ids: string[]) => {
    setRawSelectedIds((prev) => {
      const allSelected = ids.length > 0 && ids.every((id) => prev.includes(id));
      if (allSelected) return prev.filter((id) => !ids.includes(id));
      return Array.from(new Set([...prev, ...ids]));
    });
  }, []);

  const allSelected = useCallback(
    (ids: string[]) => ids.length > 0 && ids.every((id) => selectedIds.includes(id)),
    [selectedIds],
  );

  const clear = useCallback(() => setRawSelectedIds([]), []);

  /** إزالة المعرّفات اللي اختفت نهائياً من القائمة. */
  const prune = useCallback((ids: string[]) => {
    const valid = new Set(ids);
    setRawSelectedIds((prev) => prev.filter((id) => valid.has(id)));
  }, []);

  const count = selectedIds.length;
  const hasSelection = count > 0;
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  return {
    selectedIds,
    selectedSet,
    count,
    hasSelection,
    isSelected,
    toggle,
    toggleAll,
    allSelected,
    clear,
    prune,
  };
}
