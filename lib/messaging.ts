export type MessageChannel = "WhatsApp" | "SMS" | "Manual";

function phoneDigits(phone: string): string {
  let digits = phone.replace(/\D/g, "");

  if (digits.startsWith("972")) {
    digits = `0${digits.slice(3)}`;
  }

  return digits.slice(0, 10);
}

export function formatPhoneInput(phone: string): string {
  const digits = phoneDigits(phone);
  if (!digits) return "";

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

export function isValidPhone(phone: string): boolean {
  const digits = phoneDigits(phone);
  return digits.length === 10 && digits.startsWith("0");
}

export function normalizePhone(phone: string): string | null {
  const digits = phoneDigits(phone);
  if (digits.length < 9) return null;

  // Israeli local numbers: 0501234567 → 972501234567
  if (digits.startsWith("0")) {
    return `972${digits.slice(1)}`;
  }

  return digits;
}

export function formatPhoneDisplay(phone: string): string {
  const formatted = formatPhoneInput(phone);
  return formatted || phone;
}

export function buildWhatsAppUrl(phone: string, text: string): string | null {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(text)}`;
}

export function buildSmsUrl(phone: string, text: string): string | null {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  return `sms:+${normalized}?body=${encodeURIComponent(text)}`;
}

export function buildMessagePrefix(order: {
  customerName: string;
  orderNumber?: string | null;
  projectType: string;
}): string {
  const ref = order.orderNumber ? ` (#${order.orderNumber})` : "";
  return `Hi ${order.customerName}${ref}, regarding your ${order.projectType} order:\n\n`;
}
