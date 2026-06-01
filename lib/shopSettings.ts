import "server-only";

import { cache } from "react";
import { prisma } from "./prisma";
import {
  SHOP_SETTINGS_ID,
  serializeShopSettings,
  type SerializedShopSettings,
} from "./shopSettings-shared";

export async function ensureShopSettings(): Promise<SerializedShopSettings> {
  const existing = await prisma.shopSettings.findUnique({
    where: { id: SHOP_SETTINGS_ID },
  });

  if (existing) {
    return serializeShopSettings(existing);
  }

  const created = await prisma.shopSettings.create({
    data: { id: SHOP_SETTINGS_ID },
  });

  return serializeShopSettings(created);
}

export const getCachedShopSettings = cache(async () => ensureShopSettings());

export {
  SHOP_SETTINGS_ID,
  serializeShopSettings,
  serializePublicShopSettings,
  formatShopAddress,
  shopInvoiceFilename,
  LOGO_MAX_BYTES,
  LOGO_ALLOWED_TYPES,
} from "./shopSettings-shared";

export type {
  SerializedShopSettings,
  PublicShopSettings,
  ShopSettingsRecord,
} from "./shopSettings-shared";
