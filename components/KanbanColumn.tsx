"use client";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Order, WorkflowStage } from "@/lib/types";
import { getStageDotStyle, getStageHardShadow } from "@/lib/workflow-shared";
import OrderCard from "./OrderCard";

interface Props {
  stage: WorkflowStage;
  orders: Order[];
  paymentStageSlug?: string;
  onMarkPayment: (orderId: string, received: boolean) => void;
}

export default function KanbanColumn({
  stage,
  orders,
  paymentStageSlug,
  onMarkPayment,
}: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.slug });
  const shadowOffset = isOver ? 6 : 4;

  return (
    <section
      className={`flex min-h-[220px] flex-col rounded-2xl border p-3 transition-[transform,box-shadow] duration-150 ease-out ${
        isOver ? "-translate-x-px -translate-y-px" : ""
      }`}
      style={{
        borderColor: "var(--dm-border)",
        background: "color-mix(in srgb, var(--dm-inset) 88%, transparent)",
        boxShadow: getStageHardShadow(stage.color, shadowOffset),
      }}
    >
      <div
        className="mb-3 flex items-center justify-between gap-2 rounded-xl border px-3 py-2"
        style={{ borderColor: "var(--dm-border)", background: "var(--dm-surface)" }}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={getStageDotStyle(stage.color)}
          />
          <h3 className="truncate text-xs font-extrabold uppercase tracking-wide text-muted">
            {stage.label}
          </h3>
        </div>
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold text-muted"
          style={{ background: "var(--dm-inset)" }}
        >
          {orders.length}
        </span>
      </div>

      <div ref={setNodeRef} className="flex flex-1 flex-col gap-2">
        <SortableContext
          items={orders.map((o) => o.id)}
          strategy={verticalListSortingStrategy}
        >
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              paymentStageSlug={paymentStageSlug}
              onMarkPayment={onMarkPayment}
            />
          ))}
        </SortableContext>
        {orders.length === 0 && (
          <div
            className="flex flex-1 items-center justify-center rounded-xl border border-dashed px-3 py-8 text-center text-xs text-muted"
            style={{ borderColor: "var(--dm-border)" }}
          >
            {stage.stageType === "Archive"
              ? "Drop paid orders here to complete"
              : "Drop orders here"}
          </div>
        )}
      </div>
    </section>
  );
}
