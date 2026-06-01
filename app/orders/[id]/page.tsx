export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ensureChecklistItems, ensureStatusHistory } from "@/lib/orderExtras";
import { orderWithCustomerInclude, serializeOrder } from "@/lib/customers";
import { ensureWorkflowStages, getStageLabel } from "@/lib/workflow";
import OrderDetailClient from "./OrderDetailClient";
import { OrderDetailData } from "@/lib/types";

interface Props {
  params: { id: string };
}

export default async function OrderDetailPage({ params }: Props) {
  const stages = await ensureWorkflowStages();

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: orderWithCustomerInclude,
  });
  if (!order) notFound();

  const checklistItems = await ensureChecklistItems(order.id, order.projectType);

  const relatedWhere = order.customerId
    ? { customerId: order.customerId, id: { not: order.id } }
    : { customerName: order.customerName, id: { not: order.id } };

  const [relatedOrders, orderNotes, orderMessages, statusHistoryRaw] = await Promise.all([
    prisma.order.findMany({
      where: relatedWhere,
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        customerName: true,
        projectType: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.orderNote.findMany({
      where: { orderId: order.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.orderMessage.findMany({
      where: { orderId: order.id },
      orderBy: { createdAt: "asc" },
    }),
    prisma.statusHistory.findMany({
      where: { orderId: order.id },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const statusHistoryEntries = await ensureStatusHistory(order.id);
  const statusHistory =
    statusHistoryEntries.length > 0 ? statusHistoryEntries : statusHistoryRaw;

  const data: OrderDetailData = {
    order: serializeOrder(order),
    relatedOrders: relatedOrders.map((o) => ({
      ...o,
      createdAt: o.createdAt.toISOString(),
    })),
    checklistItems,
    orderNotes: orderNotes.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
    })),
    orderMessages: orderMessages.map((m) => ({
      ...m,
      createdAt: m.createdAt.toISOString(),
    })),
    statusHistory: statusHistory.map((h) => ({
      id: h.id,
      orderId: h.orderId,
      statusSlug: h.statusSlug,
      statusLabel:
        h.statusLabel || getStageLabel(stages, h.statusSlug),
      createdAt: h.createdAt.toISOString(),
    })),
  };

  return <OrderDetailClient data={data} stages={stages} />;
}
