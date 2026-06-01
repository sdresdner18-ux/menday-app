"use client";

import Link from "next/link";
import { Customer } from "@/lib/types";
import { formatPhoneDisplay } from "@/lib/messaging";
import PhoneInput from "./PhoneInput";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface Props {
  customers: Customer[];
  orderCounts: Record<string, number>;
  latestOrderByCustomer: Record<string, string | null>;
}

export default function CustomerDirectory({
  customers,
  orderCounts,
  latestOrderByCustomer,
}: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = customers.filter((customer) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      customer.name.toLowerCase().includes(q) ||
      (customer.phone ?? "").includes(q)
    );
  });

  function startEdit(customer: Customer) {
    setEditingId(customer.id);
    setEditName(customer.name);
    setEditPhone(customer.phone ?? "");
    setEditNotes(customer.notes ?? "");
    setActionError(null);
    setShowAdd(false);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditPhone("");
    setEditNotes("");
    setActionError(null);
  }

  async function handleAddCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone: phone || null }),
      });
      if (!res.ok) throw new Error("Failed to add customer");
      setName("");
      setPhone("");
      setShowAdd(false);
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId || !editName.trim()) return;

    setBusyId(editingId);
    setActionError(null);
    try {
      const res = await fetch(`/api/customers/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          phone: editPhone || null,
          notes: editNotes || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to update customer");
      }
      cancelEdit();
      router.refresh();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(customer: Customer) {
    const orderCount = orderCounts[customer.id] ?? 0;
    if (orderCount > 0) {
      setActionError(
        `Cannot delete ${customer.name} — ${orderCount} linked order(s).`
      );
      return;
    }

    if (!window.confirm(`Delete ${customer.name}? This cannot be undone.`)) {
      return;
    }

    setBusyId(customer.id);
    setActionError(null);
    try {
      const res = await fetch(`/api/customers/${customer.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to delete customer");
      }
      if (editingId === customer.id) cancelEdit();
      router.refresh();
    } catch (e: unknown) {
      setActionError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-title mb-1">Customer database</p>
          <h2 className="text-2xl font-extrabold tracking-tight">
            {customers.length} customer{customers.length !== 1 ? "s" : ""}
          </h2>
        </div>
        <button
          onClick={() => {
            setShowAdd((v) => !v);
            cancelEdit();
          }}
          className="btn-secondary"
        >
          {showAdd ? "Cancel" : "+ Add customer"}
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleAddCustomer}
          className="glass-card mb-6 grid gap-4 p-5 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <label className="label-field mb-2 block">Customer name</label>
            <input
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="e.g. Moshe Cohen"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label-field mb-2 block">Phone</label>
            <PhoneInput value={phone} onChange={setPhone} />
          </div>
          {error && (
            <p className="sm:col-span-2 text-sm text-red-500 dark:text-red-400">
              {error}
            </p>
          )}
          <div className="sm:col-span-2">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Saving..." : "Save customer"}
            </button>
          </div>
        </form>
      )}

      {actionError && !editingId && (
        <p className="mb-4 text-sm text-red-500 dark:text-red-400">{actionError}</p>
      )}

      <div className="mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or phone..."
          className="input-field max-w-md"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card p-8 text-center">
          <p className="text-sm text-muted">
            {customers.length === 0
              ? "No customers yet. Add one above or create an order."
              : "No customers match your search."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((customer) => {
            const latestOrderId = latestOrderByCustomer[customer.id];
            const isEditing = editingId === customer.id;
            const isBusy = busyId === customer.id;

            if (isEditing) {
              return (
                <li key={customer.id}>
                  <form
                    onSubmit={handleSaveEdit}
                    className="glass-card grid gap-4 p-5 sm:grid-cols-2"
                  >
                    <div className="sm:col-span-2">
                      <label className="label-field mb-2 block">Customer name</label>
                      <input
                        required
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="input-field"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="label-field mb-2 block">Phone</label>
                      <PhoneInput value={editPhone} onChange={setEditPhone} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="label-field mb-2 block">Notes</label>
                      <textarea
                        value={editNotes}
                        onChange={(e) => setEditNotes(e.target.value)}
                        className="input-field min-h-[80px] resize-y"
                        placeholder="Optional notes..."
                      />
                    </div>
                    {actionError && (
                      <p className="sm:col-span-2 text-sm text-red-500 dark:text-red-400">
                        {actionError}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 sm:col-span-2">
                      <button
                        type="submit"
                        disabled={isBusy}
                        className="btn-primary"
                      >
                        {isBusy ? "Saving..." : "Save changes"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={isBusy}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </li>
              );
            }

            return (
              <li key={customer.id}>
                <div className="glass-card flex flex-wrap items-center justify-between gap-4 p-4">
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-amber-400/20 text-lg font-extrabold text-violet-600 dark:text-violet-300">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-base font-extrabold">
                        {customer.name}
                      </p>
                      <p className="text-sm text-muted">
                        {customer.phone
                          ? formatPhoneDisplay(customer.phone)
                          : "No phone"}
                      </p>
                      {customer.notes ? (
                        <p className="mt-1 truncate text-xs text-muted">
                          {customer.notes}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-xl border px-3 py-1.5 text-xs font-bold text-muted"
                      style={{
                        borderColor: "var(--dm-border)",
                        background: "var(--dm-inset)",
                      }}
                    >
                      {orderCounts[customer.id] ?? 0} order
                      {(orderCounts[customer.id] ?? 0) !== 1 ? "s" : ""}
                    </span>
                    {latestOrderId ? (
                      <Link
                        href={`/orders/${latestOrderId}`}
                        className="btn-secondary py-2 text-xs"
                      >
                        Latest order
                      </Link>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => startEdit(customer)}
                      disabled={isBusy}
                      className="btn-secondary py-2 text-xs"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(customer)}
                      disabled={isBusy}
                      className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-500/20 disabled:opacity-50 dark:text-red-400"
                    >
                      Delete
                    </button>
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
