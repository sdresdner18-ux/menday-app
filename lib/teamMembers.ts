import { Prisma, TeamMember } from "@prisma/client";

export function serializeTeamMember(member: TeamMember) {
  return {
    id: member.id,
    name: member.name,
    role: member.role,
    color: member.color,
    createdAt: member.createdAt.toISOString(),
    updatedAt: member.updatedAt.toISOString(),
  };
}

export type SerializedTeamMember = ReturnType<typeof serializeTeamMember>;

export const teamMemberColors = [
  "violet",
  "blue",
  "teal",
  "emerald",
  "amber",
  "orange",
  "rose",
  "pink",
  "cyan",
  "indigo",
] as const;

export function getTeamMemberInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export const orderWithTeamInclude = {
  customer: true,
  teamAssignments: {
    include: { teamMember: true },
    orderBy: { assignedAt: "asc" as const },
  },
} satisfies Prisma.OrderInclude;

export type OrderWithTeam = Prisma.OrderGetPayload<{
  include: typeof orderWithTeamInclude;
}>;

export function serializeOrderTeamMembers(order: OrderWithTeam) {
  return order.teamAssignments.map((a) => serializeTeamMember(a.teamMember));
}
