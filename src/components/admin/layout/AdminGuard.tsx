"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isRecentLogout, useAdminAuth } from "@/hooks/useAdminAuth";

const subscribeHydration = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/** بوابة الداش بورد: أي زائر غير مسجّل دخول يتحوّل لصفحة اللوجن أولاً */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const signedIn = useAdminAuth();
  const roleChecked = useRef(false);
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    getClientSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    if (hydrated && !signedIn && !isRecentLogout()) router.replace("/login");
  }, [hydrated, signedIn, router]);

  // حماية إضافية لو الدور اتغيّر بعد إنشاء الجلسة: الكاشير ميشوفش غير الطلبات
  useEffect(() => {
    if (!signedIn || roleChecked.current) return;
    roleChecked.current = true;
    fetch("/api/admin/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d?.success && d.data?.role === "cashier" && !pathname.startsWith("/dashboard/orders")) {
          router.replace("/dashboard/orders");
        }
      })
      .catch(() => {});
  }, [signedIn, pathname, router]);

  if (!hydrated || !signedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-page-background)] text-sm text-[var(--color-text-muted)]">
        جاري التحقق من الجلسة...
      </div>
    );
  }

  return <>{children}</>;
}
