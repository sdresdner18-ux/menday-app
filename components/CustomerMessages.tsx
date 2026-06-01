"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Order, OrderMessage, MessageChannel } from "@/lib/types";
import {
  buildMessagePrefix,
  buildSmsUrl,
  buildWhatsAppUrl,
  formatPhoneDisplay,
  isValidPhone,
} from "@/lib/messaging";
import {
  buildPaymentRequestMessage,
  formatPaymentInstructions,
  hasPaymentLink,
} from "@/lib/payment-shared";
import { buildTrackingMessage, buildTrackingUrl } from "@/lib/tracking-shared";
import type { SerializedShopSettings } from "@/lib/shopSettings-shared";

interface Props {
  orderId: string;
  trackingToken: string;
  order: Pick<
    Order,
    | "customerName"
    | "customerPhone"
    | "orderNumber"
    | "projectType"
    | "unitPrice"
    | "quantity"
  >;
  shopSettings: Pick<SerializedShopSettings, "paymentLink" | "paymentLabel">;
  messages: OrderMessage[];
  onAddPhone?: () => void;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const CHANNEL_LABELS: Record<MessageChannel, string> = {
  WhatsApp: "WhatsApp",
  SMS: "Text",
  Manual: "Logged",
};

export default function CustomerMessages({
  orderId,
  trackingToken,
  order,
  shopSettings,
  messages: initialMessages,
  onAddPhone,
}: Props) {
  const [messages, setMessages] = useState(initialMessages);
  const [compose, setCompose] = useState(() => buildMessagePrefix(order));
  const [reply, setReply] = useState("");
  const [replyChannel, setReplyChannel] = useState<MessageChannel>("WhatsApp");
  const [sending, setSending] = useState(false);
  const [loggingReply, setLoggingReply] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const phone = order.customerPhone?.trim() ?? "";
  const hasPhone = !!phone && isValidPhone(phone);

  const trackingUrl = useMemo(() => {
    if (typeof window === "undefined") return `/track/${trackingToken}`;
    return buildTrackingUrl(window.location.origin, trackingToken);
  }, [trackingToken]);

  const trackingMessage = useMemo(
    () =>
      buildTrackingMessage({
        customerName: order.customerName,
        orderNumber: order.orderNumber,
        projectType: order.projectType,
        trackingUrl,
      }),
    [order.customerName, order.orderNumber, order.projectType, trackingUrl]
  );

  const paymentInstructions = useMemo(
    () => formatPaymentInstructions(shopSettings),
    [shopSettings]
  );

  const paymentMessage = useMemo(() => {
    if (!paymentInstructions) return null;
    return buildPaymentRequestMessage({
      customerName: order.customerName,
      orderNumber: order.orderNumber,
      projectType: order.projectType,
      unitPrice: order.unitPrice,
      quantity: order.quantity,
      paymentInstructions,
    });
  }, [order, paymentInstructions]);

  const canRequestPayment = hasPaymentLink(shopSettings) && !!paymentMessage;

  function goToPhoneField() {
    setError(null);
    onAddPhone?.();
  }

  async function logMessage(
    body: string,
    direction: OrderMessage["direction"],
    channel: OrderMessage["channel"]
  ) {
    const res = await fetch(`/api/orders/${orderId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, direction, channel }),
    });
    if (!res.ok) throw new Error("Failed to log message");
    const message = await res.json();
    setMessages((prev) => [...prev, message]);
    return message;
  }

  async function handleSend(channel: "WhatsApp" | "SMS") {
    const text = compose.trim();
    if (!text) return;
    if (!hasPhone) {
      setError("missing_phone");
      return;
    }

    const url =
      channel === "WhatsApp"
        ? buildWhatsAppUrl(phone, text)
        : buildSmsUrl(phone, text);

    if (!url) {
      setError("Invalid phone number.");
      return;
    }

    setSending(true);
    setError(null);

    try {
      await logMessage(text, "Outbound", channel);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  }

  async function handleSendPaymentRequest(channel: "WhatsApp" | "SMS") {
    if (!paymentMessage) {
      setError("missing_payment_link");
      return;
    }
    if (!hasPhone) {
      setError("missing_phone");
      return;
    }

    const url =
      channel === "WhatsApp"
        ? buildWhatsAppUrl(phone, paymentMessage)
        : buildSmsUrl(phone, paymentMessage);

    if (!url) {
      setError("Invalid phone number.");
      return;
    }

    setSending(true);
    setError(null);

    try {
      await logMessage(paymentMessage, "Outbound", channel);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  }

  async function handleSendTrackingLink(channel: "WhatsApp" | "SMS") {
    if (!hasPhone) {
      setError("missing_phone");
      return;
    }

    const url =
      channel === "WhatsApp"
        ? buildWhatsAppUrl(phone, trackingMessage)
        : buildSmsUrl(phone, trackingMessage);

    if (!url) {
      setError("Invalid phone number.");
      return;
    }

    setSending(true);
    setError(null);

    try {
      await logMessage(trackingMessage, "Outbound", channel);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSending(false);
    }
  }

  async function handleLogReply() {
    if (!reply.trim()) return;
    setLoggingReply(true);
    setError(null);

    try {
      await logMessage(reply.trim(), "Inbound", replyChannel);
      setReply("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoggingReply(false);
    }
  }

  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="section-title mb-1">Customer Messages</h3>
          <p className="text-xs text-muted">
            Send via WhatsApp or text — replies stay on this order
          </p>
        </div>
        {phone ? (
          <span className="rounded-xl px-3 py-1.5 text-xs font-semibold text-muted" style={{ background: "var(--dm-inset)", border: "1px solid var(--dm-border)" }}>
            {formatPhoneDisplay(phone)}
          </span>
        ) : (
          <button
            type="button"
            onClick={goToPhoneField}
            className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-700 transition-colors hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-violet-600 dark:text-amber-300 dark:hover:text-violet-300"
          >
            No phone — add one
          </button>
        )}
      </div>

      {messages.length > 0 && (
        <ul className="mb-5 max-h-72 space-y-3 overflow-y-auto pr-1">
          {messages.map((msg) => {
            const outbound = msg.direction === "Outbound";
            return (
              <li
                key={msg.id}
                className={`flex ${outbound ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    outbound
                      ? "rounded-br-md bg-violet-600/75 text-white shadow-glass-sm"
                      : "rounded-bl-md border border-violet-500/10 bg-violet-500/[0.07]"
                  }`}
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wide ${
                        outbound ? "text-violet-100" : "text-muted"
                      }`}
                    >
                      {outbound ? "You" : order.customerName}
                    </span>
                    <span
                      className={`text-[10px] font-semibold ${
                        outbound ? "text-violet-200/80" : "text-muted"
                      }`}
                    >
                      · {CHANNEL_LABELS[msg.channel]}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{msg.body}</p>
                  <p
                    className={`mt-2 text-[10px] font-semibold ${
                      outbound ? "text-violet-200/60" : "text-muted"
                    }`}
                  >
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="space-y-4 border-t pt-4" style={{ borderColor: "var(--dm-border)" }}>
        <div>
          <label className="label-field mb-2 block">Quick actions</label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleSendPaymentRequest("WhatsApp")}
              disabled={sending || !canRequestPayment}
              className="btn-primary"
            >
              Request payment (WhatsApp)
            </button>
            <button
              type="button"
              onClick={() => handleSendPaymentRequest("SMS")}
              disabled={sending || !canRequestPayment}
              className="btn-secondary"
            >
              Request payment (Text)
            </button>
            <button
              type="button"
              onClick={() => handleSendTrackingLink("WhatsApp")}
              disabled={sending}
              className="btn-secondary"
            >
              Send tracking link (WhatsApp)
            </button>
            <button
              type="button"
              onClick={() => handleSendTrackingLink("SMS")}
              disabled={sending}
              className="btn-secondary"
            >
              Send tracking link (Text)
            </button>
          </div>
          {!canRequestPayment ? (
            <p className="mt-2 text-xs text-muted">
              <Link
                href="/settings/shop"
                className="font-semibold text-violet-600 underline decoration-violet-500/40 underline-offset-2 transition-colors hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300"
              >
                Add a payment link
              </Link>{" "}
              in Shop settings to enable one-tap payment requests.
            </p>
          ) : null}
        </div>

        <div>
          <label className="label-field mb-2 block">Message to customer</label>
          <textarea
            value={compose}
            onChange={(e) => setCompose(e.target.value)}
            rows={4}
            placeholder="Type your question..."
            className="input-field resize-none"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleSend("WhatsApp")}
              disabled={sending || !compose.trim()}
              className="btn-primary"
            >
              {sending ? "Sending..." : "Send via WhatsApp"}
            </button>
            <button
              type="button"
              onClick={() => handleSend("SMS")}
              disabled={sending || !compose.trim()}
              className="btn-secondary"
            >
              Send via Text
            </button>
          </div>
        </div>

