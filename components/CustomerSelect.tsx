"use client";

import { useEffect, useRef, useState } from "react";
import { Customer } from "@/lib/types";
import { formatPhoneDisplay, formatPhoneInput } from "@/lib/messaging";
import PhoneInput from "./PhoneInput";

export interface CustomerFieldValue {
  customerId: string | null;
  customerName: string;
  customerPhone: string;
}

interface Props {
  value: CustomerFieldValue;
  onChange: (value: CustomerFieldValue) => void;
  nameRequired?: boolean;
  autoFocus?: boolean;
  phoneInputId?: string;
}

export default function CustomerSelect({
  value,
  onChange,
  nameRequired = false,
  autoFocus = false,
  phoneInputId = "customer-phone-input",
}: Props) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Database search field
  const [dbSearch, setDbSearch] = useState(value.customerName ?? "");
  const [dbOpen, setDbOpen] = useState(false);
  const dbRef = useRef<HTMLDivElement>(null);

  // Name field autocomplete
  const [nameOpen, setNameOpen] = useState(false);
  const nameRef = useRef<HTMLDivElement>(null);

  // Quick-add state
  const [quickAdding, setQuickAdding] = useState(false);

  // Initialise db search display when value is pre-populated (e.g. edit flows)
  const initialised = useRef(false);
  useEffect(() => {
    if (!initialised.current && value.customerName) {
      setDbSearch(value.customerName);
      initialised.current = true;
    }
  }, [value.customerName]);

  useEffect(() => {
    let cancelled = false;
    async function loadCustomers() {
      try {
        const res = await fetch("/api/customers");
        if (!res.ok) throw new Error("Failed to load customers");
        const data = (await res.json()) as Customer[];
        if (!cancelled) setCustomers(data);
      } catch {
        if (!cancelled) setCustomers([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadCustomers();
    return () => {
      cancelled = true;
    };
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dbRef.current && !dbRef.current.contains(e.target as Node)) {
        setDbOpen(false);
      }
      if (nameRef.current && !nameRef.current.contains(e.target as Node)) {
        setNameOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function pickCustomer(customer: Customer) {
    const phone = customer.phone ? formatPhoneInput(customer.phone) : "";
    onChange({ customerId: customer.id, customerName: customer.name, customerPhone: phone });
    setDbSearch(customer.name);
    setDbOpen(false);
    setNameOpen(false);
  }

  function clearSelection() {
    onChange({ customerId: null, customerName: "", customerPhone: "" });
    setDbSearch("");
  }

  // Filtered lists
  const dbQuery = dbSearch.trim().toLowerCase();
  const dbFiltered = dbQuery
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(dbQuery) ||
          (c.phone && c.phone.includes(dbSearch.trim()))
      )
    : customers;

  const nameQuery = value.customerName.trim();
  const nameFiltered = nameQuery
    ? customers.filter((c) =>
        c.name.toLowerCase().includes(nameQuery.toLowerCase())
      )
    : [];

  const hasExactMatch = customers.some(
    (c) => c.name.toLowerCase() === nameQuery.toLowerCase()
  );
  const showQuickAdd = nameQuery.length > 0 && !hasExactMatch && !value.customerId;

  async function handleQuickAdd() {
    if (!nameQuery || quickAdding) return;
    setQuickAdding(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameQuery,
          phone: value.customerPhone || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to create customer");
      const newCustomer = (await res.json()) as Customer;
      setCustomers((prev) =>
        [...prev, newCustomer].sort((a, b) => a.name.localeCompare(b.name))
      );
      onChange({
        customerId: newCustomer.id,
        customerName: newCustomer.name,
        customerPhone: value.customerPhone,
      });
      setDbSearch(newCustomer.name);
      setNameOpen(false);
    } catch {
      // silently ignore
    } finally {
      setQuickAdding(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* ── Customer database search ── */}
      <div ref={dbRef}>
        <label className="label-field mb-2 block">Customer database</label>
        <div className="relative">
          <input
            type="text"
            value={dbSearch}
            onChange={(e) => {
              const q = e.target.value;
              setDbSearch(q);
              setDbOpen(true);
              if (!q) clearSelection();
            }}
            onFocus={() => setDbOpen(true)}
            className="input-field pr-8"
            placeholder={loading ? "Loading customers…" : "Search customers…"}
            disabled={loading}
          />
          {dbSearch && (
            <button
              type="button"
              onClick={clearSelection}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-lg leading-none text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Clear"
            >
              ×
            </button>
          )}

          {dbOpen && (
            <>
              {dbFiltered.length > 0 ? (
                <ul className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                  {dbFiltered.map((customer) => (
                    <li key={customer.id}>
                      <button
                        type="button"
                        onMouseDown={() => pickCustomer(customer)}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <span className="font-medium text-gray-900 dark:text-white">
                          {customer.name}
                        </span>
                        {customer.phone && (
                          <span className="ml-2 text-gray-500 dark:text-gray-400">
                            {formatPhoneDisplay(customer.phone)}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : dbQuery ? (
                <div className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                  No customers found
                </div>
              ) : null}
            </>
          )}
        </div>
        <p className="mt-1.5 text-xs text-muted">
          Search existing customers, or leave blank to create a new one.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* ── Customer name with autocomplete + Quick add ── */}
        <div className="sm:col-span-2" ref={nameRef}>
          <label className="label-field mb-2 block">
            Customer name{nameRequired ? " *" : ""}
          </label>
          <div className="relative">
            <input
              required={nameRequired}
              autoFocus={autoFocus}
              value={value.customerName}
              onChange={(e) => {
                onChange({
                  ...value,
                  customerId: null,
                  customerName: e.target.value,
                });
                setDbSearch(e.target.value);
                setNameOpen(true);
              }}
              onFocus={() => {
                if (value.customerName) setNameOpen(true);
              }}
              className="input-field"
              placeholder="e.g. Moshe Cohen"
            />

            {nameOpen && nameQuery && (nameFiltered.length > 0 || showQuickAdd) && (
              <ul className="absolute z-50 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                {nameFiltered.map((customer) => (
                  <li key={customer.id}>
                    <button
                      type="button"
                      onMouseDown={() => pickCustomer(customer)}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <span className="font-medium text-gray-900 dark:text-white">
                        {customer.name}
                      </span>
                      {customer.phone && (
                        <span className="ml-2 text-gray-500 dark:text-gray-400">
                          {formatPhoneDisplay(customer.phone)}
                        </span>
                      )}
                    </button>
                  </li>
                ))}

                {showQuickAdd && (
                  <li>
                    <button
                      type="button"
                      onMouseDown={handleQuickAdd}
                      disabled={quickAdding}
                      className="flex w-full items-center gap-1.5 px-3 py-2 text-left text-sm font-medium text-violet-600 hover:bg-violet-50 disabled:opacity-60 dark:text-violet-400 dark:hover:bg-violet-900/20"
                    >
                      <span className="text-base leading-none">+</span>
                      {quickAdding ? "Adding…" : `Quick add "${nameQuery}"`}
                    </button>
                  </li>
                )}
              </ul>
            )}
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="label-field mb-2 block">Customer phone</label>
          <PhoneInput
            id={phoneInputId}
            value={value.customerPhone}
            onChange={(phone) => onChange({ ...value, customerPhone: phone })}
          />
        </div>
      </div>
    </div>
  );
}
