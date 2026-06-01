"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  customerName?: string;
  onClose: () => void;
}

export default function PaymentRequiredModal({ customerName, onClose }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className="modal-overlay fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="modal-panel w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="payment-required-title"
      >
        <div className="modal-header px-6 pb-5 pt-6 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500/90 dark:text-amber-300/90">
                Payment required
              </p>
              <h2
                id="payment-required-title"
                className="mt-1 text-xl font-extrabold tracking-tight"
              >
                {customerName ? `${customerName}` : "Cannot complete order"}
              </h2>
              <p className="mt-3 text-sm text-muted">
                This order cannot be moved to the archive step until payment has been
                received.
              </p>
              <p className="mt-2 text-sm text-muted">
                Please confirm payment in your payment step, then try again.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="modal-close-btn"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        <div className="modal-footer px-6 py-4 sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className="btn-primary w-full sm:ml-auto sm:w-auto sm:min-w-[120px]"
          >
            Understood
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
