"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Check, Copy, Loader2, ShieldCheck, Upload, X } from "lucide-react";
import type { PaymentMethod } from "@/types";
import { IMAGE_UPLOAD } from "@/lib/constants";
import { VodafoneCashIcon, InstaPayIcon, CashPayIcon } from "./PaymentBrandIcons";

export interface PaymentConfig {
  vodafoneCashNumber: string;
  instapayAccount: string;
}

interface PaymentMethodPickerProps {
  method: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
  proofUrl: string;
  onProofChange: (url: string, publicId: string) => void;
  config: PaymentConfig;
  showMessage: (message: string, type?: "success" | "error" | "warning" | "info") => void;
}

const OPTIONS: { value: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { value: "cash",          label: "كاش",         icon: CashPayIcon },
  { value: "vodafone_cash", label: "فودافون كاش", icon: VodafoneCashIcon },
  { value: "instapay",      label: "إنستاباي",    icon: InstaPayIcon },
];

export default function PaymentMethodPicker({
  method, onMethodChange, proofUrl, onProofChange,
  config, showMessage,
}: PaymentMethodPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState("");

  const isWallet = method !== "cash";
  const account = method === "vodafone_cash" ? config.vodafoneCashNumber : config.instapayAccount;
  const methodLabel = method === "vodafone_cash" ? "فودافون كاش" : "إنستاباي";

  const copyAccount = async () => {
    if (!account) return;
    try {
      await navigator.clipboard.writeText(account);
      setCopied(account);
      showMessage("تم نسخ رقم التحويل", "success");
      setTimeout(() => setCopied(""), 2000);
    } catch {
      showMessage("تعذّر النسخ — انسخ الرقم يدوياً", "warning");
    }
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showMessage("ارفع صورة فقط (JPG / PNG / WebP)", "error");
      return;
    }
    if (file.size > IMAGE_UPLOAD.maxBytes) {
      showMessage("حجم الصورة أكبر من 8 ميجا", "error");
      return;
    }
    setUploading(true);
    try {
      const sigRes = await fetch("/api/upload/payment/sign", { method: "POST" });
      const sigData = await sigRes.json();
      if (!sigData.success) {
        showMessage(sigData.error?.message ?? "فشل تجهيز رفع الصورة", "error");
        return;
      }
      const { signature, timestamp, apiKey, uploadUrl } = sigData.data as {
        signature: string; timestamp: number; apiKey: string; uploadUrl: string;
      };

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", apiKey);
      formData.append("timestamp", String(timestamp));
      formData.append("signature", signature);
      formData.append("folder", "rozmaly/payments");

      const uploadRes = await fetch(uploadUrl, { method: "POST", body: formData });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || uploadData.error || !uploadData.secure_url) {
        showMessage(uploadData.error?.message ?? "فشل رفع صورة التحويل", "error");
        return;
      }
      onProofChange(uploadData.secure_url, uploadData.public_id ?? "");
      showMessage("تم رفع صورة التحويل", "success");
    } catch {
      showMessage("تعذّر رفع الصورة — تأكد من الاتصال وحاول تاني", "error");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-widest">طريقة الدفع</p>

      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map(({ value, label, icon: Icon }) => {
          const active = method === value;
          return (
            <button key={value} type="button" onClick={() => onMethodChange(value)}
              aria-pressed={active}
              className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border px-2 py-3 transition-all ${
                active
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/12 shadow-[0_0_0_1px_rgba(255,122,0,0.35)]"
                  : "border-[var(--color-border)] bg-[var(--color-page-background)] hover:border-[var(--color-text-primary)]"
              }`}>
              <Icon className="h-7 w-7" />
              <span className={`text-[11px] font-bold ${active ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)]"}`}>{label}</span>
            </button>
          );
        })}
      </div>

      {!isWallet && (
        <p className="flex items-start gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-page-background)] px-3 py-2.5 text-[11px] font-semibold leading-relaxed text-[var(--color-text-muted)]">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#4F8A57]" />
          هتدفع كاش للمندوب عند الاستلام — مفيش خطوات إضافية.
        </p>
      )}

      {isWallet && (
        <div className="space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-page-background)] p-3.5">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-[var(--color-text-muted)]">
              حوّل مبلغ الطلب على {methodLabel}:
            </p>
            {account ? (
              <button type="button" onClick={copyAccount}
                className="flex w-full items-center justify-between gap-2 rounded-lg border border-[var(--color-primary)]/25 bg-[var(--color-primary)]/8 px-3 py-2.5 transition-colors hover:bg-[var(--color-primary)]/15">
                <span className="text-sm font-black tracking-wide text-[var(--color-primary)]" dir="ltr">{account}</span>
                <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--color-primary)]">
                  {copied === account ? <><Check className="h-3.5 w-3.5" /> تم النسخ</> : <><Copy className="h-3.5 w-3.5" /> نسخ</>}
                </span>
              </button>
            ) : (
              <p className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-[11px] font-bold text-amber-400">
                رقم التحويل هيظهر هنا بعد ضبطه من إعدادات المتجر.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-[var(--color-text-muted)]">
              بعد التحويل ارفع صورة إيصال يوضح <span className="font-bold text-[var(--color-text-primary)]">الرقم المحوّل والتاريخ</span>:
            </p>
            <input ref={inputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])} />

            {proofUrl ? (
              <div className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-page-background)] p-2">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-[var(--color-page-background)]">
                  <Image src={proofUrl} alt="صورة التحويل" fill sizes="56px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-emerald-400">تم رفع صورة التحويل</p>
                  <p className="text-[10px] text-[var(--color-text-muted)]">يمكنك استبدالها لو رفعت صورة غلط.</p>
                </div>
                <button type="button" onClick={() => { onProofChange("", ""); inputRef.current?.click(); }}
                  className="rounded-md border border-[var(--color-border)] px-2 py-1 text-[10px] font-bold text-[var(--color-text-muted)] hover:text-white">
                  استبدال
                </button>
                <button type="button" onClick={() => onProofChange("", "")} aria-label="إزالة الصورة"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[var(--color-text-muted)] hover:bg-red-500/15 hover:text-red-400">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--color-text-primary)] px-3 py-3 text-[11px] font-bold text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)] disabled:opacity-60">
                {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> جاري رفع الصورة...</> : <><Upload className="h-4 w-4" /> رفع صورة التحويل</>}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
