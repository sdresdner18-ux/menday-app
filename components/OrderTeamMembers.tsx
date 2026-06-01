"use client";

import { useEffect, useState } from "react";
import { TeamMember } from "@/lib/types";
import { TeamMemberBadge, TeamSettingsLink } from "./TeamMemberAvatars";

interface Props {
  orderId: string;
  initialMembers: TeamMember[];
}

export default function OrderTeamMembers({ orderId, initialMembers }: Props) {
  const [assigned, setAssigned] = useState(initialMembers);
  const [roster, setRoster] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRoster() {
      try {
        const res = await fetch("/api/team-members");
        if (!res.ok) throw new Error("Failed to load team");
        const data = (await res.json()) as TeamMember[];
        if (!cancelled) setRoster(data);
      } catch {
        if (!cancelled) setRoster([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadRoster();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setAssigned(initialMembers);
  }, [initialMembers]);

  async function saveAssignments(nextIds: string[]) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/team-members`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamMemberIds: nextIds }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to update team");
      }
      setAssigned(data as TeamMember[]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  function addMember(memberId: string) {
    if (!memberId || assigned.some((m) => m.id === memberId)) return;
    void saveAssignments([...assigned.map((m) => m.id), memberId]);
  }

  function removeMember(memberId: string) {
    void saveAssignments(assigned.filter((m) => m.id !== memberId).map((m) => m.id));
  }

  const available = roster.filter((m) => !assigned.some((a) => a.id === m.id));

  return (
    <div
      className="rounded-2xl border p-4"
      style={{ borderColor: "var(--dm-border)", background: "var(--dm-inset)" }}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="section-title">Team on this job</p>
        <TeamSettingsLink />
      </div>

      {assigned.length > 0 ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {assigned.map((member) => (
            <TeamMemberBadge
              key={member.id}
              member={member}
              onRemove={() => removeMember(member.id)}
              disabled={saving}
            />
          ))}
        </div>
      ) : (
        <p className="mb-3 text-sm text-muted">No one assigned yet.</p>
      )}

      {loading ? (
        <p className="text-xs text-muted">Loading team roster...</p>
      ) : roster.length === 0 ? (
        <p className="text-sm text-muted">
          Add team members in{" "}
          <TeamSettingsLink />
          {" "}to assign them to jobs.
        </p>
      ) : available.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <select
            defaultValue=""
            disabled={saving}
            onChange={(e) => {
              addMember(e.target.value);
              e.target.value = "";
            }}
            className="input-field max-w-xs py-2 text-sm"
          >
            <option value="" disabled>
              + Assign team member
            </option>
            {available.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
                {member.role ? ` · ${member.role}` : ""}
              </option>
            ))}
          </select>
          {saving && (
            <span className="text-xs font-medium text-muted">Saving...</span>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted">All team members are assigned to this job.</p>
      )}

      {error && (
        <p className="mt-2 text-sm text-red-500 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
