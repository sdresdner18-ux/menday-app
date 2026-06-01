/** Client-safe workflow helpers (no Prisma / database). */

export type WorkflowStageType = "Normal" | "Payment" | "Archive";

export interface SerializedWorkflowStage {
  id: string;
  slug: string;
  label: string;
  position: number;
  stageType: WorkflowStageType;
  color: string;
}

export const LEGACY_STATUS_TO_SLUG: Record<string, string> = {
  New: "new",
  NeedsClarification: "needs-clarification",
  WaitingForFiles: "waiting-for-files",
  InProgress: "in-progress",
  Printing: "in-progress",
  Packed: "packed",
  AwaitingPayment: "awaiting-payment",
  Completed: "completed",
};

export const DEFAULT_WORKFLOW_STAGES: Omit<
  SerializedWorkflowStage,
  "id"
>[] = [
  {
    slug: "new",
    label: "New",
    position: 0,
    stageType: "Normal",
    color: "zinc",
  },
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
  {
    slug: "packed",
    label: "Packed",
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

export const STAGE_COLOR_PALETTE = [
  "zinc",
  "amber",
  "yellow",
  "blue",
  "teal",
  "orange",
  "emerald",
  "violet",
  "rose",
  "cyan",
  "indigo",
  "pink",
] as const;

export function slugifyStageLabel(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "stage";
}

export function getStageBySlug(
  stages: SerializedWorkflowStage[],
  slug: string
): SerializedWorkflowStage | undefined {
  return stages.find((s) => s.slug === slug);
}

export function getStageLabel(
  stages: SerializedWorkflowStage[],
  slug: string
): string {
  return getStageBySlug(stages, slug)?.label ?? slug;
}

const FALLBACK_ARCHIVE_STAGE: SerializedWorkflowStage = {
  id: "fallback-archive",
  slug: "completed",
  label: "Completed",
  position: 999,
  stageType: "Archive",
  color: "emerald",
};

export function getArchiveStage(
  stages: SerializedWorkflowStage[]
): SerializedWorkflowStage {
  return (
    stages.find((s) => s.stageType === "Archive") ??
    stages[stages.length - 1] ??
    FALLBACK_ARCHIVE_STAGE
  );
}

export function getPaymentStage(
  stages: SerializedWorkflowStage[]
): SerializedWorkflowStage | undefined {
  return stages.find((s) => s.stageType === "Payment");
}

export function getDefaultStage(
  stages: SerializedWorkflowStage[]
): SerializedWorkflowStage {
  return (
    stages.find((s) => s.slug === "new") ??
    stages[0] ?? {
      id: "fallback-new",
      slug: "new",
      label: "New",
      position: 0,
      stageType: "Normal",
      color: "zinc",
    }
  );
}

export function getActiveBoardStages(
  stages: SerializedWorkflowStage[]
): SerializedWorkflowStage[] {
  return stages.filter((s) => s.stageType !== "Archive");
}

export function getBoardColumnStages(
  stages: SerializedWorkflowStage[]
): SerializedWorkflowStage[] {
  return [...stages].sort((a, b) => a.position - b.position);
}

export function getCreateOrderStages(
  stages: SerializedWorkflowStage[]
): SerializedWorkflowStage[] {
  return stages.filter(
    (s) =>
      s.stageType === "Normal" &&
      s.slug !== getArchiveStage(stages).slug &&
      s.slug !== getPaymentStage(stages)?.slug
  );
}

export function normalizeStatusSlug(
  status: string,
  stages: SerializedWorkflowStage[]
): string {
  if (stages.some((s) => s.slug === status)) return status;
  const legacy = LEGACY_STATUS_TO_SLUG[status];
  if (legacy && stages.some((s) => s.slug === legacy)) return legacy;
  return getDefaultStage(stages).slug;
}

export const STAGE_COLOR_HEX: Record<string, string> = {
  zinc: "#71717a",
  amber: "#f59e0b",
  yellow: "#eab308",
  blue: "#3b82f6",
  teal: "#14b8a6",
  orange: "#f97316",
  emerald: "#10b981",
  violet: "#8b5cf6",
  rose: "#f43f5e",
  cyan: "#06b6d4",
  indigo: "#6366f1",
  pink: "#ec4899",
};

export function getStageColorHex(color: string): string {
  return STAGE_COLOR_HEX[color] ?? STAGE_COLOR_HEX.zinc;
}

export function getStageDotStyle(color: string): { backgroundColor: string } {
  return { backgroundColor: getStageColorHex(color) };
}

export function getStageBadgeStyle(color: string): {
  backgroundColor: string;
  color: string;
  borderColor: string;
} {
  const hex = getStageColorHex(color);
  return {
    backgroundColor: `color-mix(in srgb, ${hex} 14%, transparent)`,
    color: hex,
    borderColor: `color-mix(in srgb, ${hex} 30%, transparent)`,
  };
}

export function getStageColumnStyle(color: string): {
  borderTopColor: string;
} {
  return { borderTopColor: getStageColorHex(color) };
}
