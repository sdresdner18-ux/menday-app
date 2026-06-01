import { prisma } from "@/lib/prisma";
import { getChecklistLabels } from "@/lib/checklist";
import { getStageLabel, ensureWorkflowStages } from "@/lib/workflow";

export async function ensureChecklistItems(
  orderId: string,
  projectType: string
) {
  const existing = await prisma.checklistItem.findMany({
    where: { orderId },
    orderBy: { position: "asc" },
  });

  if (existing.length > 0) return existing;

  const labels = getChecklistLabels(projectType);
  await prisma.checklistItem.createMany({
    data: labels.map((label, position) => ({
      orderId,
      label,
      position,
      checked: false,
    })),
  });

  return prisma.checklistItem.findMany({
    where: { orderId },
    orderBy: { position: "asc" },
  });
}

export async function logStatusChange(
  orderId: string,
  newStatusSlug: string,
  previousStatusSlug?: string
) {
  if (previousStatusSlug && previousStatusSlug === newStatusSlug) return;

  const stages = await ensureWorkflowStages();
  const label = getStageLabel(stages, newStatusSlug);

  await prisma.statusHistory.create({
    data: {
      orderId,
      statusSlug: newStatusSlug,
      statusLabel: label,
    },
  });
}

export async function initializeOrderExtras(
  orderId: string,
  projectType: string,
  statusSlug: string
) {
  await ensureChecklistItems(orderId, projectType);
  await logStatusChange(orderId, statusSlug);
}

export async function ensureStatusHistory(orderId: string) {
  const existing = await prisma.statusHistory.findMany({
    where: { orderId },
    orderBy: { createdAt: "asc" },
  });

  if (existing.length > 0) return existing;

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return [];

  const stages = await ensureWorkflowStages();
  const label = getStageLabel(stages, order.status);

  const entry = await prisma.statusHistory.create({
    data: {
      orderId,
      statusSlug: order.status,
      statusLabel: label,
      createdAt: order.createdAt,
    },
  });

  return [entry];
}
