import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Upgrade legacy default labels to the generic production board names. */
const LEGACY_DEFAULT_STAGE_LABELS = {
  new: "New",
  "needs-clarification": "Needs Clarification",
  "waiting-for-files": "Waiting for Files",
  "in-progress": "In Progress",
  packed: "Packed",
  "awaiting-payment": "Awaiting Payment",
  completed: "Completed",
};

const DEFAULT_WORKFLOW_STAGES = [
  {
    slug: "new",
    label: "Order Received",
    position: 0,
    stageType: "Normal",
    color: "zinc",
  },
  {
    slug: "waiting-for-files",
    label: "Files Received",
    position: 1,
    stageType: "Normal",
    color: "yellow",
  },
  {
    slug: "in-progress",
    label: "In Production",
    position: 2,
    stageType: "Normal",
    color: "blue",
  },
  {
    slug: "finishing",
    label: "Finishing",
    position: 3,
    stageType: "Normal",
    color: "violet",
  },
  {
    slug: "packed",
    label: "Ready / Packed",
    position: 4,
    stageType: "Normal",
    color: "teal",
  },
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
  const existing = await prisma.workflowStage.findMany();
  const existingBySlug = new Map(existing.map((stage) => [stage.slug, stage]));

  for (const defaults of DEFAULT_WORKFLOW_STAGES) {
    const current = existingBySlug.get(defaults.slug);

    if (!current) {
      await prisma.workflowStage.create({ data: defaults });
      console.log(`Added stage ${defaults.slug} (${defaults.label}).`);
      continue;
    }

    const legacyLabel = LEGACY_DEFAULT_STAGE_LABELS[defaults.slug];
    const labelStillDefault =
      current.label === defaults.label ||
      (legacyLabel !== undefined && current.label === legacyLabel);

    if (!labelStillDefault) {
      console.log(`Skip ${defaults.slug}: custom label "${current.label}".`);
      continue;
    }

    if (
      current.label !== defaults.label ||
      current.position !== defaults.position ||
      current.color !== defaults.color ||
      current.stageType !== defaults.stageType
    ) {
      await prisma.workflowStage.update({
        where: { id: current.id },
        data: {
          label: defaults.label,
          position: defaults.position,
          color: defaults.color,
          stageType: defaults.stageType,
        },
      });
      console.log(`Updated stage ${defaults.slug} -> ${defaults.label}.`);
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
