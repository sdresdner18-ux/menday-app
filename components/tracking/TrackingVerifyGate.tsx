"use client";

import { useRef, useState, KeyboardEvent } from "react";

interface Props {
  onVerify: (lastFour: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export default function TrackingVerifyGate({ onVerify, loading, error }: Props) {
  const [digits, setDigits] = useState(["", "", "", ""]);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  function updateDigit(index: number, value: string) {
    const next = value.replace(/\D/g, "").slice(-1);
    const updated = [...digits];
    updated[index] = next;
    setDigits(updated);

    if (next && index < 3) {
      inputsRef.current[index + 1]?.focus();
    }

    if (updated.every((digit) => digit.length === 1)) {
      void onVerify(updated.join(""));
    }
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (!pasted) return;

    const updated = pasted.split("").concat(["", "", "", ""]).slice(0, 4);
    setDigits(updated);

    if (updated.every((digit) => digit.length === 1)) {
      void onVerify(updated.join(""));
      return;
    }

    const nextIndex = Math.min(pasted.length, 3);
    inputsRef.current[nextIndex]?.focus();
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-extrabold tracking-tight text-gray-900">
        Verify it&apos;s you
      </h2>
      <p className="mt-2 text-sm text-gray-600">
        Enter the last 4 digits of the phone number on this order.
      </p>

      <div className="mt-6 flex justify-center gap-3">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              inputsRef.current[index] = element;
            }}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={digit}
            onChange={(event) => updateDigit(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            disabled={loading}
            aria-label={`Digit ${index + 1}`}
            className="h-14 w-12 rounded-xl border border-gray-200 bg-gray-50 text-center text-xl font-extrabold text-gray-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-60"
          />
        ))}
      </div>

      {error ? (
        <p className="mt-4 text-center text-sm font-semibold text-red-600">{error}</p>
      ) : null}

      <button
        type="button"
        onClick={() => {
          if (digits.every((digit) => digit.length === 1)) {
            void onVerify(digits.join(""));
          }
        }}
        disabled={loading || digits.some((digit) => !digit)}
        className="mt-6 w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Checking..." : "View order status"}
      </button>
    </div>
  );
}
