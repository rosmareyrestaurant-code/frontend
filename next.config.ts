import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // عزل مخرجات التطوير عن مخرجات البناء: تشغيل next build أثناء next dev
  // على نفس مجلد .next كان بيسبب full reload كل ثانية وتعارض ملفات.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  serverExternalPackages: ["mongoose", "mongodb", "mongodb-connection-string-url"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  cacheComponents: true,
  partialPrefetching: true,
  cacheLife: {
    // بيانات المنيو/البانرات: تتحدّث فوراً من الداشبورد عبر revalidateTag،
    // والكاش الزمني ده مجرد شبكة أمان لو حصل تعديل مباشر في الداتابيز.
    storefront: {
      stale: 300,
      revalidate: 300,
      expire: 3600,
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
