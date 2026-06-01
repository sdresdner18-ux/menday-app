import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Rename niche stage slugs/labels to generic production workflow names. */
const SLUG_RENAMES = [
  { from: "new", to: "in-progress", label: "In Progress" },
  { from: "decorated", to: "finishing", label: "Finishing" },
];

const LABEL_FIXES = [
  { slug: "waiting-for-files", label: "Waiting for Files" },
];

async function main() {
  for (const { from, to, label } of SLUG_RENAMES) {
    const stage = await prisma.workflowStage.findUnique({ where: { slug: from } });
    if (!stage) continue;

    const targetExists = await prisma.workflowStage.findUnique({ where: { slug: to } });
    if (targetExists && targetExists.id !== stage.id) {
      console.warn(`Skip ${from} -> ${to}: target slug already exists.`);
      continue;
    }

    await prisma.order.updateMany({
      where: { status: from },
      data: { status: to },
    });

    await prisma.statusHistory.updateMany({
      where: { statusSlug: from },
      data: { statusSlug: to, statusLabel: label },
    });

    await prisma.workflowStage.update({
      where: { id: stage.id },
      data: { slug: to, label },
    });

    console.log(`Renamed stage ${from} -> ${to} (${label})`);
  }

  for (const { slug, label } of LABEL_FIXES) {
    const updated = await prisma.workflowStage.updateMany({
      where: { slug },
      data: { label },
    });
    if (updated.count) console.log(`Updated label for ${slug} -> ${label}`);
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
