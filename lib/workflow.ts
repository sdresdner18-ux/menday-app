import "server-only";

import { WorkflowStage } from "@prisma/client";
import { prisma } from "./prisma";
import {
  DEFAULT_WORKFLOW_STAGES,
  SerializedWorkflowStage,
} from "./workflow-shared";

export type { WorkflowStage, WorkflowStageType };
export type { SerializedWorkflowStage };
export {
  LEGACY_STATUS_TO_SLUG,
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
  const count = await prisma.workflowStage.count();
  if (count === 0) {
    await prisma.workflowStage.createMany({
      data: DEFAULT_WORKFLOW_STAGES,
    });
  }
  return getWorkflowStages();
}

export async function getWorkflowStages(): Promise<SerializedWorkflowStage[]> {
  const stages = await prisma.workflowStage.findMany({
    orderBy: { position: "asc" },
  });
  return stages.map(serializeWorkflowStage);
}
