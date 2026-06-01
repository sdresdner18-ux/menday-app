/** Client-safe tracking helpers (no Prisma / database). */

import {
  getStageBySlug,
  getStageColorHex,
  SerializedWorkflowStage,
} from "./workflow-shared";

export interface CustomerStatusCopy {
  headline: string;
  description: string;
  actionNeeded: boolean;
  actionMessage?: string;
}

export interface TrackingStepperStep {
  id: string;
  label: string;
  position: number;
}

export const TRACKING_STEPPER_STEPS: TrackingStepperStep[] = [
  { id: "received", label: "Received", position: 0 },
  { id: "production", label: "In production", position: 1 },
  { id: "ready", label: "Ready", position: 2 },
  { id: "complete", label: "Complete", position: 3 },
];

const DEFAULT_STATUS_COPY: Record<string, CustomerStatusCopy> = {
  new: {
    headline: "Order received",
    description: "We've got your order and will review it shortly.",
    actionNeeded: false,
  },
  "needs-clarification": {
    headline: "Quick question",
    description: "We need a bit more info to move forward.",
    actionNeeded: true,
    actionMessage: "Please message us with the details we asked for.",
  },
  "waiting-for-files": {
    headline: "Files received",
    description: "We have your files and will begin production soon.",
    actionNeeded: false,
  },
  "in-progress": {
    headline: "In production",
    description: "Your order is being made right now.",
    actionNeeded: false,
  },
  finishing: {
    headline: "Finishing up",
    description: "We're putting the final touches on your order.",
    actionNeeded: false,
  },
  packed: {
    headline: "Ready / packed",
    description: "Your order is packed and nearly ready.",
    actionNeeded: false,
  },
  "awaiting-payment": {
    headline: "Final step",
    description: "We're finishing up — we'll be in touch soon.",
    actionNeeded: false,
  },
  completed: {
    headline: "Complete",
    description: "Your order is ready. Thank you!",
    actionNeeded: false,
  },
};

const STEPPER_SLUG_MAP: Record<string, string> = {
  new: "received",
  "needs-clarification": "production",
  "waiting-for-files": "production",
  "in-progress": "production",
  finishing: "production",
  packed: "ready",
  "awaiting-payment": "ready",
  completed: "complete",
};

export function getCustomerStatusCopy(
  statusSlug: string,
  stages: SerializedWorkflowStage[]
): CustomerStatusCopy {
  const mapped = DEFAULT_STATUS_COPY[statusSlug];
  if (mapped) return mapped;

  const stage = getStageBySlug(stages, statusSlug);
  return {
    headline: stage?.label ?? statusSlug,
    description: "We're working on your order.",
    actionNeeded: false,
  };
}

export function getStepperStepId(statusSlug: string): string {
  return STEPPER_SLUG_MAP[statusSlug] ?? "production";
}

export function getStepperStepIndex(statusSlug: string): number {
  const stepId = getStepperStepId(statusSlug);
  return TRACKING_STEPPER_STEPS.findIndex((step) => step.id === stepId);
}

export function getStatusColor(
  statusSlug: string,
  stages: SerializedWorkflowStage[]
): string {
  const stage = getStageBySlug(stages, statusSlug);
  return getStageColorHex(stage?.color ?? "zinc");
}

export interface PublicStatusHistoryEntry {
  id: string;
  headline: string;
  createdAt: string;
}

export interface PublicTrackingStatus {
  slug: string;
  headline: string;
  description: string;
  color: string;
  actionNeeded: boolean;
  actionMessage?: string;
  stepperStepId: string;
}

export interface PublicTrackingOrder {
  orderNumber: string | null;
  projectType: string;
  color: string | null;
  deadline: string | null;
  filesExpected: boolean;
  customerName: string;
  hasPhone: boolean;
  lastUpdatedAt: string;
  currentStatus: PublicTrackingStatus;
  statusHistory: PublicStatusHistoryEntry[];
}

export function buildTrackingUrl(origin: string, trackingToken: string): string {
  const base = origin.replace(/\/$/, "");
  return `${base}/track/${trackingToken}`;
}

export function buildTrackingMessage(order: {
  customerName: string;
  orderNumber?: string | null;
  projectType: string;
  trackingUrl: string;
}): string {
  const ref = order.orderNumber ? ` (#${order.orderNumber})` : "";
  return (
    `Hi ${order.customerName}${ref}, regarding your ${order.projectType} order:\n\n` +
    `Track your order anytime here:\n${order.trackingUrl}\n\n` +
    `You'll need the last 4 digits of your phone number to view it.`
  );
}

export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) {
    return diffMinutes === 1 ? "1 minute ago" : `${diffMinutes} minutes ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatTrackingDeadline(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
