import { User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { isAuthConfigured, isEmailAllowed } from "@/lib/auth-config";
import { createClient } from "@/lib/supabase/server";

export { isAuthConfigured, isEmailAllowed } from "@/lib/auth-config";

export async function getSessionUser(): Promise<User | null> {
  if (!isAuthConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isEmailAllowed(user.email)) return null;
  return user;
}

export async function requireAuth(): Promise<{
  user: User | null;
  error: NextResponse | null;
}> {
  if (!isAuthConfigured()) {
    return { user: null, error: null };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!isEmailAllowed(user.email)) {
    return {
      user: null,
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { user, error: null };
}
