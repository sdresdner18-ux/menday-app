/** Client-safe shop settings helpers (no Prisma / database). */

export const SHOP_SETTINGS_ID = "default";

export interface SerializedShopSettings {
  businessName: string;
  tagline: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  invoiceFooter: string | null;
  paymentLink: string | null;
  paymentLabel: string | null;
  logoDataUrl: string | null;
  updatedAt: string;
}

export interface PublicShopSettings {
  businessName: string;
  tagline: string | null;
  phone: string | null;
  logoDataUrl: string | null;
}

export interface ShopSettingsRecord {
  businessName: string;
  tagline: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  invoiceFooter: string | null;
  paymentLink: string | null;
  paymentLabel: string | null;
  logoDataUrl: string | null;
  updatedAt: Date;
}

const DEFAULTS: Omit<SerializedShopSettings, "updatedAt"> = {
  businessName: "Mendy",
  tagline: "Custom manufacturing",
  phone: null,
  email: null,
  website: null,
  addressLine1: null,
  addressLine2: null,
  city: null,
  state: null,
  zip: null,
  invoiceFooter: null,
  paymentLink: null,
  paymentLabel: null,
  logoDataUrl: null,
};

export function serializeShopSettings(
  settings: ShopSettingsRecord | null | undefined
): SerializedShopSettings {
  if (!settings) {
    return {
      ...DEFAULTS,
      updatedAt: new Date(0).toISOString(),
    };
  }

  return {
    businessName: settings.businessName.trim() || DEFAULTS.businessName,
    tagline: settings.tagline,
    phone: settings.phone,
    email: settings.email,
    website: settings.website,
    addressLine1: settings.addressLine1,
    addressLine2: settings.addressLine2,
    city: settings.city,
    state: settings.state,
    zip: settings.zip,
    invoiceFooter: settings.invoiceFooter,
    paymentLink: settings.paymentLink,
    paymentLabel: settings.paymentLabel,
    logoDataUrl: settings.logoDataUrl,
    updatedAt: settings.updatedAt.toISOString(),
  };
}

export function serializePublicShopSettings(
  settings: SerializedShopSettings
): PublicShopSettings {
  const envPhone = process.env.NEXT_PUBLIC_SHOP_PHONE?.trim() || null;

  return {
    businessName: settings.businessName,
    tagline: settings.tagline,
    phone: settings.phone || envPhone,
    logoDataUrl: settings.logoDataUrl,
  };
}

export function formatShopAddress(settings: SerializedShopSettings): string | null {
  const cityLine = [settings.city, settings.state, settings.zip]
    .filter(Boolean)
    .join(", ")
    .trim();

  const lines = [
    settings.addressLine1,
    settings.addressLine2,
    cityLine || null,
  ].filter((line): line is string => !!line?.trim());

  return lines.length > 0 ? lines.join("\n") : null;
}

export function shopInvoiceFilename(
  settings: SerializedShopSettings,
  invoiceNumber: string
): string {
  const slug = settings.businessName
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);

  return `${slug || "Invoice"}-Invoice-${invoiceNumber}.pdf`;
}

export const LOGO_MAX_BYTES = 512 * 1024;
export const LOGO_ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
]);
