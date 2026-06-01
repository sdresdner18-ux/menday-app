export function isAuthConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function isEmailAllowed(email: string | undefined): boolean {
  const allowlist = process.env.ALLOWED_EMAILS?.trim();
  if (!allowlist) return true;
  const allowed = allowlist
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes((email ?? "").toLowerCase());
}
