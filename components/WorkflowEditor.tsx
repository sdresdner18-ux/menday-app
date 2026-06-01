"use client";

import Link from "next/link";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { WorkflowStage } from "@/lib/types";
import {
  STAGE_COLOR_PALETTE,
  getStageColumnStyle,
  getStageDotStyle,
} from "@/lib/workflow-shared";

interface Props {
  initialStages: WorkflowStage[];
}

function stageTypeBadge(stageType: WorkflowStage["stageType"]) {
  if (stageType === "Payment") return "Payment step";
  if (stageType === "Archive") return "Archive step";
  return "Production step";
}

function SortableStageRow({
  stage,
  onRename,
  onDelete,
  onColorChange,
  saving,
}: {
  stage: WorkflowStage;
  onRename: (id: string, label: string) => void;
  onDelete: (id: string) => void;
  onColorChange: (id: string, color: string) => void;
  saving: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: stage.id, disabled: stage.stageType === "Archive" });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isSystem = stage.stageType !== "Normal";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`glass-card p-4 ${
        isDragging ? "z-10 opacity-90 ring-2 ring-violet-500/30" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          className={`mt-2 flex h-10 w-8 shrink-0 items-center justify-center rounded-lg text-muted ${
            stage.stageType === "Archive"
              ? "cursor-not-allowed opacity-30"
              : "cursor-grab hover:text-violet-500 active:cursor-grabbing"
          }`}
          aria-label="Drag to reorder"
          disabled={stage.stageType === "Archive"}
          {...attributes}
          {...listeners}
        >
          ⠿
        </button>

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-start gap-2">
            <span
              className="mt-3 h-2.5 w-2.5 shrink-0 rounded-full"
              style={getStageDotStyle(stage.color)}
            />
            <input
              defaultValue={stage.label}
              key={stage.label}
              disabled={saving}
              onBlur={(e) => onRename(stage.id, e.target.value)}
              className="input-field min-w-0 flex-1 py-2.5 text-base font-bold"
            />
            {!isSystem ? (
              <button
                type="button"
                disabled={saving}
                onClick={() => onDelete(stage.id)}
                className="mt-1 shrink-0 rounded-xl px-3 py-2 text-xs font-bold text-red-500 transition-colors hover:bg-red-500/10"
              >
                Remove
              </button>
            ) : (
              <span className="mt-2 shrink-0 text-[10px] font-semibold text-muted">
                Locked
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pl-5">
            <p className="text-[11px] text-muted">{stageTypeBadge(stage.stageType)}</p>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-muted">Color</span>
              {STAGE_COLOR_PALETTE.map((color) => {
                const selected = stage.color === color;
                return (
                  <button
                    key={color}
                    type="button"
                    title={color}
                    disabled={saving}
                    aria-label={`${color} color`}
                    aria-pressed={selected}
                    onClick={() => onColorChange(stage.id, color)}
                    className={`h-5 w-5 shrink-0 rounded-full border transition-colors ${
                      selected
                        ? "border-violet-500 ring-1 ring-violet-500/40"
                        : "border-black/10 hover:border-violet-400/50 dark:border-white/15"
                    }`}
                    style={getStageDotStyle(color)}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WorkflowEditor({ initialStages }: Props) {
  const [stages, setStages] = useState(initialStages);
  const [newStageName, setNewStageName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    setStages(initialStages);
  }, [initialStages]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  async function persistOrder(nextStages: WorkflowStage[]) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/workflow/stages/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: nextStages.map((s) => s.id) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to save order");
      setStages(data);
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not save workflow");
      setStages(initialStages);
    } finally {
      setSaving(false);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = stages.findIndex((s) => s.id === active.id);
    const newIndex = stages.findIndex((s) => s.id === over.id);
    const archiveIndex = stages.findIndex((s) => s.stageType === "Archive");
    if (newIndex === archiveIndex) return;

    const next = arrayMove(stages, oldIndex, newIndex);
    setStages(next);
    void persistOrder(next);
  }

  async function saveLabel(id: string, label: string) {
    const trimmed = label.trim();
    const current = stages.find((s) => s.id === id);
    if (!current || !trimmed || trimmed === current.label) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/workflow/stages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to rename stage");
      setStages((prev) => prev.map((s) => (s.id === id ? data : s)));
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not rename stage");
    } finally {
      setSaving(false);
    }
  }

  async function saveColor(id: string, color: string) {
    const current = stages.find((s) => s.id === id);
    if (!current || current.color === color) return;

    setStages((prev) => prev.map((s) => (s.id === id ? { ...s, color } : s)));
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/workflow/stages/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ color }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update color");
      setStages((prev) => prev.map((s) => (s.id === id ? data : s)));
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not update color");
      setStages(initialStages);
    } finally {
      setSaving(false);
    }
  }

  async function addStage(e: React.FormEvent) {
    e.preventDefault();
    const label = newStageName.trim();
    if (!label) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/workflow/stages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add stage");
      setNewStageName("");
      router.refresh();
      const listRes = await fetch("/api/workflow/stages");
      const list = await listRes.json();
      setStages(list);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not add stage");
    } finally {
      setSaving(false);
    }
  }

  async function deleteStage(id: string) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/workflow/stages/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to remove stage");
      setStages((prev) => prev.filter((s) => s.id !== id));
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not remove stage");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-title mb-1">Customize workflow</p>
          <h2 className="text-2xl font-extrabold tracking-tight">
            Build the board your business actually uses
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Rename steps, add new ones, or remove stages you do not need. Drag to
            reorder. Payment and archive steps stay in place so orders still flow
            correctly.
          </p>
        </div>
        <Link href="/settings/team" className="btn-secondary text-sm">
          Team settings
        </Link>
      </div>

      <div
        className="mb-6 overflow-x-auto rounded-2xl border p-4"
        style={{
          borderColor: "var(--dm-border)",
          background: "var(--dm-inset)",
        }}
      >
        <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-muted">
          Board preview
        </p>
        <div className="flex min-w-max gap-2">
          {stages.map((stage) => (
            <div
              key={stage.id}
              className="min-w-[5.5rem] max-w-[8.5rem] rounded-xl border border-t-[3px] px-2.5 py-2 text-center"
              style={{
                borderColor: "var(--dm-border)",
                background: "var(--dm-surface)",
                ...getStageColumnStyle(stage.color),
              }}
            >
              <span
                className="mx-auto mb-1.5 block h-2 w-2 rounded-full"
                style={getStageDotStyle(stage.color)}
              />
              <p className="text-[10px] font-semibold leading-snug text-muted">
                {stage.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
          {error}
        </p>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={stages.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {stages.map((stage) => (
              <SortableStageRow
                key={stage.id}
                stage={stage}
                saving={saving}
                onRename={saveLabel}
                onDelete={deleteStage}
                onColorChange={saveColor}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <form
        onSubmit={addStage}
        className="glass-card mt-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label className="label-field mb-2 block">Add a production step</label>
          <input
            value={newStageName}
            onChange={(e) => setNewStageName(e.target.value)}
            placeholder='e.g. Wrapped, Quality Check, Ready for Pickup'
            className="input-field"
            disabled={saving}
          />
        </div>
        <button type="submit" disabled={saving || !newStageName.trim()} className="btn-primary">
          Add step
        </button>
      </form>
    </div>
  );
}
