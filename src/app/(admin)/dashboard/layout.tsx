import { AdminShell } from "@/components/admin/layout/AdminShell";
import { AdminGuard } from "@/components/admin/layout/AdminGuard";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <AdminShell>{children}</AdminShell>
    </AdminGuard>
  );
}
