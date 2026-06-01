"use client";

import { useCallback, useEffect, useState } from "react";
import { PublicTrackingOrder } from "@/lib/tracking-shared";
import TrackingVerifyGate from "@/components/tracking/TrackingVerifyGate";
import TrackingHeroStatus from "@/components/tracking/TrackingHeroStatus";
import TrackingProgressStepper from "@/components/tracking/TrackingProgressStepper";
import TrackingActionCallout from "@/components/tracking/TrackingActionCallout";
import PublicStatusTimeline from "@/components/tracking/PublicStatusTimeline";
import TrackingOrderSummary from "@/components/tracking/TrackingOrderSummary";
import TrackingContactBar from "@/components/tracking/TrackingContactBar";
import ShopBrandMark from "@/components/ShopBrandMark";
import { buildWhatsAppUrl } from "@/lib/messaging";
import type { PublicShopSettings } from "@/lib/shopSettings-shared";

interface Props {
  token: string;
}

type PageState =
  | { kind: "loading" }
  | { kind: "not_found" }
  | { kind: "no_phone" }
  | { kind: "verify"; hasPhone: true }
  | { kind: "ready"; order: PublicTrackingOrder };

export default function TrackingPageClient({ token }: Props) {
  const [state, setState] = useState<PageState>({ kind: "loading" });
  const [shop, setShop] = useState<PublicShopSettings | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/shop/public", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setShop(data as PublicShopSettings);
      })
      .catch(() => undefined);
  }, []);

  const loadOrder = useCallback(async () => {
    setState({ kind: "loading" });
    setVerifyError(null);

    try {
      const res = await fetch(`/api/track/${token}`, { cache: "no-store" });
      const data = await res.json();

      if (res.status === 404 || data.error === "not_found") {
        setState({ kind: "not_found" });
        return;
      }

      if (!res.ok) {
        setState({ kind: "not_found" });
        return;
      }

      if (data.verified && data.order) {
        setState({ kind: "ready", order: data.order });
        return;
      }

      if (data.hasPhone === false) {
        setState({ kind: "no_phone" });
        return;
      }

      setState({ kind: "verify", hasPhone: true });
    } catch {
      setState({ kind: "not_found" });
    }
  }, [token]);

  useEffect(() => {
    void loadOrder();
  }, [loadOrder]);

  async function handleVerify(lastFour: string) {
    setVerifyLoading(true);
    setVerifyError(null);

    try {
      const res = await fetch(`/api/track/${token}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lastFour }),
      });
      const data = await res.json();

      if (!res.ok) {
        setVerifyError(data.error ?? "That didn't match — try again.");
        return;
      }

      await loadOrder();
    } catch {
      setVerifyError("Something went wrong. Please try again.");
    } finally {
      setVerifyLoading(false);
    }
  }

  const shopPhone = shop?.phone?.trim() ?? "";
  const fallbackWhatsApp = shopPhone
    ? buildWhatsAppUrl(shopPhone, "Hi, I need help with my order tracking link.")
    : null;
  const brandSettings = {
    businessName: shop?.businessName ?? "Mendy",
    tagline: shop?.tagline ?? "Track your order",
    logoDataUrl: shop?.logoDataUrl ?? null,
  };

  return (
    <div className="pb-28">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-md px-4 py-4">
          <ShopBrandMark settings={brandSettings} size="sm" />
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-4 px-4 py-6">
        {state.kind === "loading" ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-semibold text-gray-500">Loading your order...</p>
          </div>
        ) : null}

        {state.kind === "not_found" ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-extrabold text-gray-900">
              This link isn&apos;t valid
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Contact us if you need help finding your order status.
            </p>
            {fallbackWhatsApp ? (
              <a
                href={fallbackWhatsApp}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white"
              >
                Message us on WhatsApp
              </a>
            ) : null}
          </div>
        ) : null}

        {state.kind === "no_phone" ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-extrabold text-gray-900">
              We need to verify your order
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              We don&apos;t have a phone number on file for this order. Please contact
              us directly and we&apos;ll help you track it.
            </p>
            {fallbackWhatsApp ? (
              <a
                href={fallbackWhatsApp}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white"
              >
                Message us on WhatsApp
              </a>
            ) : null}
          </div>
        ) : null}

        {state.kind === "verify" ? (
          <TrackingVerifyGate
            onVerify={handleVerify}
            loading={verifyLoading}
            error={verifyError}
          />
        ) : null}

        {state.kind === "ready" ? (
          <>
            <TrackingHeroStatus order={state.order} />
            <TrackingProgressStepper currentStatus={state.order.currentStatus} />
            <TrackingActionCallout status={state.order.currentStatus} />
            <PublicStatusTimeline history={state.order.statusHistory} />
            <TrackingOrderSummary order={state.order} />
            <TrackingContactBar
              customerName={state.order.customerName}
              orderNumber={state.order.orderNumber}
              projectType={state.order.projectType}
              shopPhone={shopPhone}
            />
          </>
        ) : null}
      </main>
    </div>
  );
}
