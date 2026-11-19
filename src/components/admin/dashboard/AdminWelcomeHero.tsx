"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Clock3, ShoppingBag } from "lucide-react";

interface AdminWelcomeHeroProps {
  adminName?: string;
  pendingOrders?: number;
}

export function AdminWelcomeHero({ adminName = "محمد هشام", pendingOrders = 0 }: AdminWelcomeHeroProps) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const update = () => setNow(new Date());
    const initial = setTimeout(update, 0);
    const timer = setInterval(update, 20_000);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, []);

  const dateText = now?.toLocaleDateString("ar-EG-u-nu-latn", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeText = now?.toLocaleTimeString("ar-EG-u-nu-latn", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="space-y-3.5">
      {pendingOrders > 0 && (
        <Link
          href="/dashboard/orders"
          className="flex items-center justify-between gap-3 rounded-[14px] border border-[#F0E5C8] bg-[#FEF3D9] px-4 py-2.5 transition-colors hover:bg-[#FCEEC9]"
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F5E3B5] text-[#A9803F]">
              <ShoppingBag className="h-4 w-4" strokeWidth={2} />
            </span>
            <span className="truncate text-[12.5px] font-black text-[#8A6414]">
              يوجد {pendingOrders} {pendingOrders === 1 ? "طلب" : "طلبات"} في الانتظار
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-[#8A6414]">
            عرض الطلبات <ArrowLeft className="h-3.5 w-3.5" />
          </span>
        </Link>
      )}

      <section className="relative min-h-[160px] overflow-hidden rounded-[20px] border border-[#EDE9E0] bg-[#F2EEE7] sm:min-h-[190px]">
        <Image
          src="/images/admin/dashboard-hero.png"
          alt="بيتزا روزماري"
          fill
          priority
          sizes="(max-width: 1280px) 100vw, 1100px"
          className="object-cover object-[20%_55%]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-l from-[#F4EFE7] via-[#F4EFE7]/75 to-transparent"
        />
        <div className="relative z-10 flex min-h-[160px] flex-col justify-between px-5 py-5 sm:min-h-[190px] sm:px-9 sm:py-6">
          <div>
            <h1 className="text-[22px] font-black leading-tight text-[#333B2E] sm:text-[32px]">
              مرحبًا، {adminName}
            </h1>
            <p className="mt-2 flex items-center gap-1.5 text-[12px] font-semibold text-[#8F9186] sm:text-[14px]">
              <span aria-hidden="true" className="text-[#D9534F]">♥</span>
              إدارة مطعمك أصبحت أسهل وأسرع مع <span className="font-black text-[#333B2E]">Rozmaly</span>
            </p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-bold text-[#7D8474] sm:text-[12px]">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-[#50604D]" strokeWidth={2} />
              {dateText ?? "—"}
            </span>
            <span className="flex items-center gap-1.5" dir="ltr">
              <Clock3 className="h-3.5 w-3.5 text-[#50604D]" strokeWidth={2} />
              {timeText ?? "—"}
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
