"use client";

import { useState } from "react";
import { OrderNote } from "@/lib/types";

interface Props {
  orderId: string;
  notes: OrderNote[];
}

function formatNoteTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function InternalNotes({ orderId, notes: initialNotes }: Props) {
  const [notes, setNotes] = useState(initialNotes);
  const [content, setContent] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (!content.trim()) return;
    setAdding(true);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${orderId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed to add note");
      const note = await res.json();
      setNotes((prev) => [note, ...prev]);
      setContent("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="glass-card p-5">
      <h3 className="section-title mb-4">Internal Notes</h3>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        placeholder="Add an internal note..."
        className="input-field resize-none"
      />

      <div className="mt-3 flex items-center gap-3">
        <button
          onClick={handleAdd}
          disabled={adding || !content.trim()}
          className="btn-primary"
        >
          {adding ? "Adding..." : "Add Note"}
        </button>
        {error && (
          <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
        )}
      </div>

      {notes.length > 0 && (
        <ul className="mt-5 space-y-3 border-t border-gray-100 pt-5 dark:border-[color:var(--dm-border)]">
          {notes.map((note) => (
            <li
              key={note.id}
              className="rounded-2xl border border-gray-200/80 bg-gray-50/50 px-4 py-3 dark:border-[color:var(--dm-border)] dark:bg-[var(--dm-inset)]"
            >
              <p className="text-sm text-gray-800 dark:text-gray-100 whitespace-pre-wrap">
                {note.content}
              </p>
              <p className="mt-2 text-xs font-semibold text-gray-400 dark:text-gray-500">
                {formatNoteTime(note.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
