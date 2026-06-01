"use client";

import { useMemo, useState } from "react";
import { buildTrackingMessage, buildTrackingUrl } from "@/lib/tracking-shared";
import { buildSmsUrl, buildWhatsAppUrl, isValidPhone } from "@/lib/messaging";

interface Props {
  trackingToken: string;
  customerName: string;
  customerPhone: string | null;
  orderNumber: string | null;
  projectType: string;
}

export default function TrackingLinkCard({
  trackingToken,
  customerName,
  customerPhone,
  orderNumber,
  projectType,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  const trackingUrl = useMemo(() => {
    if (typeof window === "undefined") return `/track/${trackingToken}`;
    return buildTrackingUrl(window.location.origin, trackingToken);
  }, [trackingToken]);

  const shareMessage = useMemo(
    () =>
      buildTrackingMessage({
        customerName,
        orderNumber,
        projectType,
        trackingUrl,
      }),
    [customerName, orderNumber, projectType, trackingUrl]
  );

  const phone = customerPhone?.trim() ?? "";
  const hasPhone = !!phone && isValidPhone(phone);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(trackingUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setShareStatus("Could not copy link.");
    }
  }

  async function handleNativeShare() {
    if (!navigator.share) return;

    try {
      await navigator.share({
        title: "Track your order",
        text: shareMessage,
        url: trackingUrl,
      });
      setShareStatus("Shared.");
    } catch {
      // User cancelled share sheet.
    }
  }

  function openWhatsApp() {
    if (!hasPhone) {
      setShareStatus("Add a customer phone number first.");
      return;
    }

    const url = buildWhatsAppUrl(phone, shareMessage);
    if (!url) {
      setShareStatus("Invalid phone number.");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  }

  function openSms() {
    if (!hasPhone) {
      setShareStatus("Add a customer phone number first.");
      return;
    }

    const url = buildSmsUrl(phone, shareMessage);
    if (!url) {
      setShareStatus("Invalid phone number.");
      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="glass-card p-5">
      <div className="mb-4">
        <h3 className="section-title mb-1">Customer Tracking Link</h3>
        <p className="text-xs text-muted">
          Send once — customers can check status anytime with their phone digits
        </p>
      </div>

      <div
        className="rounded-xl border px-4 py-3 text-sm font-semibold text-gray-700 dark:text-[var(--dm-text)]"
        style={{
          borderColor: "var(--dm-border)",
          background: "var(--dm-inset)",
          wordBreak: "break-all",
        }}
      >
        {trackingUrl}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => void handleCopy()} className="btn-primary">
          {copied ? "Copied!" : "Copy link"}
        </button>
        <button type="button" onClick={openWhatsApp} className="btn-secondary">
          Share via WhatsApp
        </button>
        <button type="button" onClick={openSms} className="btn-secondary">
          Share via Text
        </button>
        {typeof navigator !== "undefined" && "share" in navigator ? (
          <button
            type="button"
            onClick={() => void handleNativeShare()}
            className="btn-secondary"
          >
            Share...
          </button>
        ) : null}
      </div>

      {shareStatus ? (
        <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">{shareStatus}</p>
      ) : null}
    </div>
  );
}
