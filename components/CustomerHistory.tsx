"use client";

import Link from "next/link";
import { OrderSummary, WorkflowStage } from "@/lib/types";
import StatusBadge from "./StatusBadge";

interface Props {
  orders: OrderSummary[];
  customerName: string;
  stages?: WorkflowStage[];
}

export default function CustomerHistory({ orders, customerName, stages = [] }: Props) {
  if (orders.length === 0) {
    return (
      <div className="glass-card p-5">
        <h3 className="section-title mb-2">Other orders from this customer</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No other orders found for {customerName}.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-5">
      <h3 className="section-title mb-4">Other orders from this customer</h3>
      <ul className="space-y-2">
        {orders.map((o) => (
          <li key={o.id}>
            <Link
              href={`/orders/${o.id}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-gray-200/80 px-4 py-3 transition-colors hover:border-violet-500/30 hover:bg-violet-500/5 dark:border-[color:var(--dm-border)] dark:bg-[var(--dm-inset)] dark:hover:border-violet-500/25 dark:hover:bg-violet-500/10"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{o.projectType}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(o.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <StatusBadge status={o.status} stages={stages} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
