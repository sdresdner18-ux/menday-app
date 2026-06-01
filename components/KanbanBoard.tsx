"use client";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Order, WorkflowStage } from "@/lib/types";
import {
  getArchiveStage,
  getBoardColumnStages,
  getPaymentStage,
} from "@/lib/workflow";
import KanbanColumn from "./KanbanColumn";
import OrderCard from "./OrderCard";
import ArchiveNoticeModal from "./ArchiveNoticeModal";
import PaymentRequiredModal from "./PaymentRequiredModal";

interface Props {
  initialOrders: Order[];
  stages: WorkflowStage[];
}

export default function KanbanBoard({ initialOrders, stages }: Props) {
  const archiveStage = getArchiveStage(stages);
  const paymentStage = getPaymentStage(stages);
  const columns = getBoardColumnStages(stages);

  const [orders, setOrders] = useState<Order[]>(
    initialOrders.filter((o) => o.status !== archiveStage.slug)
  );
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [boardError, setBoardError] = useState<string | null>(null);
  const [archivedOrderName, setArchivedOrderName] = useState<string | null>(null);
  const [paymentRequiredOrder, setPaymentRequiredOrder] = useState<string | null>(
    null
  );
  const router = useRouter();

  useEffect(() => {
    setOrders(initialOrders.filter((o) => o.status !== archiveStage.slug));
  }, [initialOrders, archiveStage.slug]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  function handleDragStart(event: DragStartEvent) {
    const order = orders.find((o) => o.id === event.active.id);
    setActiveOrder(order ?? null);
    setBoardError(null);
  }

  async function patchOrder(orderId: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error ?? "Update failed");
    }
    return data as Order;
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveOrder(null);

    if (!over) return;

    const orderId = active.id as string;
    const overId = over.id as string;

    const dragged = orders.find((o) => o.id === orderId);
    if (!dragged) return;

    const columnSlugs = columns.map((s) => s.slug);
    const newStatus = columnSlugs.includes(overId)
      ? overId
      : orders.find((o) => o.id === overId)?.status;

    if (!newStatus || newStatus === dragged.status) return;

    if (newStatus === archiveStage.slug && !dragged.paymentReceived) {
      setPaymentRequiredOrder(dragged.customerName);
      return;
    }

    if (newStatus === archiveStage.slug) {
      try {
        await patchOrder(orderId, {
          status: archiveStage.slug,
          paymentReceived: true,
        });
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        setArchivedOrderName(dragged.customerName);
        setBoardError(null);
        router.refresh();
      } catch (e: unknown) {
        setBoardError(e instanceof Error ? e.message : "Could not archive order");
      }
      return;
    }

    const previousStatus = dragged.status;

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    try {
      const updated = await patchOrder(orderId, { status: newStatus });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch (e: unknown) {
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: previousStatus } : o
        )
      );
      setBoardError(e instanceof Error ? e.message : "Could not move order");
    }
  }

  async function handleMarkPayment(orderId: string) {
    setBoardError(null);
    try {
      const updated = await patchOrder(orderId, { paymentReceived: true });
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? updated : o))
      );
    } catch (e: unknown) {
      setBoardError(e instanceof Error ? e.message : "Could not update payment");
    }
  }

  const ordersBySlug = columns.reduce<Record<string, Order[]>>((acc, stage) => {
    acc[stage.slug] =
      stage.stageType === "Archive"
        ? []
        : orders.filter((o) => o.status === stage.slug);
    return acc;
  }, {});

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {boardError && (
          <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
            {boardError}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {columns.map((stage) => (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              orders={ordersBySlug[stage.slug] ?? []}
              paymentStageSlug={paymentStage?.slug}
              onMarkPayment={handleMarkPayment}
            />
          ))}
        </div>

        <DragOverlay>
          {activeOrder ? (
            <OrderCard
              order={activeOrder}
              isOverlay
              paymentStageSlug={paymentStage?.slug}
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {archivedOrderName && (
        <ArchiveNoticeModal
          customerName={archivedOrderName}
          onClose={() => setArchivedOrderName(null)}
        />
      )}

      {paymentRequiredOrder && (
        <PaymentRequiredModal
          customerName={paymentRequiredOrder}
          onClose={() => setPaymentRequiredOrder(null)}
        />
      )}
    </>
  );
}
