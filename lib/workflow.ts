import "server-only";

import { WorkflowStage } from "@prisma/client";
import { prisma } from "./prisma";
import {
  DEFAULT_WORKFLOW_STAGES,
  LEGACY_DEFAULT_STAGE_LABELS,
  SerializedWorkflowStage,
} from "./workflow-shared";

export type { WorkflowStage, WorkflowStageType };
export type { SerializedWorkflowStage };
export {
  LEGACY_STATUS_TO_SLUG,
  LEGACY_DEFAULT_STAGE_LABELS,
  DEFAULT_WORKFLOW_STAGES,
  STAGE_COLOR_PALETTE,
  slugifyStageLabel,
  getStageBySlug,
  getStageLabel,
  getArchiveStage,
  getPaymentStage,
  getDefaultStage,
  getActiveBoardStages,
  getBoardColumnStages,
  getCreateOrderStages,
  normalizeStatusSlug,
  STAGE_COLOR_HEX,
  getStageColorHex,
  getStageDotStyle,
  getStageBadgeStyle,
  getStageColumnStyle,
} from "./workflow-shared";

export function serializeWorkflowStage(
  stage: WorkflowStage
): SerializedWorkflowStage {
  return {
    id: stage.id,
    slug: stage.slug,
    label: stage.label,
    position: stage.position,
    stageType: stage.stageType,
    color: stage.color,
  };
}

export async function ensureWorkflowStages(): Promise<SerializedWorkflowStage[]> {
  const existing = await prisma.workflowStage.findMany();

  if (existing.length === 0) {
    await prisma.workflowStage.createMany({
      data: DEFAULT_WORKFLOW_STAGES,
    });
    return getWorkflowStages();
  }

  const existingBySlug = new Map(existing.map((stage) => [stage.slug, stage]));

  for (const defaults of DEFAULT_WORKFLOW_STAGES) {
    const current = existingBySlug.get(defaults.slug);

    if (!current) {
      await prisma.workflowStage.create({ data: defaults });
      continue;
    }

    const legacyLabel = LEGACY_DEFAULT_STAGE_LABELS[defaults.slug];
    const labelStillDefault =
      current.label === defaults.label ||
      (legacyLabel !== undefined && current.label === legacyLabel);

    if (!labelStillDefault) continue;

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
    }
  }

  return getWorkflowStages();
}

export async function getWorkflowStages(): Promise<SerializedWorkflowStage[]> {
  const stages = await prisma.workflowStage.findMany({
    orderBy: { position: "asc" },
  });
  return stages.map(serializeWorkflowStage);
}
