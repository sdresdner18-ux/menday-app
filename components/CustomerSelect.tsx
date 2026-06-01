"use client";

import { useEffect, useState } from "react";
import { Customer } from "@/lib/types";
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

  function handleCustomerPick(customerId: string) {
    if (!customerId) {
      onChange({
        customerId: null,
        customerName: "",
        customerPhone: "",
      });
      return;
    }

    const customer = customers.find((entry) => entry.id === customerId);
    if (!customer) return;

    onChange({
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone ?? "",
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="label-field mb-2 block">Customer database</label>
        <select
          value={value.customerId ?? ""}
          onChange={(e) => handleCustomerPick(e.target.value)}
          className="input-field"
          disabled={loading}
        >
          <option value="">
            {loading ? "Loading customers..." : "New customer"}
          </option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
              {customer.phone ? ` · ${customer.phone}` : ""}
            </option>
          ))}
        </select>
        <p className="mt-1.5 text-xs text-muted">
          Pick an existing customer or leave on New customer to create one.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="label-field mb-2 block">
            Customer name{ nameRequired ? " *" : "" }
          </label>
          <input
            required={nameRequired}
            autoFocus={autoFocus}
            value={value.customerName}
            onChange={(e) =>
              onChange({
                ...value,
                customerName: e.target.value,
              })
            }
            className="input-field"
            placeholder="e.g. Moshe Cohen"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="label-field mb-2 block">Customer phone</label>
          <PhoneInput
            id={phoneInputId}
            value={value.customerPhone}
            onChange={(phone) =>
              onChange({
                ...value,
                customerPhone: phone,
              })
            }
          />
        </div>
      </div>
    </div>
  );
}
