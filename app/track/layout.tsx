import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Track Your Order — Mendy",
  description: "See the latest status of your custom order.",
};

export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900" data-theme="light">
      {children}
    </div>
  );
}
