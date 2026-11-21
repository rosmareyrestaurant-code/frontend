"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const DEFAULT_LOGO = "/images/logo-rosemary-green.png";
const SETTINGS_SAVED_KEY = "rozmaly:settings-saved";

/** آخر شعار اتجاب بنجاح — بيظهر فوراً في أي شعار جديد على نفس الصفحة */
let cachedLogo: string | null = null;

/** بيرجّع null لو الطلب فشل (مش بنثبّت الشعار القديم كأنه النتيجة) */
async function fetchLogoUrl(): Promise<string | null> {
  try {
    const res = await fetch("/api/settings/public", { cache: "no-store" });
    const d = await res.json();
    const url = d?.success && typeof d.data?.logoUrl === "string" ? d.data.logoUrl.trim() : "";
    return url || DEFAULT_LOGO;
  } catch {
    return null;
  }
}

interface LogoProps {
  className?: string;
}

export default function Logo({ className = "" }: LogoProps) {
  const [src, setSrc] = useState(cachedLogo ?? DEFAULT_LOGO);

  useEffect(() => {
    let cancelled = false;
    let retryTimer: number | undefined;

    const load = async (attempt = 0) => {
      const url = await fetchLogoUrl();
      if (cancelled) return;
      if (url) {
        cachedLogo = url;
        setSrc(url);
      } else if (attempt < 2) {
        retryTimer = window.setTimeout(() => void load(attempt + 1), 3000);
      }
    };

    void load();

    // لو الأدمن حفظ الإعدادات في تاب تاني، الشعار بيتحدّث فوراً من غير Refresh
    const onStorage = (e: StorageEvent) => {
      if (e.key === SETTINGS_SAVED_KEY) void load();
    };
    // رجوع الزائر للتاب بيجيب أحدث شعار
    const onVisible = () => {
      if (document.visibilityState === "visible") void load();
    };

    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      if (retryTimer) window.clearTimeout(retryTimer);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisible);
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
