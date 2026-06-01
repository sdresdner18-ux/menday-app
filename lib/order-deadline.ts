export function isValidOrderDeadline(
  deadline: string | null | undefined
): boolean {
  if (!deadline || !String(deadline).trim()) return false;
  const parsed = new Date(deadline);
  return !Number.isNaN(parsed.getTime());
}