        <div>
          <label className="label-field mb-2 block">Log customer reply</label>
          <p className="mb-2 text-xs text-muted">
            Paste what they replied on WhatsApp or text
          </p>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={3}
            placeholder="Paste customer reply here..."
            className="input-field resize-none"
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <select
              value={replyChannel}
              onChange={(e) => setReplyChannel(e.target.value as MessageChannel)}
              className="input-field w-auto min-w-[140px] py-2"
            >
              <option value="WhatsApp">WhatsApp</option>
              <option value="SMS">Text</option>
              <option value="Manual">Other</option>
            </select>
            <button
              type="button"
              onClick={handleLogReply}
              disabled={loggingReply || !reply.trim()}
              className="btn-secondary"
            >
              {loggingReply ? "Saving..." : "Log Reply"}
            </button>
          </div>
        </div>

        {error === "missing_phone" ? (
          <p className="text-sm text-amber-700 dark:text-amber-300">
            <button
              type="button"
              onClick={goToPhoneField}
              className="font-semibold text-violet-600 underline decoration-violet-500/40 underline-offset-2 transition-colors hover:text-violet-500 dark:text-violet-400 dark:hover:text-violet-300"
            >
              Add a customer phone number
            </button>{" "}
            on this order first.
          </p>
        ) : error ? (
          <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
        ) : null}
      </div>
    </div>
  );
}
