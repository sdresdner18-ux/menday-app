"use client";

import { useState } from "react";
import {
  Order,
  OrderDetailData,
  PROJECT_TYPES,
  PRIORITIES,
  StatusHistoryEntry,
  WorkflowStage,
} from "@/lib/types";
import {
  getArchiveStage,
  getBoardColumnStages,
  getPaymentStage,
  getStageLabel,
} from "@/lib/workflow-shared";
import PriorityBadge from "@/components/PriorityBadge";
import StatusBadge from "@/components/StatusBadge";
import AppShell from "@/components/AppShell";
import CustomerHistory from "@/components/CustomerHistory";
import CustomerMessages from "@/components/CustomerMessages";
import OrderChecklist from "@/components/OrderChecklist";
import InternalNotes from "@/components/InternalNotes";
import StatusTimeline from "@/components/StatusTimeline";
import OrderInvoice from "@/components/OrderInvoice";
import ArchiveNoticeModal from "@/components/ArchiveNoticeModal";
import PaymentRequiredModal from "@/components/PaymentRequiredModal";
import PaymentReceivedCheckbox from "@/components/PaymentReceivedCheckbox";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CustomerSelect, { CustomerFieldValue } from "@/components/CustomerSelect";
import { formatPhoneDisplay, formatPhoneInput } from "@/lib/messaging";
import OrderTeamMembers from "@/components/OrderTeamMembers";
import { formatMoney, lineAmount } from "@/lib/currency";

import type { AppShellOrderStats } from "@/lib/appShellData";

interface Props {
  data: OrderDetailData;
  stages: WorkflowStage[];
  orderStats: AppShellOrderStats;
}

type TabId = "details" | "invoice";

