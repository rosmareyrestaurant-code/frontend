import {
  AlertCircle, AlertTriangle, Check, Heart, Info, Loader2, ShoppingCart,
} from "lucide-react";

export type ToastVariant =
  | "success" | "info" | "error" | "warning" | "loading" | "cart" | "favorite";

const ICONS = {
  success: Check,
  info: Info,
  error: AlertCircle,
  warning: AlertTriangle,
  loading: Loader2,
  cart: ShoppingCart,
  favorite: Heart,
} as const;

export function toastIcon(variant: ToastVariant) {
  const Icon = ICONS[variant];
  return (
    <span className={`store-toast-icon${variant === "loading" ? " is-spinning" : ""}`}>
      <Icon strokeWidth={2.4} />
    </span>
  );
}
