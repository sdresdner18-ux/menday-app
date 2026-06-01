"use client";

import Link from "next/link";
import { STAGE_COLOR_HEX } from "@/lib/workflow-shared";
import { getTeamMemberInitials } from "@/lib/teamMembers";
import { TeamMember } from "@/lib/types";

interface Props {
  members: TeamMember[];
  size?: "sm" | "md";
  max?: number;
}

export default function TeamMemberAvatars({
  members,
  size = "sm",
  max = 3,
}: Props) {
  if (members.length === 0) return null;

  const shown = members.slice(0, max);
  const extra = members.length - shown.length;
  const dim = size === "sm" ? "h-5 w-5 text-[9px]" : "h-7 w-7 text-[10px]";

  return (
    <div className="flex items-center -space-x-1.5">
      {shown.map((member) => (
        <span
          key={member.id}
          title={member.role ? `${member.name} · ${member.role}` : member.name}
          className={`inline-flex shrink-0 items-center justify-center rounded-full border-2 font-bold text-white ${dim}`}
          style={{
            borderColor: "var(--dm-surface)",
            backgroundColor: STAGE_COLOR_HEX[member.color] ?? STAGE_COLOR_HEX.violet,
          }}
        >
          {getTeamMemberInitials(member.name)}
        </span>
      ))}
      {extra > 0 && (
        <span
          className={`inline-flex shrink-0 items-center justify-center rounded-full border-2 font-bold text-muted ${dim}`}
          style={{
            borderColor: "var(--dm-surface)",
            background: "var(--dm-inset)",
          }}
        >
          +{extra}
        </span>
      )}
    </div>
  );
}

interface BadgeProps {
  member: TeamMember;
  onRemove?: () => void;
  disabled?: boolean;
}

export function TeamMemberBadge({ member, onRemove, disabled }: BadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold"
      style={{
        borderColor: `color-mix(in srgb, ${STAGE_COLOR_HEX[member.color] ?? STAGE_COLOR_HEX.violet} 35%, transparent)`,
        background: `color-mix(in srgb, ${STAGE_COLOR_HEX[member.color] ?? STAGE_COLOR_HEX.violet} 12%, transparent)`,
        color: STAGE_COLOR_HEX[member.color] ?? STAGE_COLOR_HEX.violet,
      }}
    >
      <span
        className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-extrabold text-white"
        style={{
          backgroundColor: STAGE_COLOR_HEX[member.color] ?? STAGE_COLOR_HEX.violet,
        }}
      >
        {getTeamMemberInitials(member.name)}
      </span>
      <span className="max-w-[120px] truncate">{member.name}</span>
      {member.role ? (
        <span className="hidden font-medium opacity-70 sm:inline">· {member.role}</span>
      ) : null}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="ml-0.5 rounded-full px-1 opacity-70 transition hover:opacity-100 disabled:opacity-40"
          aria-label={`Remove ${member.name}`}
        >
          ×
        </button>
      )}
    </span>
  );
}

export function TeamSettingsLink() {
  return (
    <Link href="/settings/team" className="text-xs font-bold text-violet-600 hover:underline dark:text-violet-300">
      Manage team →
    </Link>
  );
}
