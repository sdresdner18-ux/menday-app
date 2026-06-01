import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const LEGACY_STATUS_TO_SLUG = {
  New: "new",
  NeedsClarification: "needs-clarification",
  WaitingForFiles: "waiting-for-files",
  InProgress: "in-progress",
  Printing: "in-progress",
  Packed: "packed",
  AwaitingPayment: "awaiting-payment",
  Completed: "completed",
};

const DEFAULT_WORKFLOW_STAGES = [
  { slug: "new", label: "New", position: 0, stageType: "Normal", color: "zinc" },
  {
    slug: "needs-clarification",
    label: "Needs Clarification",
    position: 1,
    stageType: "Normal",
    color: "amber",
  },
  {
    slug: "waiting-for-files",
    label: "Waiting for Files",
    position: 2,
    stageType: "Normal",
    color: "yellow",
  },
  {
    slug: "in-progress",
    label: "In Progress",
    position: 3,
    stageType: "Normal",
    color: "blue",
  },
  { slug: "packed", label: "Packed", position: 4, stageType: "Normal", color: "teal" },
  {
    slug: "awaiting-payment",
    label: "Awaiting Payment",
    position: 5,
    stageType: "Payment",
    color: "orange",
  },
  {
    slug: "completed",
    label: "Completed",
    position: 6,
    stageType: "Archive",
    color: "emerald",
  },
];

async function main() {
  const stageCount = await prisma.workflowStage.count();
  if (stageCount === 0) {
    await prisma.workflowStage.createMany({ data: DEFAULT_WORKFLOW_STAGES });
    console.log(`Seeded ${DEFAULT_WORKFLOW_STAGES.length} workflow stages.`);
  }

  const stages = await prisma.workflowStage.findMany();
  const labelBySlug = Object.fromEntries(stages.map((s) => [s.slug, s.label]));
  const validSlugs = new Set(stages.map((s) => s.slug));

  const orders = await prisma.order.findMany({ select: { id: true, status: true } });
  let orderUpdates = 0;
  for (const order of orders) {
    let slug = order.status;
    if (!slug || !validSlugs.has(slug)) {
      slug = LEGACY_STATUS_TO_SLUG[order.status] ?? "new";
      await prisma.order.update({ where: { id: order.id }, data: { status: slug } });
      orderUpdates++;
    }
  }
  console.log(`Normalized ${orderUpdates} order status slug(s).`);

  const history = await prisma.statusHistory.findMany();
  let historyUpdates = 0;
  for (const row of history) {
    let slug = row.statusSlug;
    if (!slug || !validSlugs.has(slug)) {
      slug =
        LEGACY_STATUS_TO_SLUG[row.statusSlug] ??
        LEGACY_STATUS_TO_SLUG[row.statusLabel] ??
        row.statusSlug ??
        "new";
    }
    const label = labelBySlug[slug] ?? row.statusLabel ?? slug;
    if (row.statusSlug !== slug || row.statusLabel !== label) {
      await prisma.statusHistory.update({
        where: { id: row.id },
        data: { statusSlug: slug, statusLabel: label },
      });
      historyUpdates++;
    }
  }
  console.log(`Updated ${historyUpdates} status history row(s).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
