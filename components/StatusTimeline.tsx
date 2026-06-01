"use client";

import { StatusHistoryEntry } from "@/lib/types";

interface Props {
  history: StatusHistoryEntry[];
}

function formatHistoryTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function StatusTimeline({ history }: Props) {
  if (history.length === 0) {
    return (
      <div className="glass-card p-5">
        <h3 className="section-title mb-2">Status History</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">No status changes yet.</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-5">
      <h3 className="section-title mb-4">Status History</h3>

      <ol className="relative space-y-0 border-l-2 border-violet-500/20 pl-5 dark:border-violet-500/30">
        {[...history].reverse().map((entry, index) => (
          <li key={entry.id} className="relative pb-5 last:pb-0">
            <span
              className={`absolute -left-[1.35rem] top-1 h-3 w-3 rounded-full border-2 border-white dark:border-[var(--dm-surface)] ${
                index === 0
                  ? "bg-violet-500 shadow-glow"
                  : "bg-gray-300 dark:bg-gray-600"
              }`}
            />
            <p className="text-sm font-bold text-gray-800 dark:text-gray-100">
              {entry.statusLabel}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatHistoryTime(entry.createdAt)}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
