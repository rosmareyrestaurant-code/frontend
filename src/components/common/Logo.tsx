"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const DEFAULT_LOGO = "/images/logo-rosemary-green.png";

let inflight: Promise<string> | null = null;

/** بيجيب الشعار المحفوظ في الإعدادات — الطلبات المتزامنة بتتشارك نفس الـ fetch */
function fetchLogoUrl(): Promise<string> {
  if (!inflight) {
    inflight = fetch("/api/settings/public", { cache: "no-store" })
      .then((res) => res.json())
      .then((d) => {
        const url = d?.success && typeof d.data?.logoUrl === "string" ? d.data.logoUrl.trim() : "";
        return url || DEFAULT_LOGO;
      })
      .catch(() => DEFAULT_LOGO)
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

interface LogoProps {
  className?: string;
}

export default function Logo({ className = "" }: LogoProps) {
  const [src, setSrc] = useState(DEFAULT_LOGO);

  useEffect(() => {
    let cancelled = false;
    void fetchLogoUrl().then((url) => {
      if (!cancelled) setSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <span
      role="img"
      aria-label="روزماري - مطعم روزماري"
      className={`inline-flex items-center ${className}`}
    >
      <Image
        src={src}
        alt="Rosemary Logo"
        width={160}
        height={83}
        priority
        style={{ width: "auto" }}
        unoptimized={src.startsWith("data:")}
        className="h-10 object-contain drop-shadow-[0_2px_8px_rgba(82,107,88,0.28)] sm:h-12 lg:h-14"
      />
    </span>
  );
}
