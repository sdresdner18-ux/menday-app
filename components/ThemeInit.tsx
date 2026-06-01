"use client";

import { useEffect } from "react";

/** Clears stale service workers that can serve old CSS/layout on localhost. */
export default function ThemeInit() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
      });
    }

    const stored = localStorage.getItem("mendy-theme");
    const isDark = stored !== "light";
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  }, []);

  return null;
}
