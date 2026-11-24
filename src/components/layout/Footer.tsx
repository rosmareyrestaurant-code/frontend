"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
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

const SOCIAL_PATHS: Record<string, string> = {
  facebook:
    "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  instagram:
    "M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z",
  tiktok:
    "M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z",
  whatsapp:
    "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z",
};

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

  const socialItems = [
    {
      key: "facebook",
      label: "فيسبوك",
      href: contact.socialLinks.facebook,
      hover: "hover:bg-[#1877F2] hover:ring-[#1877F2] hover:shadow-[0_10px_20px_-10px_rgba(24,119,242,0.8)]",
    },
    {
      key: "instagram",
      label: "إنستجرام",
      href: contact.socialLinks.instagram,
      hover:
        "hover:bg-[linear-gradient(45deg,#f09433_0%,#e6683c_25%,#dc2743_50%,#cc2366_75%,#bc1888_100%)] hover:ring-[#dc2743] hover:shadow-[0_10px_20px_-10px_rgba(220,39,67,0.8)]",
    },
    {
      key: "tiktok",
      label: "تيك توك",
      href: contact.socialLinks.tiktok,
      hover: "hover:bg-[#010101] hover:ring-[#010101] hover:shadow-[0_10px_20px_-10px_rgba(1,1,1,0.75)]",
    },
    {
      key: "whatsapp",
      label: "واتساب",
      href: contact.socialLinks.whatsapp,
      hover: "hover:bg-[#25D366] hover:ring-[#25D366] hover:shadow-[0_10px_20px_-10px_rgba(37,211,102,0.85)]",
    },
  ].filter((item) => Boolean(item.href));

  return (
    <footer id="contact" className="w-full border-t border-[var(--color-border)] bg-[var(--color-page-background)] pb-24 pt-10 text-center text-[var(--color-text-primary)] sm:pt-14 lg:pb-8">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 pb-10 md:grid-cols-2 lg:grid-cols-[1.5fr_0.9fr_1.4fr] lg:gap-10 lg:pb-12 lg:text-start">

          {/* البراند + واتساب */}
          <div className="flex flex-col items-center lg:items-start">
            <Link href="/" className="inline-block shrink-0"><Logo /></Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-[var(--color-text-secondary)]">
              دائماً على مزاجك .. نقدم لكم ألذ وأشهى المأكولات السريعة والبيتزا والوجبات الطازجة.
            </p>

            {socialItems.length > 0 && (
              <div className="mt-6 flex flex-col items-center lg:items-start">
                <p className="text-[11px] font-bold tracking-wide text-[var(--color-primary-border)]">تابعنا على</p>
                <div className="mt-2.5 flex items-center justify-center gap-2.5 lg:justify-start">
                  {socialItems.map((item) => (
                    <a
                      key={item.key}
                      href={item.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label={`روزماري على ${item.label}`}
                      className={`group flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-border)] text-[var(--color-primary-hover)] ring-1 ring-[var(--color-border)] transition-all duration-300 hover:-translate-y-0.5 hover:text-[#fff] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-icon)] ${item.hover}`}
                    >
                      <svg className="h-[18px] w-[18px] fill-current" viewBox="0 0 24 24" aria-hidden="true">
                        <path d={SOCIAL_PATHS[item.key]} />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            )}

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
                <span className="mt-0.5 block text-[11px] font-semibold text-[var(--color-text-secondary)]" dir="ltr">{contact.phone}</span>
              </span>
            </a>
          </div>

          {/* روابط سريعة */}
          <nav aria-label="روابط سريعة">
            <h4 className="mb-4 flex items-center justify-center gap-2 text-sm font-extrabold text-[var(--color-primary)] lg:justify-start">
              <span aria-hidden="true" className="h-4 w-1 rounded-full bg-[var(--color-primary-border)]" />
              روابط سريعة
            </h4>
            <ul className="space-y-2.5 text-sm text-[var(--color-text-secondary)]">
              {[["الرئيسية","/"],["كل الأكلات","/menu"],["العروض","/offers"],["من نحن","/about"]].map(([label,href])=>(
                <li key={href}>
                  <Link href={href} className="inline-flex items-center gap-2 transition-colors hover:text-[var(--color-icon)]">
                    <span aria-hidden="true" className="h-1 w-1 rounded-full bg-[var(--color-primary-border)]" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* تواصل معنا */}
          <div>
            <h4 className="mb-4 flex items-center justify-center gap-2 text-sm font-extrabold text-[var(--color-primary)] lg:justify-start">
              <span aria-hidden="true" className="h-4 w-1 rounded-full bg-[var(--color-primary-border)]" />
              تواصل معنا
            </h4>
            <ul className="space-y-3 text-[13px] text-[var(--color-text-secondary)]">
              {contact.phone && (
                <li className="flex items-center justify-center gap-3 lg:justify-start">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-border)] text-[var(--color-primary-hover)]"><Phone className="h-3.5 w-3.5" /></span>
                  <span dir="ltr" className="font-semibold">{contact.phone}</span>
                </li>
              )}
              {contact.address && (
                <li className="flex items-start justify-center gap-3 lg:justify-start">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-border)] text-[var(--color-primary-hover)]"><MapPin className="h-3.5 w-3.5" /></span>
                  <span className="max-w-[220px] text-start leading-relaxed">{contact.address}</span>
                </li>
              )}
              {contact.email && (
                <li className="flex items-center justify-center gap-3 lg:justify-start">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-border)] text-[var(--color-primary-hover)]"><Mail className="h-3.5 w-3.5" /></span>
                  <span dir="ltr" className="font-semibold">{contact.email}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="flex flex-col-reverse items-center gap-5 border-t border-[var(--color-border)] pt-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col items-center gap-2 lg:items-start">
            <nav aria-label="روابط قانونية" className="flex items-center gap-3 text-xs font-semibold text-[var(--color-text-secondary)]">
              <Link href="/privacy" className="underline-offset-4 transition-colors hover:text-[var(--color-primary)] hover:underline">سياسة الخصوصية</Link>
              <span aria-hidden="true" className="h-3 w-px bg-[#C9CEBF]" />
              <Link href="/terms" className="underline-offset-4 transition-colors hover:text-[var(--color-primary)] hover:underline">الشروط والأحكام</Link>
            </nav>
            <p className="text-center text-xs text-[var(--color-text-secondary)] lg:text-start">
              © 2026 روزماري (Rosemary) - جميع الحقوق محفوظة
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            <span className="text-[11px] font-bold text-[var(--color-text-secondary)]">طرق الدفع:</span>
            {[
              { label: "كاش عند الاستلام", Icon: CashPayIcon },
              { label: "فودافون كاش", Icon: VodafoneCashIcon },
              { label: "إنستاباي", Icon: InstaPayIcon },
            ].map(({ label, Icon }) => (
              <span key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-[11px] font-bold text-[var(--color-text-secondary)]">
                <Icon className="h-4 w-4" />{label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
