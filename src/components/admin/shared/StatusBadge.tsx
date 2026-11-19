import { OrderStatus, ORDER_STATUS_LABELS } from "@/types/admin";

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: "bg-[#FEF3D9] text-[#B98A2C]",
  delivered: "bg-[#E3F0DE] text-[#4F8A57]",
  cancelled: "bg-[#FAE4E0] text-[#C25B4F]",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[10.5px] font-bold ${STATUS_STYLES[status]}`}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}

export function AvailabilityBadge({ available }: { available: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10.5px] font-bold ${
        available
          ? "bg-[#E3F0DE] text-[#4F8A57]"
          : "bg-[#FBE4E0] text-[#C25B4F]"
      }`}
    >
      {available ? "متاح" : "غير متاح"}
    </span>
  );
}

export function VisibilityBadge({ visible }: { visible: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10.5px] font-bold ${
        visible
          ? "bg-[#E8EFF7] text-[#5B7FA3]"
          : "bg-[#F0EDE5] text-[#8F9186]"
      }`}
    >
      {visible ? "ظاهر" : "مخفي"}
    </span>
  );
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10.5px] font-bold ${
        active
          ? "bg-[#E3F0DE] text-[#4F8A57]"
          : "bg-[#F0EDE5] text-[#8F9186]"
      }`}
    >
      {active ? "مفعّل" : "معطّل"}
    </span>
  );
}
