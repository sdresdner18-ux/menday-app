"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const queryError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const errorText = useMemo(() => {
    if (message) return message;
    if (queryError === "not_allowed") {
      return "This email is not authorized to access Mendy.";
    }
    if (queryError === "auth_failed") {
      return "Sign-in failed. Please try again.";
    }
    return null;
  }, [message, queryError]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const supabase = createClient();

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        router.push(next);
        router.refresh();
        return;
      }

      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) throw error;
      setMessage("Check your email to confirm your account, then sign in.");
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="label-field mb-2 block" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
          placeholder="you@yourshop.com"
        />
      </div>

      <div>
        <label className="label-field mb-2 block" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field"
          placeholder="At least 8 characters"
        />
      </div>

      {errorText && (
        <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
          {errorText}
        </p>
      )}

      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading
          ? "Please wait..."
          : mode === "signin"
            ? "Sign in to Mendy"
            : "Create account"}
      </button>

      <div className="flex items-center justify-center gap-2 text-sm">
        <span className="text-muted">
          {mode === "signin" ? "First time here?" : "Already have access?"}
        </span>
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setMessage(null);
          }}
          className="font-bold text-violet-500 hover:text-violet-400"
        >
          {mode === "signin" ? "Create account" : "Sign in"}
        </button>
      </div>
    </form>
  );
}
