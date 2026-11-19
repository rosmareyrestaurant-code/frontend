"use client";

import React from "react";
import { toast } from "sonner";

type ToastType = "success" | "error" | "warning";

export function ToastProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function useToast() {
  const showToast = (message: string, type: ToastType = "success") => {
    if (type === "error") toast.error(message);
    else if (type === "warning") toast.warning(message);
    else toast.success(message);
  };

  return { showToast };
}
