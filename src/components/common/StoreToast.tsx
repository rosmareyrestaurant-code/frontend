"use client";

import React, { createContext, useContext } from "react";
import { toast } from "sonner";

export type StoreToastKind = "cart" | "favorite";

interface StoreToastContextType {
  showStoreToast: (kind: StoreToastKind, productName: string) => void;
}

const StoreToastContext = createContext<StoreToastContextType>({
  showStoreToast: () => {},
});

export function StoreToastProvider({ children }: { children: React.ReactNode }) {
  const showStoreToast = (kind: StoreToastKind, productName: string) => {
    toast(kind === "cart" ? "تمت الإضافة للسلة" : "تمت الإضافة للمفضلة", {
      description: productName,
    });
  };

  return (
    <StoreToastContext.Provider value={{ showStoreToast }}>
      {children}
    </StoreToastContext.Provider>
  );
}

export function useStoreToast() {
  return useContext(StoreToastContext);
}
