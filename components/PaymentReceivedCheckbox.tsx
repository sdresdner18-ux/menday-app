"use client";

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  compact?: boolean;
}

export default function PaymentReceivedCheckbox({
  checked,
  onChange,
  disabled = false,
  compact = false,
}: Props) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-2 ${
        compact ? "text-[11px]" : "text-sm"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 shrink-0 accent-emerald-500"
      />
      <span className={`font-semibold ${checked ? "text-emerald-600 dark:text-emerald-300" : ""}`}>
        Payment received
      </span>
    </label>
  );
}
