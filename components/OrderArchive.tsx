"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Order, WorkflowStage } from "@/lib/types";
import { formatMoney, lineAmount } from "@/lib/currency";
import { formatPhoneDisplay } from "@/lib/messaging";
import StatusBadge from "./StatusBadge";
import {
  getActiveBoardStages,
  getArchiveStage,
  getStageLabel,
} from "@/lib/workflow-shared";

interface Props {
  orders: Order[];
  stages: WorkflowStage[];
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function OrderArchive({ orders: initialOrders, stages }: Props) {
  const [orders, setOrders] = useState(initialOrders);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const archiveStage = getArchiveStage(stages);
  const restoreStages = getActiveBoardStages(stages);

  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  async function handleStatusChange(orderId: string, newStatus: string) {
    if (newStatus === archiveStage.slug) return;

    setSavingId(orderId);
    setError(null);

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update status");

      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not update order status");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <p className="section-title mb-1">Past Orders</p>
        <h2 className="text-2xl font-extrabold tracking-tight">
          {orders.length} archived order{orders.length !== 1 ? "s" : ""}
        </h2>
        <p className="mt-1 text-sm text-muted">
          Completed orders are stored here. Change the status below to return an
          order to the production board if it was archived by mistake.
        </p>
      </div>

      {error && (
        <p className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
          {error}
        </p>
      )}

      {orders.length === 0 ? (
        <div className="glass-card p-10 text-center">
          <p className="text-sm text-muted">No past orders yet.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => {
            const total = lineAmount(order.unitPrice, order.quantity);
            const isSaving = savingId === order.id;

            return (
              <li key={order.id}>
                <div className="glass-card flex flex-wrap items-center justify-between gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/orders/${order.id}`}
                      className="font-extrabold transition-colors hover:text-violet-600 dark:hover:text-violet-300"
                    >
                      {order.customerName}
                    </Link>
                    <p className="mt-1 text-sm text-muted">
                      {order.projectType}
                      {order.quantity != null ? ` · ×${order.quantity}` : ""}
                      {total != null ? ` · ${formatMoney(total)}` : ""}
                    </p>
                    {order.customerPhone && (
                      <p className="mt-1 text-xs text-muted">
                        {formatPhoneDisplay(order.customerPhone)}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-muted">
                      Archived {formatDate(order.paymentReceivedAt ?? order.updatedAt)}
                    </p>
                  </div>

                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[220px]">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted">
                      Restore to
                    </label>
                    <select
                      value={order.status}
                      disabled={isSaving}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="input-field py-2 text-sm disabled:opacity-60"
                    >
                      <option value={archiveStage.slug}>{archiveStage.label}</option>
                      {restoreStages.map((stage) => (
                        <option key={stage.id} value={stage.slug}>
                          {stage.label}
                        </option>
                      ))}
                    </select>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge
                        status={order.status}
                        stages={stages}
                        label={getStageLabel(stages, order.status)}
                      />
                      {order.paymentReceived && (
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                          Paid
                        </span>
                      )}
                      {isSaving && (
                        <span className="text-xs text-muted">Saving…</span>
                      )}
                    </div>
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
