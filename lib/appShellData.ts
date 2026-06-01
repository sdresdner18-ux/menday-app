import "server-only";

import { cache } from "react";
import { prisma } from "./prisma";
import { ensureWorkflowStages } from "./workflow";
import { getArchiveStage } from "./workflow-shared";

export interface AppShellOrderStats {
  active: number;
  archived: number;
  urgent: number;
  waitingFiles: number;
}

/** Per-request cache — avoids re-fetching stages on the same page render. */
export const getCachedWorkflowStages = cache(async () => ensureWorkflowStages());

export async function getAppShellOrderStats(
  stages: Awaited<ReturnType<typeof ensureWorkflowStages>>
): Promise<AppShellOrderStats> {
  const archiveSlug = getArchiveStage(stages).slug;
  const waitingFilesSlug = stages.find((s) => s.slug === "waiting-for-files")?.slug;

  const [active, archived, urgent, waitingFiles] = await Promise.all([
    prisma.order.count({ where: { status: { not: archiveSlug } } }),
    prisma.order.count({ where: { status: archiveSlug } }),
    prisma.order.count({
      where: { priority: "Urgent", status: { not: archiveSlug } },
    }),
    waitingFilesSlug
      ? prisma.order.count({ where: { status: waitingFilesSlug } })
      : Promise.resolve(0),
  ]);

  return { active, archived, urgent, waitingFiles };
}

export async function getAppShellContext() {
  const stages = await getCachedWorkflowStages();
  const orderStats = await getAppShellOrderStats(stages);
  return { stages, orderStats };
}