export default function OrderDetailClient({ data: initialData, stages, orderStats }: Props) {
  const archiveStage = getArchiveStage(stages);
  const paymentStage = getPaymentStage(stages);
  const boardStages = getBoardColumnStages(stages);
  const [order, setOrder] = useState(initialData.order);
  const [statusHistory, setStatusHistory] = useState(initialData.statusHistory);
  const [activeTab, setActiveTab] = useState<TabId>("details");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showArchiveNotice, setShowArchiveNotice] = useState(false);
  const [showPaymentRequired, setShowPaymentRequired] = useState(false);
  const router = useRouter();

  const [form, setForm] = useState<{
    customerId: string | null;
    customerName: string;
    customerPhone: string;
    projectType: string;
    quantity: string;
    unitPrice: string;
    color: string;
    deadline: string;
    filesExpected: boolean;
    priority: Order["priority"];
    notes: string;
    orderNumber: string;
    status: Order["status"];
  }>({
    customerId: order.customerId ?? order.customer?.id ?? null,
    customerName: order.customerName,
    customerPhone: order.customerPhone
      ? formatPhoneInput(order.customerPhone)
      : "",
    projectType: order.projectType,
    quantity: order.quantity?.toString() ?? "",
    unitPrice: order.unitPrice?.toString() ?? "",
    color: order.color ?? "",
    deadline: order.deadline?.split("T")[0] ?? "",
    filesExpected: order.filesExpected,
    priority: order.priority,
    notes: order.notes ?? "",
    orderNumber: order.orderNumber ?? "",
    status: order.status,
  });

  function update(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function appendStatusHistory(statusSlug: string) {
    const entry: StatusHistoryEntry = {
      id: `temp-${Date.now()}`,
      orderId: order.id,
      statusSlug,
      statusLabel: getStageLabel(stages, statusSlug),
      createdAt: new Date().toISOString(),
    };
    setStatusHistory((prev) => [...prev, entry]);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          quantity: form.quantity ? Number(form.quantity) : null,
          unitPrice: form.unitPrice ? Number(form.unitPrice) : null,
          color: form.color || null,
          deadline: form.deadline || null,
          notes: form.notes || null,
          orderNumber: form.orderNumber || null,
          customerPhone: form.customerPhone || null,
          customerId: form.customerId,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const updated = await res.json();
      if (updated.status !== order.status) {
        appendStatusHistory(updated.status);
      }
      setOrder(updated);
      setForm((prev) => ({
        ...prev,
        customerId: updated.customerId,
        customerName: updated.customerName,
        customerPhone: updated.customerPhone
          ? formatPhoneInput(updated.customerPhone)
          : "",
        unitPrice: updated.unitPrice?.toString() ?? "",
        status: updated.status,
      }));
      setEditing(false);
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this order?")) return;
    setDeleting(true);
    try {
      await fetch(`/api/orders/${order.id}`, { method: "DELETE" });
      router.push("/");
    } catch {
      setError("Failed to delete order");
      setDeleting(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    if (newStatus === order.status) return;
    if (newStatus === archiveStage.slug && !order.paymentReceived) {
      setShowPaymentRequired(true);
      return;
    }
    setError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          ...(newStatus === archiveStage.slug ? { paymentReceived: true } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update status");
      setOrder(data);
      setForm((prev) => ({ ...prev, status: data.status }));
      appendStatusHistory(data.status);
      if (newStatus === archiveStage.slug) {
        setShowArchiveNotice(true);
      }
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update status");
    }
  }

  async function handleMarkPayment(received: boolean) {
    setError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentReceived: received }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update payment");
      setOrder(data);
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update payment");
    }
  }

  function formatDate(iso: string | null) {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function focusCustomerPhone() {
    setActiveTab("details");
    setEditing(true);
    setError(null);
    window.setTimeout(() => {
      const field = document.getElementById("customer-phone-input");
      field?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (field instanceof HTMLInputElement) {
        field.focus();
      }
    }, 0);
  }

  return (
    <AppShell stages={stages} orderStats={orderStats}>
      <Link
        href={order.status === archiveStage.slug ? "/archive" : "/"}
        className="mb-5 inline-flex items-center gap-1 text-sm font-semibold text-gray-500 transition-colors hover:text-violet-600 dark:text-gray-400 dark:hover:text-violet-300"
      >
        ← Back to {order.status === archiveStage.slug ? "Past Orders" : "Board"}
      </Link>

      <div
        className="mb-5 flex flex-wrap gap-1 rounded-2xl p-1 print:hidden"
        style={{ background: "var(--dm-inset)" }}
        role="tablist"
      >
        {(
          [
            { id: "details" as const, label: "Order details" },
            { id: "invoice" as const, label: "Invoice" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
              activeTab === tab.id
                ? "bg-white text-violet-700 shadow-glass-sm dark:bg-[var(--dm-surface-2)] dark:text-violet-200"
                : "text-muted hover:text-gray-700 dark:hover:text-[var(--dm-text)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          {activeTab === "invoice" ? (
            <OrderInvoice order={order} />
          ) : (
            <>
              <div className="glass-card overflow-hidden">
                <div className="border-b border-gray-100 p-6 dark:border-[color:var(--dm-border)]">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      {editing ? (
                        <h1 className="text-2xl font-extrabold tracking-tight">
                          {form.customerName || "Customer"}
                        </h1>
                      ) : (
                        <div>
                          <h1 className="text-2xl font-extrabold tracking-tight">
                            {order.customerName}
                          </h1>
                          {order.orderNumber && (
                            <p className="mt-1 text-sm font-bold text-violet-600 dark:text-violet-300">
                              Order #{order.orderNumber}
                            </p>
                          )}
                        </div>
                      )}
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Created {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <PriorityBadge priority={order.priority} />
                      <StatusBadge status={order.status} stages={stages} />
                    </div>
                  </div>
                </div>

                <div
                  className="border-b px-6 py-4"
                  style={{ borderColor: "var(--dm-border)" }}
                >
                  <p className="section-title mb-3">Quick Status Change</p>
                  <div className="flex flex-wrap gap-2">
                    {(order.status === archiveStage.slug
                      ? [archiveStage]
                      : boardStages
                    ).map((s) => (
                      <button
                        key={s.slug}
                        onClick={() => handleStatusChange(s.slug)}
                        disabled={
                          order.status === archiveStage.slug ||
                          (s.slug === archiveStage.slug && !order.paymentReceived)
                        }
                        className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                          order.status === s.slug
                            ? "border-violet-500/50 bg-violet-500/20 text-violet-700 dark:text-violet-200"
                            : "border-gray-200 bg-white text-gray-600 hover:border-violet-500/30 dark:border-[color:var(--dm-border)] dark:bg-[var(--dm-surface)] dark:text-[var(--dm-text)] dark:opacity-80 dark:hover:border-violet-500/20 dark:hover:opacity-100"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>

                  {paymentStage && order.status === paymentStage.slug && (
                    <div
                      className="mt-4 rounded-xl border p-4"
                      style={{
                        borderColor: "var(--dm-border)",
                        background: "var(--dm-inset)",
                      }}
                    >
                      <p className="section-title mb-3">Payment</p>
                      <PaymentReceivedCheckbox
                        checked={order.paymentReceived}
                        onChange={handleMarkPayment}
                      />
                      {order.paymentReceived && (
                        <p className="mt-3 text-sm font-semibold text-emerald-600 dark:text-emerald-300">
                          Move to Completed to archive this order
                          {order.paymentReceivedAt
                            ? ` · ${formatDate(order.paymentReceivedAt)}`
                            : ""}
                        </p>
                      )}
                    </div>
                  )}

                  {order.status === archiveStage.slug && order.paymentReceived && (
                    <div
                      className="mt-4 rounded-xl border p-4"
                      style={{
                        borderColor: "var(--dm-border)",
                        background: "var(--dm-inset)",
                      }}
                    >
                      <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-300">
                        ✓ Archived · payment received
                        {order.paymentReceivedAt
                          ? ` · ${formatDate(order.paymentReceivedAt)}`
                          : ""}
                      </p>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  {editing ? (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <CustomerSelect
                          value={{
                            customerId: form.customerId,
                            customerName: form.customerName,
                            customerPhone: form.customerPhone,
                          }}
                          onChange={(customer: CustomerFieldValue) =>
                            setForm((prev) => ({ ...prev, ...customer }))
                          }
                        />
                      </div>
                      <div className="col-span-2">
                        <Field label="Order Number">
                          <input
                            value={form.orderNumber}
                            onChange={(e) => update("orderNumber", e.target.value)}
                            className="input-field"
                            placeholder="Optional"
                          />
                        </Field>
                      </div>
                      <Field label="Project Type">
                        <select
                          value={form.projectType}
                          onChange={(e) => update("projectType", e.target.value)}
                          className="input-field"
                        >
                          {PROJECT_TYPES.map((t) => (
                            <option key={t}>{t}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Quantity">
                        <input
                          type="number"
                          value={form.quantity}
                          onChange={(e) => update("quantity", e.target.value)}
                          className="input-field"
                        />
                      </Field>
                      <Field label="Unit Price ($)">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={form.unitPrice}
                          onChange={(e) => update("unitPrice", e.target.value)}
                          className="input-field"
                          placeholder="e.g. 12.50"
                        />
                      </Field>
                      <div className="col-span-2">
                        <Field label="Color / Details">
                          <input
                            value={form.color}
                            onChange={(e) => update("color", e.target.value)}
                            className="input-field"
                          />
                        </Field>
                      </div>
                      <Field label="Complete by">
                        <input
                          type="date"
                          value={form.deadline}
                          onChange={(e) => update("deadline", e.target.value)}
                          className="input-field"
                        />
                      </Field>
                      <Field label="Priority">
                        <select
                          value={form.priority}
                          onChange={(e) =>
                            update("priority", e.target.value as Order["priority"])
                          }
                          className="input-field"
                        >
                          {PRIORITIES.map((p) => (
                            <option key={p}>{p}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Status">
                        <select
                          value={form.status}
                          onChange={(e) => update("status", e.target.value)}
                          className="input-field"
                        >
                          {(order.status === archiveStage.slug
                            ? [archiveStage]
                            : boardStages
                          ).map((s) => (
                            <option key={s.slug} value={s.slug}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <div className="col-span-2 flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="editFiles"
                          checked={form.filesExpected}
                          onChange={(e) => update("filesExpected", e.target.checked)}
                          className="h-4 w-4 accent-violet-500"
                        />
                        <label
                          htmlFor="editFiles"
                          className="text-xs font-semibold text-gray-600 dark:text-gray-300"
                        >
                          Files expected
                        </label>
                      </div>
                      <div className="col-span-2">
                        <Field label="Notes">
                          <textarea
                            value={form.notes}
                            onChange={(e) => update("notes", e.target.value)}
                            rows={3}
                            className="input-field resize-none"
                          />
                        </Field>
                      </div>
                    </div>
                  ) : (
                    <dl className="grid grid-cols-2 gap-4">
                      <DetailItem label="Project Type" value={order.projectType} />
                      <DetailItem
                        label="Phone"
                        value={
                          order.customerPhone
                            ? formatPhoneDisplay(order.customerPhone)
                            : "—"
                        }
                      />
                      <DetailItem
                        label="Order Number"
                        value={order.orderNumber ?? "—"}
                      />
                      <DetailItem
                        label="Quantity"
                        value={order.quantity?.toString() ?? "—"}
                      />
                      <DetailItem
                        label="Unit Price"
                        value={formatMoney(order.unitPrice)}
                      />
                      <DetailItem
                        label="Total"
                        value={formatMoney(lineAmount(order.unitPrice, order.quantity))}
                      />
                      <DetailItem label="Color / Details" value={order.color ?? "—"} />
                      <DetailItem
                        label="Complete by"
                        value={formatDate(order.deadline)}
                        highlight={
                          !!order.deadline &&
                          new Date(order.deadline) < new Date() &&
                          order.status !== archiveStage.slug
                        }
                      />
                      <DetailItem label="Priority" value={order.priority} />
                      <div
                        className="rounded-2xl border px-4 py-3"
                        style={{
                          borderColor: "var(--dm-border)",
                          background: "var(--dm-inset)",
                        }}
                      >
                        <dt className="text-[10px] font-bold uppercase tracking-wider text-muted">
                          Status
                        </dt>
                        <dd className="mt-1">
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(e.target.value)}
                            className="input-field py-1.5"
                          >
                            {(order.status === archiveStage.slug
                            ? [archiveStage]
                            : boardStages
                          ).map((s) => (
                              <option key={s.slug} value={s.slug}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </dd>
                      </div>
                      <DetailItem
                        label="Files Expected"
                        value={order.filesExpected ? "Yes" : "No"}
                      />
                      <DetailItem label="Created" value={formatDate(order.createdAt)} />
                      {order.notes && (
                        <div
                          className="col-span-2 rounded-2xl border px-4 py-3"
                          style={{
                            borderColor: "var(--dm-border)",
                            background: "var(--dm-inset)",
                          }}
                        >
                          <dt className="text-[10px] font-bold uppercase tracking-wider text-muted">
                            Notes
                          </dt>
                          <dd className="mt-1 whitespace-pre-wrap text-sm font-semibold">
                            {order.notes}
                          </dd>
                        </div>
                      )}
                    </dl>
                  )}

                  {error && (
                    <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300">
                      {error}
                    </p>
                  )}

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-6 dark:border-[color:var(--dm-border)]">
                    {editing ? (
                      <div className="flex gap-2">
                        <button
                          onClick={handleSave}
                          disabled={saving}
                          className="btn-primary"
                        >
                          {saving ? "Saving..." : "Save Changes"}
                        </button>
                        <button
                          onClick={() => {
                            setEditing(false);
                            setError(null);
                          }}
                          className="btn-secondary"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setEditing(true)} className="btn-primary">
                        Edit Order
                      </button>
                    )}
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="rounded-2xl px-4 py-2 text-sm font-bold text-red-500 transition-colors hover:bg-red-500/10 dark:text-red-400"
                    >
                      {deleting ? "Deleting..." : "Delete Order"}
                    </button>
                  </div>
                </div>
              </div>

              <CustomerMessages
                orderId={order.id}
                order={{
                  customerName: order.customerName,
                  customerPhone: order.customerPhone,
                  orderNumber: order.orderNumber,
                  projectType: order.projectType,
                }}
                messages={initialData.orderMessages}
                onAddPhone={focusCustomerPhone}
              />

              <OrderChecklist
                orderId={order.id}
                items={initialData.checklistItems}
              />

              <InternalNotes orderId={order.id} notes={initialData.orderNotes} />

              <CustomerHistory
                orders={initialData.relatedOrders}
                customerName={order.customerName}
                stages={stages}
              />
            </>
          )}
        </div>

        <div className="space-y-6 print:hidden">
          <OrderTeamMembers
            orderId={order.id}
            initialMembers={order.teamMembers ?? []}
          />
          <StatusTimeline history={statusHistory} />
        </div>
      </div>

      {showArchiveNotice && (
        <ArchiveNoticeModal
          customerName={order.customerName}
          onClose={() => setShowArchiveNotice(false)}
        />
      )}

      {showPaymentRequired && (
        <PaymentRequiredModal
          customerName={order.customerName}
          onClose={() => setShowPaymentRequired(false)}
        />
      )}
    </AppShell>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label-field">{label}</label>
      {children}
    </div>
  );
}

function DetailItem({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="rounded-2xl border px-4 py-3"
      style={{
        borderColor: "var(--dm-border)",
        background: "var(--dm-inset)",
      }}
    >
      <dt className="text-[10px] font-bold uppercase tracking-wider text-muted">
        {label}
      </dt>
      <dd
        className={`mt-1 text-sm font-extrabold ${
          highlight ? "text-red-500 dark:text-red-400" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
