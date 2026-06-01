"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { TeamMember } from "@/lib/types";
import { teamMemberColors } from "@/lib/teamMembers";
import { STAGE_COLOR_HEX } from "@/lib/workflow-shared";
import { TeamMemberBadge } from "./TeamMemberAvatars";

interface Props {
  initialMembers: TeamMember[];
}

export default function TeamEditor({ initialMembers }: Props) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [color, setColor] = useState<string>(teamMemberColors[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editColor, setEditColor] = useState<string>(teamMemberColors[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/team-members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, role: role || null, color }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to add team member");
      setMembers((prev) => [...prev, data as TeamMember].sort((a, b) => a.name.localeCompare(b.name)));
      setName("");
      setRole("");
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(member: TeamMember) {
    setEditingId(member.id);
    setEditName(member.name);
    setEditRole(member.role ?? "");
    setEditColor(member.color);
    setError(null);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId || !editName.trim()) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/team-members/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          role: editRole || null,
          color: editColor,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to update");
      setMembers((prev) =>
        prev
          .map((m) => (m.id === editingId ? (data as TeamMember) : m))
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingId(null);
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(member: TeamMember) {
    if (!window.confirm(`Remove ${member.name} from the team?`)) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/team-members/${member.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to delete");
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      if (editingId === member.id) setEditingId(null);
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  function ColorPicker({
    value,
    onChange,
  }: {
    value: string;
    onChange: (color: string) => void;
  }) {
    return (
      <div className="flex flex-wrap gap-2">
        {teamMemberColors.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className={`h-7 w-7 rounded-full border-2 transition ${
              value === c ? "scale-110 border-white ring-2 ring-violet-500/50" : "border-transparent"
            }`}
            style={{ backgroundColor: STAGE_COLOR_HEX[c] }}
            aria-label={c}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-title mb-1">Team</p>
          <h2 className="text-2xl font-extrabold tracking-tight">
            {members.length} team member{members.length !== 1 ? "s" : ""}
          </h2>
          <p className="mt-1 text-sm text-muted">
            Add your shop team here, then assign them to jobs from any order.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/settings/shop" className="btn-secondary text-sm">
            Shop settings
          </Link>
          <Link href="/settings/workflow" className="btn-secondary text-sm">
            Workflow settings
          </Link>
        </div>
      </div>

      <form onSubmit={handleAdd} className="glass-card mb-6 grid gap-4 p-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label-field mb-2 block">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            placeholder="e.g. Sarah"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label-field mb-2 block">Role (optional)</label>
          <input
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="input-field"
            placeholder="e.g. Designer, Production"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="label-field mb-2 block">Color</label>
          <ColorPicker value={color} onChange={setColor} />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving..." : "+ Add team member"}
          </button>
        </div>
      </form>

      {error && (
        <p className="mb-4 text-sm text-red-500 dark:text-red-400">{error}</p>
      )}

      {members.length === 0 ? (
        <div className="glass-card p-8 text-center text-sm text-muted">
          No team members yet. Add your first person above.
        </div>
      ) : (
        <ul className="space-y-3">
          {members.map((member) =>
            editingId === member.id ? (
              <li key={member.id}>
                <form
                  onSubmit={handleSaveEdit}
                  className="glass-card grid gap-4 p-5 sm:grid-cols-2"
                >
                  <div className="sm:col-span-2">
                    <label className="label-field mb-2 block">Name</label>
                    <input
                      required
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label-field mb-2 block">Role</label>
                    <input
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label-field mb-2 block">Color</label>
                    <ColorPicker value={editColor} onChange={setEditColor} />
                  </div>
                  <div className="flex flex-wrap gap-2 sm:col-span-2">
                    <button type="submit" disabled={saving} className="btn-primary">
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </li>
            ) : (
              <li key={member.id}>
                <div className="glass-card flex flex-wrap items-center justify-between gap-4 p-4">
                  <TeamMemberBadge member={member} />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(member)}
                      disabled={saving}
                      className="btn-secondary py-2 text-xs"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(member)}
                      disabled={saving}
                      className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}
