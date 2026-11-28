"use client";

import { useState } from "react";
import { Loader2, Trash2, X } from "lucide-react";
import { ConfirmDialog } from "./ConfirmDialog";

interface BulkActionsBarProps {
  count: number;
  onDelete: () => void | Promise<void>;
  onClear: () => void;
  deleting?: boolean;
  title?: string;
  message: string;
  confirmText?: string;
}

/** شريط يظهر لما يتحدد صف أو أكتر، فيه إلغاء التحديد وحذف المحدد. */
export function BulkActionsBar({
  count,
  onDelete,
  onClear,
  deleting = false,
  title = "تأكيد الحذف",
  message,
  confirmText = "حذف المحدد",
}: BulkActionsBarProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (count === 0) return null;

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-[14px] border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] px-3 py-2">
        <span className="text-[12px] font-black text-[var(--color-primary)]">
          تم تحديد {count} {count === 1 ? "عنصر" : "عناصر"}
        </span>
        <button
          type="button"
          onClick={onClear}
          className="mr-auto flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11.5px] font-bold text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
        >
          <X className="h-3.5 w-3.5" /> إلغاء التحديد
        </button>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={deleting}
          className="flex items-center gap-1.5 rounded-full bg-[#C25B4F] px-3 py-1.5 text-[11.5px] font-bold text-white transition-colors hover:bg-[#B0503F] disabled:opacity-60"
        >
          {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
          {deleting ? "جارٍ الحذف..." : "حذف المحدد"}
        </button>
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          void onDelete();
        }}
        title={title}
        message={message}
        confirmText={confirmText}
        variant="danger"
      />
    </>
  );
}
