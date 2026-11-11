import { Icon } from "@/components/ui/Icon";
import type { T } from "@/lib/i18n";
import type { OrderStatus } from "@/lib/orders/status";

const STYLE: Record<OrderStatus, { cls: string; icon: string }> = {
  new: { cls: "bg-warn-50 text-warn-600", icon: "hourglass_top" },
  ready: { cls: "bg-royal-50 text-royal-600", icon: "inventory" },
  on_the_way: { cls: "bg-royal-600 text-white", icon: "local_shipping" },
  delivered: { cls: "bg-ok-50 text-ok-600", icon: "check_circle" },
  failed: { cls: "bg-bad-50 text-bad-600", icon: "cancel" },
  cancelled: { cls: "bg-mist-100 text-ink-500", icon: "block" },
};

export function StatusChip({ status, t }: { status: OrderStatus; t: T }) {
  const s = STYLE[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${s.cls}`}>
      <Icon name={s.icon} className="text-base" />
      {t(`status.${status}` as const)}
    </span>
  );
}
