"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { ChevronLeft, Home } from "lucide-react";

const ROUTE_LABELS: Record<string, string> = {
  "/": "الرئيسية",
  "/menu": "كل الأكلات",
  "/offers": "العروض",
  "/about": "من نحن",
  "/my-orders": "طلباتي",
  "/order-confirmation": "تأكيد الطلب",
  "/terms": "الشروط والأحكام",
  "/privacy": "سياسة الخصوصية",
  "/login": "تسجيل الدخول",
  "/dashboard": "لوحة التحكم",
  "/dashboard/orders": "الطلبات",
  "/dashboard/products": "المنتجات",
  "/dashboard/categories": "التصنيفات",
  "/dashboard/offers": "العروض",
  "/dashboard/banners": "البانرات",
  "/dashboard/popular": "الأكثر طلباً",
  "/dashboard/delivery-zones": "مناطق التوصيل",
  "/dashboard/customers": "العملاء",
  "/dashboard/cashier": "الكاشير",
  "/dashboard/theme": "هوية الموقع",
  "/dashboard/settings": "الإعدادات",
};

const STORAGE_KEY = "rozmaly:route-history";
const MAX_HISTORY = 12;

interface RouteState {
  history: string[];
}

const SERVER_ROUTE_STATE: RouteState = { history: [] };
let routeState: RouteState = SERVER_ROUTE_STATE;
const routeListeners = new Set<() => void>();

function subscribeRoute(listener: () => void) {
  routeListeners.add(listener);
  return () => { routeListeners.delete(listener); };
}

function getRouteSnapshot(): RouteState {
  return routeState;
}

function getServerRouteSnapshot(): RouteState {
  return SERVER_ROUTE_STATE;
}

function commitRoute(history: string[]) {
  routeState = { history };
  routeListeners.forEach((listener) => listener());
}

function cleanHref(href: unknown): string | null {
  if (typeof href !== "string") return null;
  if (!href.startsWith("/") || href.startsWith("//")) return null;
  return href;
}

function pathOf(href: string): string {
  return href.split("?")[0] || "/";
}

function labelFor(href: string): string {
  const path = pathOf(href);
  if (ROUTE_LABELS[path]) return ROUTE_LABELS[path];

  const lastSegment = path.split("/").filter(Boolean).pop();
  if (!lastSegment) return "الرئيسية";
  return lastSegment.replace(/-/g, " ").replace(/_/g, " ");
}

function readStoredHistory(): string[] {
  try {
    const parsed: unknown = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(cleanHref)
      .filter((href): href is string => href !== null)
      .slice(-MAX_HISTORY);
  } catch {
    return [];
  }
}

function writeStoredHistory(history: string[]) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // التخزين الخاص متوقف — التنقل يفضل شغال من الذاكرة المؤقتة.
  }
}

function referrerRoute(pathname: string): string | null {
  if (!document.referrer) return null;
  try {
    const referrer = new URL(document.referrer);
    if (referrer.origin !== window.location.origin) return null;
    if (referrer.pathname === pathname) return null;
    return `${referrer.pathname}${referrer.search}`;
  } catch {
    return null;
  }
}

export default function PageBreadcrumbs({ className = "" }: { className?: string }) {
  const pathname = usePathname();
  const route = useSyncExternalStore(subscribeRoute, getRouteSnapshot, getServerRouteSnapshot);

  useEffect(() => {
    const currentHref = `${pathname}${window.location.search}`;
    const stored = readStoredHistory();
    const referrer = referrerRoute(pathname);
    const base = stored.length ? stored : referrer ? [referrer] : [];
    const last = base[base.length - 1];

    // نفس الصفحة بس بـ query مختلف: حدّث آخر مدخل بدل ما نضيف لنفس المسار.
    const history = (
      last && pathOf(last) === pathname
        ? [...base.slice(0, -1), currentHref]
        : [...base, currentHref]
    ).slice(-MAX_HISTORY);

    commitRoute(history);
    writeStoredHistory(history);
  }, [pathname]);

  const previous = [...route.history].reverse().find((href) => pathOf(href) !== pathname) ?? null;
  const isHome = pathname === "/";

  const linkClassName = "rounded-md px-1 py-0.5 transition-colors hover:bg-[var(--color-primary-soft)] hover:text-[var(--color-primary)]";
  const separator = (
    <ChevronLeft className="h-3 w-3 shrink-0 text-[var(--color-text-muted)]" aria-hidden="true" />
  );

  return (
    <nav
      aria-label="مسار التنقل"
      className={`flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-[var(--color-text-secondary)] ${className}`}
    >
      {isHome ? (
        <>
          {previous && (
            <>
              <Link href={previous} className={`${linkClassName} max-w-[45vw] truncate`}>
                {labelFor(previous)}
              </Link>
              {separator}
            </>
          )}
          <Link
            href="/"
            aria-current="page"
            className="inline-flex items-center gap-1 rounded-md bg-[var(--color-primary-soft)] px-2 py-0.5 text-[var(--color-primary)]"
          >
            <Home className="h-3.5 w-3.5" />
            <span>الرئيسية</span>
          </Link>
        </>
      ) : (
        <>
          <Link href="/" aria-label="الرئيسية" className={`${linkClassName} inline-flex items-center gap-1`}>
            <Home className="h-3.5 w-3.5" />
            <span>الرئيسية</span>
          </Link>
          {previous && pathOf(previous) !== "/" && (
            <>
              {separator}
              <Link href={previous} className={`${linkClassName} max-w-[45vw] truncate`}>
                {labelFor(previous)}
              </Link>
            </>
          )}
          {separator}
          <span
            aria-current="page"
            className="max-w-[55vw] truncate rounded-md bg-[var(--color-primary-soft)] px-2 py-0.5 text-[var(--color-primary)]"
          >
            {labelFor(pathname)}
          </span>
        </>
      )}
    </nav>
  );
}
