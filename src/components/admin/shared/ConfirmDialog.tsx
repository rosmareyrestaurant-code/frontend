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
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] ${
            variant === "danger"
              ? "bg-[#FBE4E0] text-[#C25B4F]"
              : "bg-[#FCF3E7] text-[#A9803F]"
          }`}>
            <AlertTriangle className="h-5 w-5" strokeWidth={2} />
          </div>
          <p className="pt-1.5 text-[13px] font-semibold leading-relaxed text-[#6B7264]">{message}</p>
        </div>
        <div className="flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="rounded-full bg-[#F0EDE5] px-4 py-2.5 text-[12px] font-bold text-[#50604D] transition-colors hover:bg-[#E7E3D8]"
          >
            {cancelText}
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className={`rounded-full px-4 py-2.5 text-[12px] font-bold text-[#fff] transition-colors ${
              variant === "danger"
                ? "bg-[#C25B4F] hover:bg-[#B0503F]"
                : "bg-[#C08A2E] hover:bg-[#AC7A26]"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
