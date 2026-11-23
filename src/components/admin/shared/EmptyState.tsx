import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 px-4 py-16 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-[18px] border border-[var(--color-border)] bg-[var(--color-border-subtle)] text-[var(--color-text-muted)]">
        <Icon className="h-8 w-8" strokeWidth={1.7} />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-[15px] font-black text-[var(--color-text-primary)]">{title}</h3>
        {description && <p className="max-w-xs text-[12px] font-semibold text-[var(--color-text-muted)]">{description}</p>}
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
