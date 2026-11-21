import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import SiteChrome from "@/components/layout/SiteChrome";
import { DeliveryProvider } from "@/context/DeliveryContext";
import { Toaster } from "sonner";
import { SITE_CONTACT, SITE_URL } from "@/data/siteConfig";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const SITE_DESCRIPTION =
  "اطلب أشهى برجر وبيتزا ودجاج مقرمش وباستا أونلاين من روزماري — توصيل سريع داخل القاهرة، والدفع كاش أو فودافون كاش أو إنستاباي.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Rosemary | مطعم روزماري - أكل أطيب بكل سهولة",
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
    url: "/",
    siteName: "Rosemary",
    title: "Rosemary | مطعم روزماري — اطلب أونلاين",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Rosemary | مطعم روزماري — اطلب أونلاين",
    description: SITE_DESCRIPTION,
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
  url: SITE_URL,
  image: `${SITE_URL}/images/hero/hero-burger-green.jpg`,
  logo: `${SITE_URL}/images/logo-rosemary-green.png`,
  telephone: `+20${SITE_CONTACT.phone.replace(/^0/, "")}`,
  email: SITE_CONTACT.email,
  servesCuisine: ["برجر", "بيتزا", "دجاج مقرمش", "باستا"],
  priceRange: "$$",
  menu: `${SITE_URL}/menu`,
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-[#F2F2ED] text-[#26352B] antialiased">
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
          <SiteChrome>{children}</SiteChrome>
        </DeliveryProvider>
      </body>
    </html>
  );
}
