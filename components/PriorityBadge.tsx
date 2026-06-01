"use client";
import { Priority } from "@/lib/types";

const CONFIG: Record<Priority, { label: string; className: string }> = {
  Low: {
    label: "Low",
    className:
      "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-300",
  },
  Medium: {
    label: "Medium",
    className:
      "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-300",
  },
  High: {
    label: "High",
    className:
      "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-300",
  },
  Urgent: {
    label: "Urgent",
    className:
      "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-300",
  },
};

export default function PriorityBadge({ priority }: { priority: Priority }) {
  const cfg = CONFIG[priority] ?? CONFIG.Medium;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
}
