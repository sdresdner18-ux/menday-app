import { Order, StatusHistory } from "@prisma/client";
import { isValidPhone, phoneDigits } from "./messaging";
import {
  getCustomerStatusCopy,
  getStatusColor,
  getStepperStepId,
  PublicStatusHistoryEntry,
  PublicTrackingOrder,
} from "./tracking-shared";
import { SerializedWorkflowStage } from "./workflow-shared";

type OrderWithHistory = Order & { statusHistory: StatusHistory[] };

export function orderHasVerifiablePhone(phone: string | null | undefined): boolean {
  return isValidPhone(phone ?? "");
}

export function verifyPhoneLastFour(
  phone: string | null | undefined,
  lastFour: string
): boolean {
  const digits = phoneDigits(phone ?? "");
  const input = lastFour.replace(/\D/g, "").slice(-4);
  if (input.length !== 4 || digits.length < 4) return false;
  return digits.slice(-4) === input;
}

export function serializePublicTrackingOrder(
  order: OrderWithHistory,
  stages: SerializedWorkflowStage[]
): PublicTrackingOrder {
  const copy = getCustomerStatusCopy(order.status, stages);

  const statusHistory: PublicStatusHistoryEntry[] = order.statusHistory.map(
    (entry) => {
      const entryCopy = getCustomerStatusCopy(entry.statusSlug, stages);
      return {
        id: entry.id,
        headline: entryCopy.headline,
        createdAt: entry.createdAt.toISOString(),
      };
    }
  );

  return {
    orderNumber: order.orderNumber,
    projectType: order.projectType,
    color: order.color,
    deadline: order.deadline ? order.deadline.toISOString() : null,
    filesExpected: order.filesExpected,
    customerName: order.customerName,
    hasPhone: orderHasVerifiablePhone(order.customerPhone),
    lastUpdatedAt: order.updatedAt.toISOString(),
    currentStatus: {
      slug: order.status,
      headline: copy.headline,
      description: copy.description,
      color: getStatusColor(order.status, stages),
      actionNeeded: copy.actionNeeded,
      actionMessage: copy.actionMessage,
      stepperStepId: getStepperStepId(order.status),
    },
    statusHistory,
  };
}
