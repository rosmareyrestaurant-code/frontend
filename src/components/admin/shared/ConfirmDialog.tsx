"use client";

import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning";
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "تأكيد العملية",
  message,
  confirmText = "تأكيد",
  cancelText = "إلغاء",
  variant = "danger",
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-5">
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            variant === "danger"
              ? "bg-red-500/15 text-red-400"
              : "bg-yellow-500/15 text-yellow-400"
          }`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <p className="text-sm text-[#c4b9ad] leading-relaxed pt-1.5">{message}</p>
        </div>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-[#1c1613] border border-[#2a231d] px-4 py-2.5 text-sm font-bold text-[#a89f94] hover:text-white transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-colors ${
              variant === "danger"
                ? "bg-red-500/80 hover:bg-red-500 border border-red-500/50"
                : "bg-yellow-500/80 hover:bg-yellow-500 border border-yellow-500/50"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
