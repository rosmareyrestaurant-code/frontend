"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Bell, Menu, ReceiptText, UserRound, Volume2, VolumeX } from "lucide-react";
import { useNewOrders } from "@/hooks/useNewOrders";
import AdminProfileModal, { type AdminProfileData } from "./AdminProfileModal";

const DEFAULT_AVATAR = "/images/admin/admin-avatar.png";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard":            "الرئيسية",
  "/dashboard/orders":     "إدارة الطلبات",
  "/dashboard/products":   "إدارة المنتجات",
  "/dashboard/popular":    "الأكثر طلباً",
  "/dashboard/categories": "إدارة التصنيفات",
  "/dashboard/banners":    "إدارة البنرات",
  "/dashboard/offers":     "إدارة العروض الترويجية",
  "/dashboard/customers":  "إدارة العملاء",
  "/dashboard/delivery-zones": "مناطق التوصيل",
  "/dashboard/cashier":    "حساب الكاشير",
  "/dashboard/settings":   "إعدادات المتجر",
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" });
}

interface AdminTopbarProps {
  onMenuToggle: () => void;
}

export function AdminTopbar({ onMenuToggle }: AdminTopbarProps) {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "لوحة التحكم";
  const isHome = pathname === "/dashboard";

  const { notifications, unreadCount, pendingCount, soundEnabled, markAllRead, toggleSound } =
    useNewOrders();
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  const [profile, setProfile] = useState<AdminProfileData | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !data?.success) return;
        setProfile({
          name: data.data.name ?? "",
          avatar: data.data.avatar ?? "",
          email: data.data.email ?? "",
          role: data.data.role ?? "admin",
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!bellOpen) return;
    const onClickOutside = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) setBellOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setBellOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [bellOpen]);

  return (
    <header className="sticky top-0 z-30 flex h-[72px] shrink-0 items-center justify-between gap-3 border-b border-[#ECE7DC] bg-[#F6F4EF]/95 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E7E2D6] text-[#6B7264] transition-colors hover:bg-[#ECE9E0] lg:hidden"
          aria-label="فتح القائمة"
        >
          <Menu className="h-4 w-4" />
        </button>
        {!isHome && (
          <h1 className="truncate text-[13px] font-black text-[#333B2E]">{title}</h1>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        <div ref={bellRef} className="relative">
          <button
            onClick={() => {
              setBellOpen((open) => !open);
              if (!bellOpen) markAllRead();
            }}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#E7E2D6] bg-[#FBF9F6] text-[#6B7264] transition-colors hover:bg-[#EFECE3]"
            aria-label={unreadCount > 0 ? `الإشعارات (${unreadCount} جديد)` : "الإشعارات"}
            aria-expanded={bellOpen}
          >
            <Bell className="h-[17px] w-[17px]" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#D9534F] px-1 text-[9px] font-bold text-[#fff]">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute left-0 top-full z-50 mt-2 w-[320px] overflow-hidden rounded-2xl border border-[#E9E5DA] bg-white shadow-[0_18px_44px_-16px_rgba(38,53,43,0.35)]">
              <div className="flex items-center justify-between border-b border-[#F0EDE5] bg-[#FBF9F6] px-4 py-2.5">
                <div>
                  <p className="text-[12px] font-black text-[#333B2E]">إشعارات الطلبات</p>
                  <p className="mt-0.5 text-[10px] font-semibold text-[#9A9C90]">
                    {pendingCount > 0 ? `${pendingCount} طلب قيد الانتظار` : "لا يوجد طلبات قيد الانتظار"}
                  </p>
                </div>
                <button
                  onClick={toggleSound}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E7E2D6] bg-white text-[#6B7264] transition-colors hover:bg-[#EFECE3]"
                  aria-label={soundEnabled ? "إيقاف صوت الإشعارات" : "تشغيل صوت الإشعارات"}
                  title={soundEnabled ? "الصوت مفعّل" : "الصوت متوقف"}
                >
                  {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>
              </div>

              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <ReceiptText className="mx-auto h-6 w-6 text-[#C9CCC0]" />
                  <p className="mt-2 text-[12px] font-bold text-[#8F9186]">لا توجد إشعارات بعد</p>
                  <p className="mt-0.5 text-[10.5px] text-[#A6A79C]">
                    أول ما يوصل طلب جديد هيظهر هنا بصوت
                  </p>
                </div>
              ) : (
                <ul className="max-h-[320px] divide-y divide-[#F3F0E8] overflow-y-auto">
                  {notifications.map((order) => (
                    <li key={order.id}>
                      <Link
                        href="/dashboard/orders"
                        onClick={() => setBellOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[#F8F6F1]"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E3F0DE] text-[#4F8A57]">
                          <ReceiptText className="h-4 w-4" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-baseline justify-between gap-2">
                            <span className="truncate text-[12px] font-black text-[#333B2E]" dir="ltr">
                              #{order.orderNumber}
                            </span>
                            <span className="shrink-0 text-[10px] font-semibold text-[#9A9C90]">
                              {formatTime(order.createdAt)}
                            </span>
                          </span>
                          <span className="mt-0.5 flex items-baseline justify-between gap-2">
                            <span className="truncate text-[11px] font-semibold text-[#6B7264]">
                              {order.customerName}
                            </span>
                            <span className="shrink-0 text-[11px] font-bold text-[#333B2E]">
                              {order.total} ج.م
                            </span>
                          </span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              <Link
                href="/dashboard/orders"
                onClick={() => setBellOpen(false)}
                className="block border-t border-[#F0EDE5] bg-[#FBF9F6] px-4 py-2.5 text-center text-[11.5px] font-bold text-[#50604D] transition-colors hover:bg-[#F4F2EE]"
              >
                عرض كل الطلبات
              </Link>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setProfileOpen(true)}
          aria-haspopup="dialog"
          aria-label={profile?.role === "cashier" ? "بيانات حساب الكاشير" : "حساب المدير — تعديل الاسم والصورة"}
          title={profile?.role === "cashier" ? "بيانات حساب الكاشير" : "تعديل الاسم والصورة"}
          className="admin-profile-badge group flex items-center gap-2.5 rounded-full border border-[#ECE7DC] bg-[#FBF9F6] py-1 pe-1.5 ps-3 text-right transition-all hover:border-[#CFD8C6] hover:bg-white hover:shadow-[0_8px_20px_-10px_rgba(38,53,43,0.35)]"
        >
          <span className="hidden min-w-0 sm:block">
            <span className="block max-w-[140px] truncate text-[12px] font-black leading-none text-[#333B2E]">
              {profile ? (
                profile.name
              ) : (
                <span className="inline-block h-3 w-16 animate-pulse rounded-full bg-[#E7E3D8]" />
              )}
            </span>
            <span className="mt-1 block text-[9.5px] font-semibold leading-none text-[#8F9186]">
              {profile?.role === "admin" || !profile ? "مدير النظام" : "كاشير"}
            </span>
          </span>
          <span className="relative h-9 w-9 shrink-0 rounded-full bg-white p-[2px] ring-1 ring-[#D6DCCF] transition group-hover:ring-[#A9BB9C]">
            <span className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[#F1EEE7]">
              {profile?.role === "cashier" ? (
                <span className="flex h-full w-full items-center justify-center bg-[#EDF1E8] text-[#50604D]">
                  <UserRound className="h-5 w-5" />
                </span>
              ) : (
                <Image
                  src={profile?.avatar || DEFAULT_AVATAR}
                  alt="صورة المدير"
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              )}
            </span>
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#FBF9F6] bg-[#7FA47A]" />
          </span>
        </button>
      </div>

      <AdminProfileModal
        open={profileOpen && profile !== null}
        initial={profile ?? { name: "", avatar: "" }}
        onClose={() => setProfileOpen(false)}
        onSaved={({ name, avatar }) =>
          setProfile((prev) => (prev ? { ...prev, name, avatar } : { name, avatar }))
        }
      />
    </header>
  );
}
