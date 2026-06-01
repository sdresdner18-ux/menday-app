"use client";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Order } from "@/lib/types";
import PriorityBadge from "./PriorityBadge";
import Link from "next/link";
import { formatMoney, lineAmount } from "@/lib/currency";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isOverdue(deadline: string | null): boolean {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

interface Props {
  order: Order;
  isOverlay?: boolean;
  paymentStageSlug?: string;
  onMarkPayment?: (orderId: string) => void;
}

export default function OrderCard({
  order,
  isOverlay = false,
  paymentStageSlug,
  onMarkPayment,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: order.id });

  const dragStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    borderColor: "var(--dm-border)",
    background: "color-mix(in srgb, var(--dm-surface) 72%, var(--dm-inset))",
  };

  const overdue = isOverdue(order.deadline);
  const total = lineAmount(order.unitPrice, order.quantity);
  const showPayment =
    paymentStageSlug && order.status === paymentStageSlug && onMarkPayment;

  return (
    <div
      ref={setNodeRef}
      style={dragStyle}
      className={`select-none overflow-hidden rounded-xl border transition-all duration-smooth ease-smooth-out
        ${isDragging || isOverlay ? "opacity-90 ring-2 ring-violet-500/35 shadow-glass-md" : "hover:border-violet-500/20"}
      `}
    >
      <div className="flex items-stretch">
        <button
          type="button"
          className="flex w-8 shrink-0 touch-none cursor-grab items-center justify-center border-r text-muted transition-colors hover:text-violet-500 active:cursor-grabbing"
          style={{ borderColor: "var(--dm-border)" }}
          aria-label="Drag order"
          {...attributes}
          {...listeners}
        >
          ⠿
        </button>

        <div className="min-w-0 flex-1 p-3">
          <Link href={`/orders/${order.id}`} className="block">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold">{order.customerName}</p>
                <p className="truncate text-[11px] text-muted">
                  {order.projectType}
                  {order.quantity != null ? ` · ×${order.quantity}` : ""}
                  {total != null ? ` · ${formatMoney(total)}` : ""}
                </p>
              </div>
              <PriorityBadge priority={order.priority} />
            </div>

            {order.color && (
              <p className="mb-2 truncate text-[11px] text-muted">{order.color}</p>
            )}

            <div className="flex items-center justify-between gap-2 text-[11px]">
              <span className={overdue ? "font-semibold text-red-500" : "text-muted"}>
                {overdue ? "⚠ " : ""}Due {formatDate(order.deadline)}
              </span>
              {order.filesExpected && (
                <span className="font-semibold text-amber-600 dark:text-amber-300">
                  📎 Files
                </span>
              )}
            </div>
          </Link>

          {showPayment && (
            <div
              className="mt-3 border-t pt-3"
              style={{ borderColor: "var(--dm-border)" }}
            >
              {order.paymentReceived ? (
                <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-300">
                  ✓ Payment received — drag to archive column
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => onMarkPayment(order.id)}
                  className="w-full rounded-lg border px-2 py-1.5 text-[11px] font-bold text-amber-700 transition-colors hover:bg-amber-500/10 dark:text-amber-300"
                  style={{ borderColor: "var(--dm-border)" }}
                >
                  Payment received
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
