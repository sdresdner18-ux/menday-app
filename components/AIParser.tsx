"use client";
import { useState } from "react";
import { ParsedOrder, PROJECT_TYPES, PRIORITIES } from "@/lib/types";
import { useRouter } from "next/navigation";
import CustomerSelect, { CustomerFieldValue } from "@/components/CustomerSelect";
import { formatPhoneInput } from "@/lib/messaging";

export default function AIParser() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState<ParsedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  async function handleParse() {
    if (!message.trim()) return;
    setLoading(true);
    setError(null);
    setParsed(null);
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Parse failed");
      setParsed({
        ...data,
        orderNumber: data.orderNumber ?? null,
        customerPhone: data.customerPhone
          ? formatPhoneInput(data.customerPhone)
          : null,
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!parsed) return;
    setCreating(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      if (!res.ok) throw new Error("Failed to create order");
      setParsed(null);
      setMessage("");
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setCreating(false);
    }
  }

  function updateParsed(field: keyof ParsedOrder, value: unknown) {
    if (!parsed) return;
    setParsed({ ...parsed, [field]: value });
  }

  return (
    <div className="glass-card mb-6 overflow-hidden">
      <div className="border-b px-5 py-4" style={{ borderColor: "var(--dm-border)" }}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-amber-400 text-sm text-white shadow-glass-sm">
            ✨
          </div>
          <div>
            <h2 className="font-extrabold text-violet-600 dark:text-violet-300">
              Order Parser
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Paste a WhatsApp message — AI extracts the order in seconds
            </p>
          </div>
        </div>
      </div>

      <div className="p-5">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={`Paste a WhatsApp message or order note...\n\nExample: "Moshe needs 50 gold magnets for his store, logo coming tomorrow, needed by next Wednesday"`}
          className="input-field h-28 resize-none"
        />

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={handleParse}
            disabled={loading || !message.trim()}
            className="btn-primary"
          >
            {loading ? (
              <>
                <span className="animate-spin">⟳</span> Parsing...
              </>
            ) : (
              <>✨ Parse with AI</>
            )}
          </button>
          <button
            onClick={() => {
              setMessage("");
              setParsed(null);
              setError(null);
            }}
            className="btn-secondary"
          >
            Clear
          </button>
        </div>

        {error && (
          <p className="mt-3 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-300">
            {error}
          </p>
        )}

        {parsed && (
          <div className="glass-card-inner mt-4 p-4">
            <h3 className="mb-3 text-sm font-extrabold text-violet-600 dark:text-violet-300">
              Preview — review before creating
            </h3>
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div className="sm:col-span-2">
                <CustomerSelect
                  value={{
                    customerId: parsed.customerId ?? null,
                    customerName: parsed.customerName,
                    customerPhone: parsed.customerPhone ?? "",
                  }}
                  onChange={(customer: CustomerFieldValue) =>
                    setParsed((prev) =>
                      prev
                        ? {
                            ...prev,
                            customerId: customer.customerId,
                            customerName: customer.customerName,
                            customerPhone: customer.customerPhone || null,
                          }
                        : prev
                    )
                  }
                />
              </div>
              <Field label="Order Number">
                <input
                  value={parsed.orderNumber ?? ""}
                  onChange={(e) =>
                    updateParsed("orderNumber", e.target.value || null)
                  }
                  className="input-field py-1.5"
                  placeholder="Optional"
                />
              </Field>
              <Field label="Project Type">
                <select
                  value={parsed.projectType}
                  onChange={(e) => updateParsed("projectType", e.target.value)}
                  className="input-field py-1.5"
                >
                  {PROJECT_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </Field>
              <Field label="Quantity">
                <input
                  type="number"
                  value={parsed.quantity ?? ""}
                  onChange={(e) =>
                    updateParsed(
                      "quantity",
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  className="input-field py-1.5"
                />
              </Field>
              <Field label="Unit price ($)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={parsed.unitPrice ?? ""}
                  onChange={(e) =>
                    updateParsed(
                      "unitPrice",
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  className="input-field py-1.5"
                  placeholder="Per unit"
                />
              </Field>
              <Field label="Color / Details">
                <input
                  value={parsed.color ?? ""}
                  onChange={(e) => updateParsed("color", e.target.value || null)}
                  className="input-field py-1.5"
                />
              </Field>
              <Field label="Deadline">
                <input
                  type="date"
                  value={parsed.deadline?.split("T")[0] ?? ""}
                  onChange={(e) =>
                    updateParsed("deadline", e.target.value || null)
                  }
                  className="input-field py-1.5"
                />
              </Field>
              <Field label="Priority">
                <select
                  value={parsed.priority}
                  onChange={(e) => updateParsed("priority", e.target.value)}
                  className="input-field py-1.5"
                >
                  {PRIORITIES.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Notes">
                  <textarea
                    value={parsed.notes ?? ""}
                    onChange={(e) =>
                      updateParsed("notes", e.target.value || null)
                    }
                    rows={2}
                    className="input-field resize-none py-1.5"
                  />
                </Field>
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <input
                  type="checkbox"
                  id="filesExpected"
                  checked={parsed.filesExpected}
                  onChange={(e) =>
                    updateParsed("filesExpected", e.target.checked)
                  }
                  className="h-4 w-4 accent-violet-500"
                />
                <label
                  htmlFor="filesExpected"
                  className="text-xs font-semibold text-gray-600 dark:text-gray-300"
                >
                  Files / logo expected from customer
                </label>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={handleCreate}
                disabled={creating}
                className="btn-success"
              >
                {creating ? "Creating..." : "✓ Create Order"}
              </button>
              <button
                onClick={() => setParsed(null)}
                className="btn-secondary"
              >
                Discard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
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
