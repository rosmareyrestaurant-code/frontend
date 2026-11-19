import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-4">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1f1915] border border-[#2a231d] text-[#5a4f45]">
        <Icon className="h-8 w-8" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-base font-bold text-white">{title}</h3>
        {description && <p className="text-sm text-[#8a8076] max-w-xs">{description}</p>}
      </div>
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
