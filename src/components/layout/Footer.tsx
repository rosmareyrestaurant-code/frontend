"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bike, ChefHat, Leaf, Mail, MapPin, Phone } from "lucide-react";
import Logo from "@/components/common/Logo";
import { VodafoneCashIcon, InstaPayIcon, CashPayIcon } from "@/components/common/PaymentBrandIcons";
import { SITE_CONTACT, WHATSAPP_URL } from "@/data/siteConfig";

interface ContactInfo {
  phone: string;
  email: string;
  address: string;
  whatsappUrl: string;
  socialLinks: { facebook?: string; instagram?: string; tiktok?: string; whatsapp?: string };
}

const DEFAULTS: ContactInfo = {
  phone: SITE_CONTACT.phone,
  email: SITE_CONTACT.email,
  address: SITE_CONTACT.address,
  whatsappUrl: WHATSAPP_URL,
  socialLinks: {
    facebook: "https://facebook.com/rosemary",
    instagram: "https://instagram.com/rosemary",
    whatsapp: WHATSAPP_URL,
  },
};

export default function Footer() {
  const [contact, setContact] = useState<ContactInfo>(DEFAULTS);

  useEffect(() => {
    fetch("/api/settings/public")
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          const s = d.data;
          setContact({
            phone: s.phone || SITE_CONTACT.phone,
            email: s.email || SITE_CONTACT.email,
            address: s.address || SITE_CONTACT.address,
            whatsappUrl: s.socialLinks?.whatsapp || WHATSAPP_URL,
            socialLinks: {
              facebook: s.socialLinks?.facebook || DEFAULTS.socialLinks.facebook,
              instagram: s.socialLinks?.instagram || DEFAULTS.socialLinks.instagram,
              tiktok: s.socialLinks?.tiktok,
              whatsapp: s.socialLinks?.whatsapp || WHATSAPP_URL,
            },
          });
        }
      })
      .catch(() => {});
  }, []);

  const whatsappUrl = contact.whatsappUrl || WHATSAPP_URL;

  return (
    <footer id="contact" className="w-full border-t border-[#DAD9CC] bg-[#F2F2ED] pb-24 pt-10 text-center text-[#26352B] sm:pt-14 lg:pb-8">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 pb-10 md:grid-cols-2 lg:grid-cols-[1.5fr_0.9fr_1.4fr_1.4fr] lg:gap-10 lg:pb-12 lg:text-start">

          {/* البراند + واتساب */}
          <div className="flex flex-col items-center lg:items-start">
            <Link href="/" className="inline-block shrink-0"><Logo /></Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-[#5d6b57]">
              دائماً على مزاجك .. نقدم لكم ألذ وأشهى المأكولات السريعة والبيتزا والوجبات الطازجة.
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer noopener"
              aria-label="تواصل مع روزماري على واتساب"
              className="mt-6 inline-flex items-center gap-3 rounded-full border border-[#25D366]/40 bg-[#25D366]/10 py-2 pe-5 ps-2 transition-colors hover:bg-[#25D366]/20 active:scale-[0.98]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-[#fff]">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </span>
              <span className="text-start">
                <span className="block text-xs font-bold text-[#1f7a44]">تواصل معنا على واتساب</span>
                <span className="mt-0.5 block text-[11px] font-semibold text-[#4A5545]" dir="ltr">{contact.phone}</span>
              </span>
            </a>
          </div>

          {/* روابط سريعة */}
          <div>
            <h4 className="mb-4 text-sm font-bold text-[#3E5B45]">روابط سريعة</h4>
            <ul className="space-y-2.5 text-sm text-[#4A5545]">
              {[["الرئيسية","/"],["كل الأكلات","/menu"],["العروض","/offers"],["من نحن","/about"]].map(([label,href])=>(
                <li key={href}>
                  <Link href={href} className="inline-flex items-center gap-2 transition-colors hover:text-[#526B58]">
                    <span aria-hidden="true" className="h-1 w-1 rounded-full bg-[#899B83]" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* ليه روزماري؟ */}
          <div>
            <h4 className="mb-4 text-sm font-bold text-[#3E5B45]">ليه روزماري؟</h4>
            <ul className="space-y-4">
              {[
                { icon: Leaf, title: "مكونات طازجة", sub: "نستخدم أجود المكونات يومياً" },
                { icon: ChefHat, title: "تحضير عند الطلب", sub: "كل وجبة بتتحضّر طازجة لك" },
                { icon: Bike, title: "توصيل سريع", sub: "توصيل ساخن في أقرب وقت" },
              ].map(({ icon: Icon, title, sub }) => (
                <li key={title} className="flex items-start justify-center gap-3 lg:justify-start">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#56624A] text-[#fff] ring-1 ring-[#435241]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="text-start">
                    <p className="text-[13px] font-bold text-[#26352B]">{title}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-[#6b7665]">{sub}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* تواصل معنا */}
          <div>
            <h4 className="mb-4 text-sm font-bold text-[#3E5B45]">تواصل معنا</h4>
            <ul className="space-y-3 text-[13px] text-[#4A5545]">
              {contact.phone && (
                <li className="flex items-center justify-center gap-3 lg:justify-start">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E3E7DB] text-[#435241]"><Phone className="h-3.5 w-3.5" /></span>
                  <span dir="ltr" className="font-semibold">{contact.phone}</span>
                </li>
              )}
              {contact.address && (
                <li className="flex items-start justify-center gap-3 lg:justify-start">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E3E7DB] text-[#435241]"><MapPin className="h-3.5 w-3.5" /></span>
                  <span className="max-w-[220px] text-start leading-relaxed">{contact.address}</span>
                </li>
              )}
              {contact.email && (
                <li className="flex items-center justify-center gap-3 lg:justify-start">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E3E7DB] text-[#435241]"><Mail className="h-3.5 w-3.5" /></span>
                  <span dir="ltr" className="font-semibold">{contact.email}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="flex flex-col-reverse items-center gap-4 border-t border-[#DAD9CC] pt-6 lg:flex-row lg:justify-between">
          <div className="flex flex-col items-center gap-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#6b7665]">
              <Link href="/privacy" className="transition-colors hover:text-[#3E5B45]">سياسة الخصوصية</Link>
              <span aria-hidden="true">•</span>
              <Link href="/terms" className="transition-colors hover:text-[#3E5B45]">الشروط والأحكام</Link>
            </div>
            <p className="text-center text-xs text-[#6b7665]">
              © 2026 روزماري (Rosemary) - جميع الحقوق محفوظة
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <span className="text-[11px] font-bold text-[#6b7665]">طرق الدفع:</span>
            {[
              { label: "كاش عند الاستلام", Icon: CashPayIcon },
              { label: "فودافون كاش", Icon: VodafoneCashIcon },
              { label: "إنستاباي", Icon: InstaPayIcon },
            ].map(({ label, Icon }) => (
              <span key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#E7E3D8] bg-[#FBF9F6] px-3 py-1.5 text-[11px] font-bold text-[#4A5545]">
                <Icon className="h-4 w-4" />{label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
