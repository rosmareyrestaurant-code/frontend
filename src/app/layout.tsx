import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import SiteChrome from "@/components/layout/SiteChrome";
import { DeliveryProvider } from "@/context/DeliveryContext";
import { Toaster } from "sonner";
import { SITE_CONTACT, SOCIAL_PREVIEW_IMAGE_URL } from "@/data/siteConfig";
import { getPublicTicker, getThemeCss } from "@/lib/storefront";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const PUBLIC_SITE_URL = "https://rozemary.net";
const SITE_TITLE = "Rosemary | اطلب أونلاين";
const SITE_DESCRIPTION =
  "اطلب أشهى الساندوتشات والبيتزا والمكرونة والوجبات من Rosemary بسهولة، واستمتع بأفضل طعم وتوصيل سريع.";
const SOCIAL_PREVIEW_ALT =
  "أشهى الساندوتشات والبيتزا والمكرونة والبطاطس والمشروبات من Rosemary";

export const metadata: Metadata = {
  metadataBase: new URL(PUBLIC_SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | Rosemary",
  },
  description: SITE_DESCRIPTION,
  applicationName: "Rosemary",
  keywords: [
    "مطعم روزماري", "برجر", "بيتزا", "دجاج مقرمش", "باستا",
    "توصيل طعام", "طلب أونلاين", "مطعم القاهرة", "Rosemary",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "ar_EG",
    url: PUBLIC_SITE_URL,
    siteName: "Rosemary",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: SOCIAL_PREVIEW_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: SOCIAL_PREVIEW_ALT,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: SOCIAL_PREVIEW_IMAGE_URL, alt: SOCIAL_PREVIEW_ALT }],
  },
  appleWebApp: {
    capable: true,
    title: "روزماري",
    statusBarStyle: "black-translucent",
  },
};

const restaurantJsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: "روزماري (Rosemary)",
  alternateName: "Rosemary",
  url: PUBLIC_SITE_URL,
  image: `${PUBLIC_SITE_URL}/images/hero/hero-burger-green.jpg`,
  logo: `${PUBLIC_SITE_URL}/images/logo-rosemary-green.png`,
  telephone: `+20${SITE_CONTACT.phone.replace(/^0/, "")}`,
  email: SITE_CONTACT.email,
  servesCuisine: ["برجر", "بيتزا", "دجاج مقرمش", "باستا"],
  priceRange: "$$",
  menu: `${PUBLIC_SITE_URL}/menu`,
  acceptsReservations: false,
  address: {
    "@type": "PostalAddress",
    streetAddress: "شارع مؤسسة الزكاة",
    addressLocality: "القاهرة",
    addressCountry: "EG",
  },
  areaServed: { "@type": "City", name: "القاهرة" },
};

// إعدادات شاشة تشبه التطبيق عند الإضافة للشاشة الرئيسية
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F2F2ED",
  colorScheme: "dark",
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [themeCss, ticker] = await Promise.all([getThemeCss(), getPublicTicker()]);
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-[var(--color-page-background)] text-[var(--color-text-primary)] antialiased">
        <style id="rozmaly-theme" dangerouslySetInnerHTML={{ __html: themeCss }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantJsonLd) }}
        />
        <DeliveryProvider>
          <Toaster
            position="top-right"
            expand={false}
            richColors={false}
            closeButton
            visibleToasts={3}
            duration={2800}
            offset={16}
            toastOptions={{
              unstyled: true,
              classNames: {
                toast: "store-sonner-toast",
                title: "store-sonner-title",
                description: "store-sonner-description",
                success: "store-sonner-success",
                info: "store-sonner-info",
                error: "store-sonner-error",
                warning: "store-sonner-warning",
                loading: "store-sonner-loading",
              },
            }}
          />
          <SiteChrome ticker={ticker}>{children}</SiteChrome>
        </DeliveryProvider>
      </body>
    </html>
  );
}
