"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

const SIZE_CLASSES = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
  xl: "max-w-5xl",
};

export function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[#26352B]/45 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className={`relative w-full ${SIZE_CLASSES[size]} max-h-[90vh] flex flex-col overflow-hidden rounded-[20px] border border-[#EDE9E0] bg-[#FBF9F6] shadow-[0_30px_70px_-30px_rgba(38,53,43,0.45)]`}>
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#F0EDE5] px-5 py-4">
          <h2 className="text-[15px] font-black text-[#333B2E]">{title}</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F0EDE5] text-[#6B7264] transition-colors hover:bg-[#E7E3D8] hover:text-[#333B2E]"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}
