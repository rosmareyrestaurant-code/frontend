import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "طلباتي السابقة",
  description: "راجع طلباتك السابقة وتفاصيلها من روزماري.",
};

export default function MyOrdersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
