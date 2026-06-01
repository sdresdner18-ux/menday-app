"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  onClose: () => void;
}

export default function DeadlineRequiredModal({ onClose }: Props) {
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
      className="modal-overlay fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="modal-panel w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="deadline-required-title"
      >
        <div className="modal-header px-6 pb-5 pt-6 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-500/90 dark:text-violet-300/90">
                One quick thing
              </p>
              <h2
                id="deadline-required-title"
                className="mt-1 text-xl font-extrabold tracking-tight"
              >
                When should this order be completed?
              </h2>
              <p className="mt-3 text-sm text-muted">
                Every job needs a completion date — it&apos;s how you keep customers
                happy and stay out of last-minute scramble mode.
              </p>
              <p className="mt-2 text-sm text-muted">
                Pick when the order should be done and you&apos;re good to go. Your
                future self will thank you!
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
            className="btn-primary w-full sm:ml-auto sm:w-auto sm:min-w-[140px]"
          >
            Got it — I&apos;ll pick a date
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
