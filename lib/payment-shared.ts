/** Client-safe payment request helpers (no Prisma / database). */

import { formatMoney, lineAmount } from "./currency";
import type { SerializedShopSettings } from "./shopSettings-shared";

export function hasPaymentLink(
  settings: Pick<SerializedShopSettings, "paymentLink">
): boolean {
  return !!settings.paymentLink?.trim();
}

export function formatPaymentInstructions(
  settings: Pick<SerializedShopSettings, "paymentLink" | "paymentLabel">
): string | null {
  const link = settings.paymentLink?.trim();
  if (!link) return null;

  const label = settings.paymentLabel?.trim();
  if (label) return `${label}: ${link}`;
  return link;
}

export function buildPaymentRequestMessage(order: {
  customerName: string;
  orderNumber?: string | null;
  projectType: string;
  unitPrice?: number | null;
  quantity?: number | null;
  paymentInstructions: string;
}): string {
  const ref = order.orderNumber ? ` (#${order.orderNumber})` : "";
  const total = lineAmount(order.unitPrice, order.quantity);
  const totalLine =
    total != null
      ? `Your total is ${formatMoney(total)}.\n\n`
      : "";

  return (
    `Hi ${order.customerName}${ref}, regarding your ${order.projectType} order:\n\n` +
    totalLine +
    `Pay here:\n${order.paymentInstructions}\n\n` +
    `Thank you!`
  );
}
