export type MessageChannel = "WhatsApp" | "SMS" | "Manual";

/** Strip to up to 10 NANP digits (US/Canada). */
export function phoneDigits(phone: string): string {
  let digits = phone.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("1")) {
    digits = digits.slice(1);
  }

  return digits.slice(0, 10);
}

export function formatPhoneInput(phone: string): string {
  const digits = phoneDigits(phone);
  if (!digits) return "";

  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function isValidNanp(digits: string): boolean {
  if (digits.length !== 10) return false;
  const areaCode = digits.slice(0, 3);
  const exchange = digits.slice(3, 6);
  return !/^[01]/.test(areaCode) && !/^[01]/.test(exchange);
}

export function isValidPhone(phone: string): boolean {
  return isValidNanp(phoneDigits(phone));
}

/** E.164 digits without "+" for wa.me / sms: links (e.g. 15551234567). */
export function normalizePhone(phone: string): string | null {
  const digits = phoneDigits(phone);
  if (!isValidNanp(digits)) return null;
  return `1${digits}`;
}

export function formatPhoneDisplay(phone: string): string {
  const digits = phoneDigits(phone);
  if (!digits) return phone;
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
