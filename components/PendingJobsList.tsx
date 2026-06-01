"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Order, WorkflowStage } from "@/lib/types";
import { formatMoney, lineAmount } from "@/lib/currency";
import { formatPhoneDisplay } from "@/lib/messaging";
import StatusBadge from "./StatusBadge";
import PriorityBadge from "./PriorityBadge";
import TeamMemberAvatars from "./TeamMemberAvatars";
import PaymentReceivedCheckbox from "./PaymentReceivedCheckbox";
import {
  getActiveBoardStages,
  getArchiveStage,
  getPaymentStage,
  getStageLabel,
} from "@/lib/workflow-shared";

interface Props {
  orders: Order[];
  stages: WorkflowStage[];
}

const PRIORITY_RANK: Record<Order["priority"], number> = {
  Urgent: 0,
  High: 1,
  Medium: 2,
  Low: 3,
};

function formatDate(iso: string | null) {
  if (!iso) return "No date set";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isOverdue(deadline: string | null): boolean {
  if (!deadline) return false;
  return new Date(deadline) < new Date();
}

export default function PendingJobsList({ orders, stages }: Props) {
  const archiveStage = getArchiveStage(stages);
  const paymentStage = getPaymentStage(stages);
  const activeStages = getActiveBoardStages(stages);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [localOrders, setLocalOrders] = useState(orders);

  useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);

  async function handleMarkPayment(orderId: string, received: boolean) {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentReceived: received }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to update payment");
    setLocalOrders((prev) => prev.map((o) => (o.id === orderId ? data : o)));
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return localOrders
      .filter((o) => o.status !== archiveStage.slug)
      .filter((o) => statusFilter === "all" || o.status === statusFilter)
      .filter((o) => {
        if (!q) return true;
        return (
          o.customerName.toLowerCase().includes(q) ||
          o.projectType.toLowerCase().includes(q) ||
          (o.orderNumber ?? "").toLowerCase().includes(q) ||
          (o.color ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const pr =
          PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
        if (pr !== 0) return pr;

        if (a.deadline && b.deadline) {
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }
        if (a.deadline) return -1;
        if (b.deadline) return 1;

        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });
  }, [localOrders, archiveStage.slug, statusFilter, query]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <p className="section-title mb-1">Pending jobs</p>
        <h2 className="text-2xl font-extrabold tracking-tight">
          {filtered.length} active job{filtered.length !== 1 ? "s" : ""}
        </h2>
        <p className="mt-1 text-sm text-muted">
          All in-progress orders in one list — sorted by priority and due date.
        </p>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search customer, project, order #..."
          className="input-field max-w-md flex-1"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="input-field w-auto min-w-[180px]"
        >
          <option value="all">All stages</option>
          {activeStages.map((stage) => (
            <option key={stage.id} value={stage.slug}>
              {stage.label}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <p className="text-sm text-muted">
            {orders.length === 0
              ? "No pending jobs. Create an order to get started."
              : "No jobs match your filters."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((order) => {
            const total = lineAmount(order.unitPrice, order.quantity);
            const overdue = isOverdue(order.deadline);
            const showPayment =
              paymentStage && order.status === paymentStage.slug;

            return (
              <li key={order.id}>
                <div className="glass-card flex flex-wrap items-center justify-between gap-4 p-4 transition-all duration-smooth ease-smooth-out hover:shadow-glass-md">
                  <Link href={`/orders/${order.id}`} className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold">{order.customerName}</span>
                      {order.orderNumber && (
                        <span className="text-xs font-bold text-violet-600 dark:text-violet-300">
                          #{order.orderNumber}
                        </span>
                      )}
                      <PriorityBadge priority={order.priority} />
                    </div>
                    <p className="mt-1 text-sm text-muted">
                      {order.projectType}
                      {order.quantity != null ? ` · ×${order.quantity}` : ""}
                      {total != null ? ` · ${formatMoney(total)}` : ""}
                    </p>
                    {order.color && (
                      <p className="mt-1 text-xs text-muted">{order.color}</p>
                    )}
                    {order.customerPhone && (
                      <p className="mt-1 text-xs text-muted">
                        {formatPhoneDisplay(order.customerPhone)}
                      </p>
                    )}
                  </Link>

                  <div className="flex flex-col items-end gap-2 sm:min-w-[160px]">
                    <StatusBadge
                      status={order.status}
                      stages={stages}
                      label={getStageLabel(stages, order.status)}
                    />
                    <span
                      className={`text-xs font-semibold ${
                        overdue
                          ? "text-red-500"
                          : "text-muted"
                      }`}
                    >
                      {overdue ? "⚠ Overdue · " : ""}
                      Complete by {formatDate(order.deadline)}
                    </span>
                    {order.teamMembers && order.teamMembers.length > 0 && (
                      <TeamMemberAvatars members={order.teamMembers} />
                    )}
                    {order.filesExpected && (
                      <span className="text-xs font-semibold text-amber-600 dark:text-amber-300">
                        📎 Files expected
                      </span>
                    )}
                    {showPayment && (
                      <div className="mt-1 rounded-lg border px-3 py-2" style={{ borderColor: "var(--dm-border)" }}>
                        <PaymentReceivedCheckbox
                          compact
                          checked={order.paymentReceived}
                          onChange={(checked) =>
                            handleMarkPayment(order.id, checked)
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
