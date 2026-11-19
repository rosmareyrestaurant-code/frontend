import Link from "next/link";
import { Bike, ChefHat, Leaf, Mail, MapPin, Phone } from "lucide-react";
import Logo from "@/components/common/Logo";
import { SITE_CONTACT, WHATSAPP_URL } from "@/data/siteConfig";

export default function Footer() {
  return (
    <footer id="contact" className="w-full border-t border-[#1f1a17] bg-[#080706] pb-24 pt-10 text-center text-[#a89f94] sm:pt-14 lg:pb-8">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6 pb-12 border-b border-[#1f1a17]">
          {/* العمود 1: الشعار والوصف */}
          <div className="space-y-4">
            <Link href="/" className="inline-block shrink-0">
              <Logo />
            </Link>
            <p className="text-sm leading-relaxed text-[#8c8277]">
              دائماً على مزاجك .. نقدم لكم ألذ وأشهى المأكولات السريعة والبيتزا والوجبات الطازجة بأعلى جودة وطعم لا يُنسى.
            </p>
          </div>

          {/* العمود 2: روابط سريعة */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">
              روابط سريعة
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="transition-colors hover:text-[#ff7a00]">
                  الرئيسية
                </Link>
              </li>
              <li>
                <Link href="/menu" className="transition-colors hover:text-[#ff7a00]">
                  كل الأكلات
                </Link>
              </li>
              <li>
                <Link href="/offers" className="transition-colors hover:text-[#ff7a00]">
                  العروض والخصومات
                </Link>
              </li>
              <li>
                <Link href="/#categories" className="transition-colors hover:text-[#ff7a00]">
                  التصنيفات
                </Link>
              </li>
              <li>
                <Link href="/about" className="transition-colors hover:text-[#ff7a00]">
                  من نحن
                </Link>
              </li>
              <li>
                <Link href="/about#contact" className="transition-colors hover:text-[#ff7a00]">
                  تواصل معنا
                </Link>
              </li>
            </ul>
          </div>

          {/* العمود 3: لماذا روزماري */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">
              ليه روزماري؟
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start justify-center gap-2.5">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#ff7a00]/10 text-[#ff7a00] ring-1 ring-[#ff7a00]/20">
                  <Leaf className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="text-xs font-bold text-[#d1cbc4]">مكونات طازجة</p>
                  <p className="text-[11px] leading-relaxed text-[#786f66]">
                    نستخدم أجود المكونات يومياً
                  </p>
                </div>
              </li>
              <li className="flex items-start justify-center gap-2.5">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#ff7a00]/10 text-[#ff7a00] ring-1 ring-[#ff7a00]/20">
                  <ChefHat className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="text-xs font-bold text-[#d1cbc4]">تحضير عند الطلب</p>
                  <p className="text-[11px] leading-relaxed text-[#786f66]">
                    كل وجبة بتتحضّر طازجة لك
                  </p>
                </div>
              </li>
              <li className="flex items-start justify-center gap-2.5">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#ff7a00]/10 text-[#ff7a00] ring-1 ring-[#ff7a00]/20">
                  <Bike className="h-3.5 w-3.5" />
                </span>
                <div>
                  <p className="text-xs font-bold text-[#d1cbc4]">توصيل سريع</p>
                  <p className="text-[11px] leading-relaxed text-[#786f66]">
                    توصيل ساخن في أقرب وقت
                  </p>
                </div>
              </li>
            </ul>
          </div>

          {/* العمود 4: تابعنا على السوشيال ميديا */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">
              تابعنا على
            </h4>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {/* Facebook — أزرق */}
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                aria-label="فيسبوك"
                className="group relative flex h-9 w-9 items-center justify-center rounded-full bg-[#181512] border border-[#2a241f] overflow-hidden transition-all hover:border-[#1877F2]/60 active:scale-95"
              >
                <span className="absolute inset-0 bg-[#1877F2] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-full" aria-hidden="true" />
                <svg className="relative z-10 h-4 w-4 fill-current text-[#c4b9ad] group-hover:text-white transition-colors duration-200" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>

              {/* Instagram — تدرج بنفسجي/وردي/برتقالي */}
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                aria-label="إنستغرام"
                className="group relative flex h-9 w-9 items-center justify-center rounded-full bg-[#181512] border border-[#2a241f] overflow-hidden transition-all hover:border-[#E1306C]/60 active:scale-95"
              >
                <span
                  className="absolute inset-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-full"
                  style={{ background: "linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)" }}
                  aria-hidden="true"
                />
                <svg className="relative z-10 h-4 w-4 fill-current text-[#c4b9ad] group-hover:text-white transition-colors duration-200" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              {/* TikTok — أسود */}
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noreferrer"
                aria-label="تيك توك"
                className="group relative flex h-9 w-9 items-center justify-center rounded-full bg-[#181512] border border-[#2a241f] overflow-hidden transition-all hover:border-white/30 active:scale-95"
              >
                <span className="absolute inset-0 bg-[#010101] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-full" aria-hidden="true" />
                <svg className="relative z-10 h-4 w-4 fill-current text-[#c4b9ad] group-hover:text-white transition-colors duration-200" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                </svg>
              </a>

              {/* YouTube — أحمر */}
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                aria-label="يوتيوب"
                className="group relative flex h-9 w-9 items-center justify-center rounded-full bg-[#181512] border border-[#2a241f] overflow-hidden transition-all hover:border-[#FF0000]/60 active:scale-95"
              >
                <span className="absolute inset-0 bg-[#FF0000] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-full" aria-hidden="true" />
                <svg className="relative z-10 h-4 w-4 fill-current text-[#c4b9ad] group-hover:text-white transition-colors duration-200" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>

              {/* WhatsApp — أخضر */}
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer noopener"
                aria-label="واتساب"
                className="group relative flex h-9 w-9 items-center justify-center rounded-full bg-[#181512] border border-[#2a241f] overflow-hidden transition-all hover:border-[#25D366]/60 active:scale-95"
              >
                <span className="absolute inset-0 bg-[#25D366] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out rounded-full" aria-hidden="true" />
                <svg className="relative z-10 h-4 w-4 fill-current text-[#c4b9ad] group-hover:text-white transition-colors duration-200" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
            </div>
          </div>

          {/* العمود 5: تواصل معنا */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">
              تواصل معنا
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-center justify-center gap-2.5 text-[#d1cbc4]">
                <Phone className="h-4 w-4 text-[#ff7a00] shrink-0" />
                <span dir="ltr">{SITE_CONTACT.phone}</span>
              </li>
              <li className="flex items-center justify-center gap-2.5 text-[#d1cbc4]">
                <MapPin className="h-4 w-4 text-[#ff7a00] shrink-0" />
                <span>{SITE_CONTACT.address}</span>
              </li>
              <li className="flex items-center justify-center gap-2.5 text-[#d1cbc4]">
                <Mail className="h-4 w-4 text-[#ff7a00] shrink-0" />
                <span dir="ltr">{SITE_CONTACT.email}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* حقوق النشر في الأسفل */}
        <div className="pt-6 text-center text-xs text-[#736a61]">
          <p>© 2026 روزماري (Rosemary) - جميع الحقوق محفوظة</p>
        </div>
      </div>
    </footer>
  );
}
