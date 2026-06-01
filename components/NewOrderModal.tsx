"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { PROJECT_TYPES, PRIORITIES, WorkflowStage } from "@/lib/types";
import { getCreateOrderStages, getDefaultStage } from "@/lib/workflow-shared";
import { useRouter } from "next/navigation";
import CustomerSelect, { CustomerFieldValue } from "@/components/CustomerSelect";
import DeadlineRequiredModal from "@/components/DeadlineRequiredModal";
import { isValidOrderDeadline } from "@/lib/order-deadline";

const INITIAL_FORM = {
  customerId: null as string | null,
  customerName: "",
  customerPhone: "",
  orderNumber: "",
  projectType: "Magnet",
  quantity: "",
  unitPrice: "",
  color: "",
  deadline: "",
  filesExpected: false,
  priority: "Medium",
  notes: "",
  status: "new",
};

export default function NewOrderModal({
  stages,
  className,
}: {
  stages: WorkflowStage[];
  className?: string;
}) {
  const defaultStage = getDefaultStage(stages);
  const createStages = getCreateOrderStages(stages);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeadlineRequired, setShowDeadlineRequired] = useState(false);
  const deadlineRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [form, setForm] = useState({
    ...INITIAL_FORM,
    status: defaultStage.slug,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  function update(field: string, value: unknown) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function closeModal() {
    setOpen(false);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customerName.trim()) return;
    if (!isValidOrderDeadline(form.deadline)) {
      setShowDeadlineRequired(true);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create order");
      closeModal();
      setForm({ ...INITIAL_FORM, status: defaultStage.slug });
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={className ?? "btn-secondary"}
      >
        <span className="text-lg leading-none text-violet-500">+</span> New Order
      </button>

      {open &&
        mounted &&
        createPortal(
          <div
            className="modal-overlay fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
            onClick={closeModal}
          >
            <div className="modal-panel w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
              <form onSubmit={handleSubmit} className="flex max-h-[min(90vh,820px)] flex-col">
                <div className="modal-header shrink-0 px-6 pb-5 pt-6 sm:px-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-500/80 dark:text-violet-300/80">
                        Create
                      </p>
                      <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                        New Order
                      </h2>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Add a job to the production board
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="modal-close-btn"
                      aria-label="Close"
                    >
                      ×
                    </button>
                  </div>
                </div>

                <div className="modal-scroll flex-1 overflow-y-auto px-6 sm:px-7">
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <CustomerSelect
                      autoFocus
                      nameRequired
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

                  <Field label="Order number" hint="Optional" className="sm:col-span-2">
                      <input
                        value={form.orderNumber}
                        onChange={(e) => update("orderNumber", e.target.value)}
                        className="input-field"
                        placeholder="e.g. ORD-1042"
                      />
                    </Field>

                    <Field label="Project type">
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
                        min="1"
                        value={form.quantity}
                        onChange={(e) => update("quantity", e.target.value)}
                        className="input-field"
                        placeholder="e.g. 50"
                      />
                    </Field>

                    <Field label="Unit price ($)">
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

                    <Field label="Color / details" className="sm:col-span-2">
                      <input
                        value={form.color}
                        onChange={(e) => update("color", e.target.value)}
                        className="input-field"
                        placeholder="e.g. Gold finish, 5cm round"
                      />
                    </Field>

                    <Field label="Complete by" required>
                      <input
                        ref={deadlineRef}
                        type="date"
                        required
                        value={form.deadline}
                        onChange={(e) => update("deadline", e.target.value)}
                        className="input-field"
                      />
                    </Field>

                    <Field label="Priority">
                      <select
                        value={form.priority}
                        onChange={(e) => update("priority", e.target.value)}
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
                        {createStages.map((s) => (
                          <option key={s.id} value={s.slug}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <div className="flex items-center sm:pt-7">
                      <label className="checkbox-field">
                        <input
                          type="checkbox"
                          checked={form.filesExpected}
                          onChange={(e) => update("filesExpected", e.target.checked)}
                        />
                        <span>Files expected from customer</span>
                      </label>
                    </div>

                    <Field label="Notes" className="sm:col-span-2">
                      <textarea
                        value={form.notes}
                        onChange={(e) => update("notes", e.target.value)}
                        rows={3}
                        className="input-field resize-none"
                        placeholder="Any additional notes..."
                      />
                    </Field>
                  </div>

                  {error && (
                    <p className="mt-5 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
                      {error}
                    </p>
                  )}
                </div>

                <div className="modal-footer shrink-0 px-6 py-4 sm:px-7">
                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button type="button" onClick={closeModal} className="btn-secondary sm:min-w-[110px]">
                      Cancel
                    </button>
                    <button type="submit" disabled={saving} className="btn-primary sm:min-w-[160px]">
                      {saving ? "Creating..." : "Create Order"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {showDeadlineRequired && (
        <DeadlineRequiredModal
          onClose={() => {
            setShowDeadlineRequired(false);
            deadlineRef.current?.focus();
          }}
        />
      )}
    </>
  );
}

function Field({
  label,
  hint,
  required,
  className = "",
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <div className="mb-2 flex items-baseline gap-2">
        <label className="label-field">
          {label}
          {required && <span className="text-violet-500"> *</span>}
        </label>
        {hint && <span className="text-xs text-gray-400 dark:text-gray-500">{hint}</span>}
      </div>
      {children}
    </div>
  );
}
