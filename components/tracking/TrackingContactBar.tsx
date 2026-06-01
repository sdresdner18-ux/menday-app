import { buildWhatsAppUrl } from "@/lib/messaging";

interface Props {
  customerName: string;
  orderNumber?: string | null;
  projectType: string;
  shopPhone?: string;
}

export default function TrackingContactBar({
  customerName,
  orderNumber,
  projectType,
  shopPhone = "",
}: Props) {
  const phone = shopPhone.trim();
  const ref = orderNumber ? ` (#${orderNumber})` : "";
  const message = `Hi, this is ${customerName}${ref}. I have a question about my ${projectType} order.`;
  const whatsappUrl = phone ? buildWhatsAppUrl(phone, message) : null;

  if (!whatsappUrl) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-10 border-t border-gray-200 bg-white/95 p-4 backdrop-blur">
      <div className="mx-auto max-w-md">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
        >
          Questions? Message us on WhatsApp
        </a>
      </div>
    </div>
  );
}
