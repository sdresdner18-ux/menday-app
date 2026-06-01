export const dynamic = "force-dynamic";

import { prisma } from "@/lib/prisma";
import AppShell from "@/components/AppShell";
import TeamEditor from "@/components/TeamEditor";
import { getAppShellContext } from "@/lib/appShellData";
import { serializeTeamMember } from "@/lib/teamMembers";

export default async function TeamSettingsPage() {
  let members: ReturnType<typeof serializeTeamMember>[] = [];
  let shell = { stages: [] as Awaited<ReturnType<typeof getAppShellContext>>["stages"], orderStats: { active: 0, archived: 0, urgent: 0, waitingFiles: 0 } };

  try {
    const [membersRaw, context] = await Promise.all([
      prisma.teamMember.findMany({ orderBy: { name: "asc" } }),
      getAppShellContext(),
    ]);
    members = membersRaw.map(serializeTeamMember);
    shell = context;
  } catch (error) {
    console.error("Team settings page error:", error);
  }

  return (
    <AppShell stages={shell.stages} orderStats={shell.orderStats}>
      <TeamEditor initialMembers={members} />
    </AppShell>
  );
}
