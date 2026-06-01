"use client";

import { formatPhoneInput, isValidPhone } from "@/lib/messaging";

interface PhoneInputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    "type" | "value" | "onChange"
  > {
  value: string;
  onChange: (value: string) => void;
}

export default function PhoneInput({
  value,
  onChange,
  className = "input-field",
  placeholder = "050-123-4567",
  ...props
}: PhoneInputProps) {
  const invalid = !!value.trim() && !isValidPhone(value);

  return (
    <input
      {...props}
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      enterKeyHint="done"
      value={value}
      onChange={(e) => onChange(formatPhoneInput(e.target.value))}
      className={className}
      placeholder={placeholder}
      aria-invalid={invalid || undefined}
      pattern="0[0-9]{2}-[0-9]{3}-[0-9]{4}"
      title="Enter a 10-digit mobile number, e.g. 050-123-4567"
    />
  );
}
