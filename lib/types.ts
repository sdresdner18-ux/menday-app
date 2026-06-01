export type Priority = "Low" | "Medium" | "High" | "Urgent";

export type { SerializedWorkflowStage as WorkflowStage } from "@/lib/workflow-shared";
export type { WorkflowStageType } from "@/lib/workflow-shared";

export type ProjectType =
  | "Magnet"
  | "Stand"
  | "Mug"
  | "Keychain"
  | "Other";

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string | null;
  customer?: Customer;
  projectType: string;
  quantity: number | null;
  unitPrice: number | null;
  color: string | null;
  deadline: string | null;
  filesExpected: boolean;
  notes: string | null;
  orderNumber: string | null;
  priority: Priority;
  status: string;
  paymentReceived: boolean;
  paymentReceivedAt: string | null;
  trackingToken: string;
  teamMembers?: TeamMember[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string | null;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParsedOrder {
  customerId?: string | null;
  customerName: string;
  customerPhone: string | null;
  projectType: string;
  quantity: number | null;
  unitPrice: number | null;
  color: string | null;
  deadline: string | null;
  filesExpected: boolean;
  notes: string | null;
  orderNumber: string | null;
  priority: Priority;
}

export const PROJECT_TYPES: ProjectType[] = [
  "Magnet",
  "Stand",
  "Mug",
  "Keychain",
  "Other",
];

export const PRIORITIES: Priority[] = ["Low", "Medium", "High", "Urgent"];

export interface ChecklistItem {
  id: string;
  orderId: string;
  label: string;
  checked: boolean;
  position: number;
}

export interface OrderNote {
  id: string;
  orderId: string;
  content: string;
  createdAt: string;
}

export type MessageDirection = "Outbound" | "Inbound";
export type MessageChannel = "WhatsApp" | "SMS" | "Manual";

export interface OrderMessage {
  id: string;
  orderId: string;
  direction: MessageDirection;
  channel: MessageChannel;
  body: string;
  createdAt: string;
}

export interface StatusHistoryEntry {
  id: string;
  orderId: string;
  statusSlug: string;
  statusLabel: string;
  createdAt: string;
}

export interface OrderSummary {
  id: string;
  customerName: string;
  projectType: string;
  status: string;
  createdAt: string;
}

export interface OrderDetailData {
  order: Order;
  relatedOrders: OrderSummary[];
  checklistItems: ChecklistItem[];
  orderNotes: OrderNote[];
  orderMessages: OrderMessage[];
  statusHistory: StatusHistoryEntry[];
}
