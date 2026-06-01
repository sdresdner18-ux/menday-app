export const dynamic = "force-dynamic";

import AppShell from "@/components/AppShell";
import ShopSettingsEditor from "@/components/ShopSettingsEditor";
import { getAppShellContext } from "@/lib/appShellData";
import { serializeShopSettings } from "@/lib/shopSettings-shared";

export default async function ShopSettingsPage() {
  let shell = {
    stages: [] as Awaited<ReturnType<typeof getAppShellContext>>["stages"],
    orderStats: { active: 0, archived: 0, urgent: 0, waitingFiles: 0 },
    shopSettings: null as Awaited<ReturnType<typeof getAppShellContext>>["shopSettings"] | null,
  };

  try {
    shell = await getAppShellContext();
  } catch (error) {
    console.error("Shop settings page error:", error);
  }

  return (
    <AppShell
      stages={shell.stages}
      orderStats={shell.orderStats}
      shopSettings={shell.shopSettings}
    >
      <ShopSettingsEditor initialSettings={shell.shopSettings ?? serializeShopSettings(null)} />
    </AppShell>
  );
}
