"use client";

import { useRef, useState } from "react";
import { Order } from "@/lib/types";
import {
  buildWhatsAppUrl,
  formatPhoneDisplay,
  isValidPhone,
} from "@/lib/messaging";
import {
  downloadPdfBlob,
  generateInvoicePdf,
  invoiceFilename,
  sharePdfBlob,
} from "@/lib/generateInvoicePdf";
import { formatMoney, lineAmount } from "@/lib/currency";

interface Props {
  order: Order;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function lineDescription(order: Order) {
  const parts = [order.projectType];
  if (order.color?.trim()) parts.push(order.color.trim());
  return parts.join(" — ");
}

export default function OrderInvoice({ order }: Props) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const invoiceNumber = order.orderNumber ?? order.id.slice(-8).toUpperCase();
  const filename = invoiceFilename(invoiceNumber);
  const shareTitle = `Invoice #${invoiceNumber} — ${order.customerName}`;
  const shareMessage = `Hi ${order.customerName}, please find attached invoice #${invoiceNumber} for ${lineDescription(order)}.`;
  const canWhatsApp =
    !!order.customerPhone && isValidPhone(order.customerPhone);
  const total = lineAmount(order.unitPrice, order.quantity);

  async function createPdf() {
    const element = invoiceRef.current;
    if (!element) throw new Error("Invoice not ready");
    return generateInvoicePdf(element);
  }

  async function handleDownloadPdf() {
    setGenerating(true);
    setStatus(null);
    try {
      const blob = await createPdf();
      downloadPdfBlob(blob, filename);
      setStatus("PDF downloaded — attach it in email, WhatsApp, or text.");
    } catch {
      setStatus("Could not create PDF. Try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSharePdf() {
    setGenerating(true);
    setStatus(null);
    try {
      const blob = await createPdf();
      const shared = await sharePdfBlob(blob, filename, shareTitle);
      if (shared) {
        setStatus("Choose WhatsApp, email, or another app to send the invoice.");
      } else {
        downloadPdfBlob(blob, filename);
        setStatus("PDF downloaded — your browser cannot share files directly.");
      }
    } catch {
      setStatus("Could not share invoice. Try downloading instead.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleWhatsAppPdf() {
    if (!order.customerPhone || !canWhatsApp) return;

    setGenerating(true);
    setStatus(null);
    try {
      const blob = await createPdf();
      const shared = await sharePdfBlob(blob, filename, shareTitle);

      if (!shared) {
        downloadPdfBlob(blob, filename);
      }

      const url = buildWhatsAppUrl(order.customerPhone, shareMessage);
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      }

      setStatus(
        shared
          ? "Pick WhatsApp and attach the invoice PDF."
          : "PDF downloaded — attach it in the WhatsApp chat that just opened."
      );
    } catch {
      setStatus("Could not prepare invoice for WhatsApp.");
    } finally {
      setGenerating(false);
    }
  }

  function handleEmailPdf() {
    const subject = encodeURIComponent(
      `Invoice #${invoiceNumber} — ${order.customerName}`
    );
    const body = encodeURIComponent(
      `${shareMessage}\n\nPlease attach the PDF invoice from your downloads folder.`
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setStatus("Email opened — attach the PDF after downloading it.");
  }

  async function handleDownloadThenEmail() {
    await handleDownloadPdf();
    handleEmailPdf();
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-4">
      <div className="glass-card p-5 print:hidden">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold">Invoice</h2>
            <p className="mt-1 text-sm text-muted">
              Download a PDF ready to email, WhatsApp, or text
            </p>
          </div>
          <button
            onClick={handleDownloadPdf}
            disabled={generating}
            className="btn-primary"
          >
            {generating ? "Creating PDF..." : "Download PDF invoice"}
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={handleSharePdf}
            disabled={generating}
            className="btn-secondary text-xs"
          >
            Share invoice
          </button>
          {canWhatsApp && (
            <button
              onClick={handleWhatsAppPdf}
              disabled={generating}
              className="btn-secondary text-xs"
            >
              Send via WhatsApp
            </button>
          )}
          <button
            onClick={handleDownloadThenEmail}
            disabled={generating}
            className="btn-secondary text-xs"
          >
            Email invoice
          </button>
          <button
            onClick={handlePrint}
            disabled={generating}
            className="btn-secondary text-xs"
          >
            Print
          </button>
        </div>

        {status && (
          <p className="mt-3 rounded-xl border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-sm text-violet-700 dark:text-violet-200">
            {status}
          </p>
        )}
      </div>

      <div
        ref={invoiceRef}
        id="order-invoice"
        className="invoice-document mx-auto max-w-[820px] rounded-lg border border-gray-200 bg-white p-10 text-gray-900 shadow-sm print:shadow-none"
      >
        <div className="flex flex-wrap items-start justify-between gap-8 border-b border-gray-200 pb-8">
          <div>
            <p className="text-2xl font-bold tracking-tight text-gray-900">
              Mendy<span className="text-violet-600">.</span>
            </p>
            <p className="mt-1 text-sm text-gray-500">Custom manufacturing</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold tracking-tight text-gray-900">
              INVOICE
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Bill to
            </p>
            <p className="mt-2 text-lg font-semibold text-gray-900">
              {order.customerName}
            </p>
            {order.customerPhone && (
              <p className="mt-1 text-sm text-gray-600">
                {formatPhoneDisplay(order.customerPhone)}
              </p>
            )}
          </div>
          <div className="sm:text-right">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-8 sm:block">
                <dt className="font-semibold text-gray-500">Invoice number</dt>
                <dd className="font-semibold text-gray-900">{invoiceNumber}</dd>
              </div>
              <div className="flex justify-between gap-8 sm:block">
                <dt className="font-semibold text-gray-500">Invoice date</dt>
                <dd className="text-gray-900">{formatDate(order.createdAt)}</dd>
              </div>
              <div className="flex justify-between gap-8 sm:block">
                <dt className="font-semibold text-gray-500">Due date</dt>
                <dd className="text-gray-900">{formatDate(order.deadline)}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-md border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Unit price</th>
                <th className="px-4 py-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-200">
                <td className="px-4 py-4 align-top text-gray-900">
                  {lineDescription(order)}
                </td>
                <td className="px-4 py-4 text-right align-top text-gray-900">
                  {order.quantity ?? "—"}
                </td>
                <td className="px-4 py-4 text-right align-top text-gray-900">
                  {formatMoney(order.unitPrice)}
                </td>
                <td className="px-4 py-4 text-right align-top font-semibold text-gray-900">
                  {formatMoney(total)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-end">
          <div className="w-full max-w-xs space-y-2 border-t border-gray-200 pt-4 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>{formatMoney(total)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold text-gray-900">
              <span>Total due</span>
              <span>{formatMoney(total)}</span>
            </div>
          </div>
        </div>

        {order.notes && (
          <div className="mt-8 border-t border-gray-200 pt-6">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
              Notes
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
              {order.notes}
            </p>
          </div>
        )}

        <div className="mt-8 border-t border-gray-200 pt-6">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
            Payment terms
          </p>
          <p className="mt-2 text-sm text-gray-600">
            Payment due by {formatDate(order.deadline)} unless otherwise agreed.
          </p>
          <p className="mt-6 text-sm text-gray-500">
            Thank you for your business.
          </p>
        </div>
      </div>
    </div>
  );
}
