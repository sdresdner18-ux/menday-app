import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";
import { isAuthConfigured } from "@/lib/auth-config";

export default function LoginPage() {
  const configured = isAuthConfigured();

  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-8">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(139, 92, 246, 0.12), transparent), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(245, 158, 11, 0.08), transparent)",
        }}
      />

      <div className="glass-card w-full max-w-md p-8 sm:p-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-amber-400 shadow-glow">
            <span className="text-lg font-black text-white">M</span>
          </div>
          <p className="section-title mb-2">Welcome back</p>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Sign in to <span className="text-violet-500">Mendy</span>
          </h1>
          <p className="mt-2 text-sm text-muted">
            Your orders, board, and schedule — all in one place.
          </p>
        </div>

        {!configured ? (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-4 text-sm text-amber-700 dark:text-amber-300">
            <p className="font-bold">Auth not configured yet</p>
            <p className="mt-2">
              Add <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code className="text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to your{" "}
              <code className="text-xs">.env</code>, then enable Email auth in
              Supabase.
            </p>
          </div>
        ) : (
          <Suspense fallback={<div className="h-40 animate-pulse rounded-2xl bg-[var(--dm-inset)]" />}>
            <LoginForm />
          </Suspense>
        )}
      </div>
    </div>
  );
}
