"use client";

import React, { createContext, useCallback, useContext } from "react";
import { toast } from "sonner";
import { toastIcon } from "./toastVariants";

export type StoreToastKind = "cart" | "favorite";
export type StoreToastType = "success" | "info" | "error" | "warning";

interface StoreToastContextType {
  showStoreToast: (kind: StoreToastKind, productName: string) => void;
  /** رسالة عامة (أخطاء GPS، فشل إرسال الطلب...) بدون alert */
  showMessage: (message: string, type?: StoreToastType) => void;
}

const noop = () => {};

const StoreToastContext = createContext<StoreToastContextType>({
  showStoreToast: noop,
  showMessage: noop,
});

export function StoreToastProvider({ children }: { children: React.ReactNode }) {
  const showStoreToast = useCallback((kind: StoreToastKind, productName: string) => {
    toast(kind === "cart" ? "تمت الإضافة للسلة" : "تمت الإضافة للمفضلة", {
      description: productName,
      icon: toastIcon(kind),
      className: kind === "cart" ? "store-sonner-cart" : "store-sonner-favorite",
    });
  }, []);

  const showMessage = useCallback((message: string, type: StoreToastType = "success") => {
    const options = { icon: toastIcon(type) };
    if (type === "error") toast.error(message, options);
    else if (type === "warning") toast.warning(message, options);
    else if (type === "info") toast.info(message, options);
    else toast.success(message, options);
  }, []);

  return (
    <StoreToastContext.Provider value={{ showStoreToast, showMessage }}>
      {children}
    </StoreToastContext.Provider>
  );
}

export function useStoreToast() {
  return useContext(StoreToastContext);
}
