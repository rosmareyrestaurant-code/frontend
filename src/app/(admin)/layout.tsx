import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "لوحة تحكم روزماري",
  description: "لوحة إدارة مطعم روزماري",
};

/**
 * مجموعة راوتات الأدمن. الـ html/body والخط العام بيجوا من الـ root layout،
 * والهيدر/الفوتر بتاع الموقع متلغيين هنا عن طريق SiteChrome.
 */
export default function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
