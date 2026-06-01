export const dynamic = "force-dynamic";

import AppShell from "@/components/AppShell";
import WorkflowEditor from "@/components/WorkflowEditor";
import { getAppShellContext } from "@/lib/appShellData";

export default async function WorkflowSettingsPage() {
  let shell = {
    stages: [] as Awaited<ReturnType<typeof getAppShellContext>>["stages"],
    orderStats: { active: 0, archived: 0, urgent: 0, waitingFiles: 0 },
    shopSettings: null as Awaited<ReturnType<typeof getAppShellContext>>["shopSettings"] | null,
  };

  try {
    shell = await getAppShellContext();
  } catch (error) {
    console.error("Workflow settings page error:", error);
  }

  return (
    <AppShell stages={shell.stages} orderStats={shell.orderStats} shopSettings={shell.shopSettings}>
      <WorkflowEditor initialStages={shell.stages} />
    </AppShell>
  );
}
