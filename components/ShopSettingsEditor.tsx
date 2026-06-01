"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { SerializedShopSettings } from "@/lib/shopSettings-shared";
import ShopBrandMark from "./ShopBrandMark";
import { formatPhoneInput } from "@/lib/messaging";

interface Props {
  initialSettings: SerializedShopSettings;
}

export default function ShopSettingsEditor({ initialSettings }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState(initialSettings);
  const [form, setForm] = useState({
    businessName: initialSettings.businessName,
    tagline: initialSettings.tagline ?? "",
    phone: initialSettings.phone ?? "",
    email: initialSettings.email ?? "",
    website: initialSettings.website ?? "",
    addressLine1: initialSettings.addressLine1 ?? "",
    addressLine2: initialSettings.addressLine2 ?? "",
    city: initialSettings.city ?? "",
    state: initialSettings.state ?? "",
    zip: initialSettings.zip ?? "",
    invoiceFooter: initialSettings.invoiceFooter ?? "",
    paymentLink: initialSettings.paymentLink ?? "",
    paymentLabel: initialSettings.paymentLabel ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setStatus(null);

    try {
      const res = await fetch("/api/shop/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to save settings");

      setSettings(data as SerializedShopSettings);
      setStatus("Shop details saved.");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoUpload(file: File) {
    setUploadingLogo(true);
    setError(null);
    setStatus(null);

    try {
      const formData = new FormData();
      formData.append("logo", file);

      const res = await fetch("/api/shop/settings", {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to upload logo");

      setSettings(data as SerializedShopSettings);
      setStatus("Logo updated.");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemoveLogo() {
    if (!window.confirm("Remove your shop logo?")) return;

    setUploadingLogo(true);
    setError(null);
    setStatus(null);

    try {
      const res = await fetch("/api/shop/settings", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to remove logo");

      setSettings(data as SerializedShopSettings);
      setStatus("Logo removed.");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setUploadingLogo(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-title mb-1">Shop</p>
          <h2 className="text-2xl font-extrabold tracking-tight">Business settings</h2>
          <p className="mt-1 text-sm text-muted">
            Your logo and details appear on invoices, the dashboard, and customer tracking.
          </p>
        </div>
        <Link href="/settings/workflow" className="btn-secondary text-sm">
          Workflow settings
        </Link>
      </div>

      <div className="glass-card mb-6 p-5">
        <p className="section-title mb-4">Preview</p>
        <ShopBrandMark settings={settings} />
      </div>

      <div className="glass-card mb-6 p-5">
        <p className="section-title mb-2">Logo</p>
        <p className="mb-4 text-sm text-muted">
          PNG, JPG, WebP, or SVG · max 512 KB · square logos work best
        </p>

        <div className="flex flex-wrap items-center gap-4">
          {settings.logoDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.logoDataUrl}
              alt="Shop logo preview"
              className="h-20 w-20 rounded-2xl border object-contain p-2"
              style={{ borderColor: "var(--dm-border)", background: "white" }}
            />
          ) : (
            <div
              className="flex h-20 w-20 items-center justify-center rounded-2xl border text-sm font-bold text-muted"
              style={{ borderColor: "var(--dm-border)", background: "var(--dm-inset)" }}
            >
              No logo
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleLogoUpload(file);
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingLogo}
              className="btn-primary"
            >
              {uploadingLogo ? "Uploading..." : settings.logoDataUrl ? "Replace logo" : "Upload logo"}
            </button>
            {settings.logoDataUrl ? (
              <button
                type="button"
                onClick={() => void handleRemoveLogo()}
                disabled={uploadingLogo}
                className="btn-secondary"
              >
                Remove
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="glass-card grid gap-4 p-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label-field mb-2 block">Business name</label>
          <input
            required
            value={form.businessName}
            onChange={(e) => updateField("businessName", e.target.value)}
            className="input-field"
            placeholder="Your shop name"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="label-field mb-2 block">Tagline</label>
          <input
            value={form.tagline}
            onChange={(e) => updateField("tagline", e.target.value)}
            className="input-field"
            placeholder="e.g. Custom manufacturing"
          />
        </div>

        <div>
          <label className="label-field mb-2 block">Phone</label>
          <input
            value={form.phone}
            onChange={(e) => updateField("phone", formatPhoneInput(e.target.value))}
            className="input-field"
            placeholder="(555) 234-5678"
          />
        </div>

        <div>
          <label className="label-field mb-2 block">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            className="input-field"
            placeholder="hello@yourshop.com"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="label-field mb-2 block">Website</label>
          <input
            value={form.website}
            onChange={(e) => updateField("website", e.target.value)}
            className="input-field"
            placeholder="https://yourshop.com"
          />
        </div>

        <div className="sm:col-span-2">
          <p className="section-title mb-3">Address</p>
        </div>

        <div className="sm:col-span-2">
          <label className="label-field mb-2 block">Street address</label>
          <input
            value={form.addressLine1}
            onChange={(e) => updateField("addressLine1", e.target.value)}
            className="input-field"
            placeholder="123 Main St"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="label-field mb-2 block">Address line 2</label>
          <input
            value={form.addressLine2}
            onChange={(e) => updateField("addressLine2", e.target.value)}
            className="input-field"
            placeholder="Suite 4"
          />
        </div>

        <div>
          <label className="label-field mb-2 block">City</label>
          <input
            value={form.city}
            onChange={(e) => updateField("city", e.target.value)}
            className="input-field"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label-field mb-2 block">State</label>
            <input
              value={form.state}
              onChange={(e) => updateField("state", e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="label-field mb-2 block">ZIP</label>
            <input
              value={form.zip}
              onChange={(e) => updateField("zip", e.target.value)}
              className="input-field"
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="label-field mb-2 block">Payment link</label>
          <input
            value={form.paymentLink}
            onChange={(e) => updateField("paymentLink", e.target.value)}
            className="input-field"
            placeholder="https://buy.stripe.com/... or Venmo @YourShop"
          />
          <p className="mt-1.5 text-xs text-muted">
            Stripe Payment Link, PayPal.me, Venmo, Zelle, or any pay instructions — used for
            one-tap payment requests on orders.
          </p>
        </div>

        <div className="sm:col-span-2">
          <label className="label-field mb-2 block">Payment label (optional)</label>
          <input
            value={form.paymentLabel}
            onChange={(e) => updateField("paymentLabel", e.target.value)}
            className="input-field"
            placeholder="Pay with Stripe"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="label-field mb-2 block">Invoice footer message</label>
          <textarea
            value={form.invoiceFooter}
            onChange={(e) => updateField("invoiceFooter", e.target.value)}
            rows={3}
            className="input-field resize-none"
            placeholder="Thank you for your business!"
          />
        </div>

        <div className="sm:col-span-2">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving..." : "Save shop details"}
          </button>
        </div>
      </form>

      {status ? (
        <p className="mt-4 text-sm font-semibold text-emerald-600 dark:text-emerald-300">
          {status}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 text-sm text-red-500 dark:text-red-400">{error}</p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/settings/team" className="btn-secondary text-sm">
          Team settings
        </Link>
      </div>
    </div>
  );
}
