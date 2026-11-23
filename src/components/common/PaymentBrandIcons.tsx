"use client";

import Image from "next/image";
import type { PaymentMethod } from "@/types";

type BrandImageProps = {
  src: string;
  alt: string;
  className?: string;
  fit?: "object-cover" | "object-contain";
};

function BrandImage({ src, alt, className = "h-5 w-5", fit = "object-contain" }: BrandImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={128}
      height={128}
      className={`${className} shrink-0 rounded-[5px] bg-[var(--color-surface-elevated)] ${fit}`}
    />
  );
}

/** شعار فودافون كاش الرسمي (صورة) */
export function VodafoneCashIcon({ className = "h-5 w-5" }: { className?: string }) {
  return <BrandImage src="/images/payment/vodafone-cash.png" alt="فودافون كاش" className={className} />;
}

/** شعار إنستاباي الرسمي (صورة) */
export function InstaPayIcon({ className = "h-5 w-5" }: { className?: string }) {
  return <BrandImage src="/images/payment/instapay.png" alt="إنستاباي" className={className} />;
}

/** صورة جنيه مصري للدفع كاش */
export function CashPayIcon({ className = "h-5 w-5" }: { className?: string }) {
  return <BrandImage src="/images/payment/cash.png" alt="كاش" className={className} />;
}

export function PaymentMethodIcon({ method, className }: { method: PaymentMethod; className?: string }) {
  if (method === "vodafone_cash") return <VodafoneCashIcon className={className} />;
  if (method === "instapay") return <InstaPayIcon className={className} />;
  return <CashPayIcon className={className} />;
}
