import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import SiteChrome from "@/components/layout/SiteChrome";
import { DeliveryProvider } from "@/context/DeliveryContext";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Rosemary | مطعم روزماري - أكل أطيب بكل سهولة",
  description: "الموقع الرسمي لمطعم روزماري - اطلب أشهى وجبات البرجر، البيتزا، الدجاج المقرمش، الباستا، والمشروبات أونلاين بكل سهولة",
  appleWebApp: {
    capable: true,
    title: "روزماري",
    statusBarStyle: "black-translucent",
  },
};

// إعدادات شاشة تشبه التطبيق عند الإضافة للشاشة الرئيسية
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0a09",
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
      <body className="min-h-full flex flex-col font-sans bg-[#0b0a09] text-white antialiased">
        <DeliveryProvider>
          <SiteChrome>{children}</SiteChrome>
        </DeliveryProvider>
      </body>
    </html>
  );
}
