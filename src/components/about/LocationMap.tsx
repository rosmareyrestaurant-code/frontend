"use client";

import { MapPin, Navigation } from "lucide-react";

interface LocationMapProps {
  isSet: boolean;
  lat: number;
  lng: number;
  googleMapsUrl: string;
  address: string;
}

export default function LocationMap({
  isSet,
  lat,
  lng,
  googleMapsUrl,
  address,
}: LocationMapProps) {
  // رابط OpenStreetMap embed — مجاني بدون API key
  const osmEmbedUrl = isSet
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.005}%2C${lat - 0.005}%2C${lng + 0.005}%2C${lat + 0.005}&layer=mapnik&marker=${lat}%2C${lng}`
    : null;

  return (
    <div className="w-full">
      {isSet ? (
        /* ═══ الخريطة الحقيقية ═══ */
        <div className="relative rounded-2xl overflow-hidden border border-[var(--color-border)] shadow-2xl">
          {/* شريط علوي بالعنوان */}
          <div className="flex items-center gap-3 px-4 py-3 bg-[var(--color-page-background)] border-b border-[var(--color-border)]">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-primary)]/15 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
              <MapPin className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold text-white">{address}</span>
          </div>

          {/* iframe الخريطة */}
          <iframe
            src={osmEmbedUrl!}
            width="100%"
            height="380"
            loading="lazy"
            title="موقع مطعم روزماري"
            className="w-full block"
            style={{ border: "none", filter: "invert(0.9) hue-rotate(180deg)" }}
          />

          {/* طبقة زر الاتجاهات */}
          <div className="flex items-center justify-center p-4 bg-[var(--color-page-background)] border-t border-[var(--color-border)]">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-hover)] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[var(--color-primary)]/20 hover:scale-105 active:scale-95 transition-all"
            >
              <Navigation className="h-4 w-4" />
              الاتجاهات إلى المطعم
            </a>
          </div>
        </div>
      ) : (
        /* ═══ حالة الموقع غير المحدد ═══ */
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-page-background)] overflow-hidden">
          {/* رسم توضيحي شبكة خريطة */}
          <div className="relative h-72 flex flex-col items-center justify-center gap-4 px-6 text-center">
            {/* خلفية شبكية decorative */}
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  "linear-gradient(var(--color-primary) 1px, transparent 1px), linear-gradient(90deg, var(--color-primary) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />

            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-[var(--color-primary)]">
              <MapPin className="h-8 w-8" />
              {/* نبض */}
              <span className="absolute inset-0 rounded-2xl border border-[var(--color-primary)]/30 animate-ping opacity-40" />
            </div>

            <div>
              <p className="text-base font-bold text-white mb-1">
                لم يتم تحديد الموقع بعد
              </p>
              <p className="text-xs text-[var(--color-text-muted)] max-w-xs leading-relaxed">
                أضف الإحداثيات الحقيقية في{" "}
                <code className="text-[var(--color-primary)] bg-[var(--color-primary)]/10 px-1.5 py-0.5 rounded text-[11px]">
                  src/data/aboutData.ts
                </code>{" "}
                لعرض الخريطة التفاعلية
              </p>
            </div>

            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="relative inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-page-background)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-primary)] hover:border-[var(--color-primary)]/40 hover:text-white transition-all"
            >
              <Navigation className="h-4 w-4 text-[var(--color-primary)]" />
              فتح في Google Maps
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
