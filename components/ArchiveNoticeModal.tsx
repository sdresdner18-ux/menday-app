"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

interface Props {
  customerName: string;
  onClose: () => void;
}

export default function ArchiveNoticeModal({ customerName, onClose }: Props) {
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
        aria-labelledby="archive-notice-title"
      >
        <div className="modal-header px-6 pb-5 pt-6 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-500/90 dark:text-emerald-300/90">
                Order archived
              </p>
              <h2
                id="archive-notice-title"
                className="mt-1 text-xl font-extrabold tracking-tight"
              >
                {customerName}
              </h2>
              <p className="mt-3 text-sm text-muted">
                This order has been moved off the production board and saved to
                your records.
              </p>
              <p className="mt-2 text-sm text-muted">
                To view it again, open{" "}
                <span className="font-semibold text-gray-700 dark:text-[var(--dm-text)]">
                  Past Orders
                </span>{" "}
                in the sidebar.
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

        <div className="modal-footer flex flex-col-reverse gap-3 px-6 py-4 sm:flex-row sm:justify-end sm:px-7">
          <button type="button" onClick={onClose} className="btn-secondary sm:min-w-[110px]">
            Stay on board
          </button>
          <Link href="/archive" className="btn-primary text-center sm:min-w-[140px]">
            View Past Orders
          </Link>
        </div>
      </div>
    </div>,
    document.body
  );
}
