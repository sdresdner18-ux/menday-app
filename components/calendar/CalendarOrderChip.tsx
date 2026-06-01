"use client";

import Link from "next/link";
import { Order, WorkflowStage } from "@/lib/types";
import { formatMoney, lineAmount } from "@/lib/currency";
import { getStageBadgeStyle, getStageBySlug } from "@/lib/workflow-shared";

const PRIORITY_ACCENT: Record<string, string> = {
  Urgent: "#ef4444",
  High: "#f59e0b",
  Medium: "#3b82f6",
  Low: "#71717a",
};

interface Props {
  order: Order;
  stages: WorkflowStage[];
  compact?: boolean;
}

export default function CalendarOrderChip({
  order,
  stages,
  compact = false,
}: Props) {
  const stage = getStageBySlug(stages, order.status);
  const accent = PRIORITY_ACCENT[order.priority] ?? PRIORITY_ACCENT.Medium;
  const total = lineAmount(order.unitPrice, order.quantity);
  const badgeStyle = getStageBadgeStyle(stage?.color ?? "zinc");

  return (
    <Link
      href={`/orders/${order.id}`}
      className={`group block rounded-xl border transition-all duration-smooth ease-smooth-out hover:-translate-y-0.5 hover:shadow-glass-md ${
        compact ? "px-2 py-1.5" : "px-3 py-2.5"
      }`}
      style={{
        borderColor: "var(--dm-border)",
        background: "color-mix(in srgb, var(--dm-surface) 88%, transparent)",
        borderLeftWidth: 3,
        borderLeftColor: accent,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p
            className={`truncate font-extrabold text-[var(--dm-text)] ${
              compact ? "text-[11px]" : "text-sm"
            }`}
          >
            {order.customerName}
          </p>
          <p className={`truncate text-muted ${compact ? "text-[10px]" : "text-xs"}`}>
            {order.projectType}
            {order.quantity != null ? ` · ×${order.quantity}` : ""}
            {!compact && total != null ? ` · ${formatMoney(total)}` : ""}
          </p>
        </div>
        {!compact && (
          <span
            className="shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-bold uppercase"
            style={badgeStyle}
          >
            {stage?.label ?? order.status}
          </span>
        )}
      </div>
      {!compact && order.color && (
        <p className="mt-1 truncate text-[11px] text-muted">{order.color}</p>
      )}
    </Link>
  );
}
