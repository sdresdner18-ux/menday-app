"use client";

export default function SignOutButton() {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className="glass rounded-xl px-3 py-2 text-xs font-bold text-muted transition-all duration-smooth ease-smooth-out hover:text-[var(--dm-text)] hover:shadow-glass-sm"
        title="Sign out"
      >
        Sign out
      </button>
    </form>
  );
}
