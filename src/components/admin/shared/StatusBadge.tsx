import { OrderStatus, ORDER_STATUS_LABELS } from "@/types/admin";

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending:   "bg-yellow-500/15  text-yellow-400  border-yellow-500/30",
  delivered: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  cancelled: "bg-red-500/15     text-red-400     border-red-500/30",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${STATUS_STYLES[status]}`}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

export function AvailabilityBadge({ available }: { available: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
        available
          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
          : "bg-red-500/15 text-red-400 border-red-500/30"
      }`}
    >
      {available ? "متاح" : "غير متاح"}
    </span>
  );
}

export function VisibilityBadge({ visible }: { visible: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
        visible
          ? "bg-sky-500/15 text-sky-400 border-sky-500/30"
          : "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"
      }`}
    >
      {visible ? "ظاهر" : "مخفي"}
    </span>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${
        active
          ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
          : "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"
      }`}
    >
      {active ? "مفعّل" : "معطّل"}
    </span>
  );
}
