"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { isRecentLogout, useAdminAuth } from "@/hooks/useAdminAuth";

const subscribeHydration = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/** بوابة الداش بورد: أي زائر غير مسجّل دخول يتحوّل لصفحة اللوجن أولاً */
export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const signedIn = useAdminAuth();
  const hydrated = useSyncExternalStore(
    subscribeHydration,
    getClientSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    if (hydrated && !signedIn && !isRecentLogout()) router.replace("/login");
  }, [hydrated, signedIn, router]);

  if (!hydrated || !signedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F2F2ED] text-sm text-[#a89f94]">
        جاري التحقق من الجلسة...
      </div>
    );
  }

  return <>{children}</>;
}
