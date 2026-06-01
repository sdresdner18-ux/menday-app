"use client";

import { WorkflowStage } from "@/lib/types";
import { getStageBadgeStyle, getStageBySlug, getStageLabel } from "@/lib/workflow";

interface Props {
  status: string;
  stages?: WorkflowStage[];
  label?: string;
}

export default function StatusBadge({ status, stages = [], label }: Props) {
  const stage = getStageBySlug(stages, status);
  const displayLabel = label ?? stage?.label ?? getStageLabel(stages, status);
  const color = stage?.color ?? "zinc";

  return (
    <span
      className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
      style={getStageBadgeStyle(color)}
    >
      {displayLabel}
    </span>
  );
}
