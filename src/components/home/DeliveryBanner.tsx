import Image from "next/image";

export default function DeliveryBanner() {
  return (
    <section
      id="delivery-banner"
      className="w-full bg-[var(--color-page-background)] py-5 sm:py-7 select-none"
    >
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        {/* البانر: صورة فقط بدون هوفر أو بوردر */}
        <div
          className="relative min-h-[110px] w-full overflow-hidden rounded-2xl shadow-2xl shadow-black/60 sm:min-h-0 sm:rounded-3xl"
          style={{ aspectRatio: "790 / 215" }}
        >
          <Image
            src="/images/promo/delivery-banner.jpg"
            alt="خدمة توصيل سريعة لحد مكانك — مطعم روزماري"
            fill
            className="object-cover object-center"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1400px"
            priority={false}
          />
        </div>
      </div>
    </section>
  );
}
