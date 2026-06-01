"use client";

import { useState } from "react";
import { ChecklistItem } from "@/lib/types";

interface Props {
  orderId: string;
  items: ChecklistItem[];
}

export default function OrderChecklist({ orderId, items: initialItems }: Props) {
  const [items, setItems] = useState(initialItems);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function toggleItem(item: ChecklistItem) {
    const nextChecked = !item.checked;
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, checked: nextChecked } : i))
    );
    setSavingId(item.id);

    try {
      const res = await fetch(`/api/orders/${orderId}/checklist`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id, checked: nextChecked }),
      });
      if (!res.ok) throw new Error("Failed to save");
    } catch {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, checked: item.checked } : i))
      );
    } finally {
      setSavingId(null);
    }
  }

  const completed = items.filter((i) => i.checked).length;

  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h3 className="section-title">Production Checklist</h3>
        <span className="text-xs font-bold text-violet-600 dark:text-violet-300">
          {completed}/{items.length} done
        </span>
      </div>

      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <label
              className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 transition-colors ${
                item.checked
                  ? "border-emerald-500/30 bg-emerald-500/10 dark:border-emerald-400/25 dark:bg-emerald-500/15"
                  : "border-gray-200/80 hover:border-violet-500/20 dark:border-[color:var(--dm-border)] dark:bg-[var(--dm-inset)] dark:hover:border-violet-500/20"
              } ${savingId === item.id ? "opacity-60" : ""}`}
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggleItem(item)}
                className="h-4 w-4 accent-violet-500"
              />
              <span
                className={`text-sm font-semibold ${
                  item.checked
                    ? "text-emerald-700 line-through dark:text-emerald-300"
                    : "text-gray-700 dark:text-gray-200"
                }`}
              >
                {item.label}
              </span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
