"use client";

import React, { useCallback } from "react";
import { toast } from "sonner";
import { toastIcon } from "@/components/common/toastVariants";

type ToastType = "success" | "error" | "warning";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useToast() {
  const showToast = useCallback((message: string, type: ToastType = "success") => {
    if (type === "error") toast.error(message, { icon: toastIcon("error") });
    else if (type === "warning") toast.warning(message, { icon: toastIcon("warning") });
    else toast.success(message, { icon: toastIcon("success") });
  }, []);

  return { showToast };
}
