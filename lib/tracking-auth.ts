import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE_PREFIX = "track_verified_";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

function getTrackingSecret(): string {
  return (
    process.env.TRACKING_COOKIE_SECRET?.trim() ||
    process.env.DATABASE_URL?.trim() ||
    "mendy-tracking-dev-secret"
  );
}

function signToken(trackingToken: string): string {
  return createHmac("sha256", getTrackingSecret())
    .update(trackingToken)
    .digest("hex");
}

function cookieName(trackingToken: string): string {
  return `${COOKIE_PREFIX}${trackingToken}`;
}

export function createTrackingCookieValue(trackingToken: string): string {
  return signToken(trackingToken);
}

export function isTrackingVerified(trackingToken: string): boolean {
  const expected = signToken(trackingToken);
  const value = cookies().get(cookieName(trackingToken))?.value;
  if (!value || value.length !== expected.length) return false;

  try {
    return timingSafeEqual(Buffer.from(value), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function trackingCookieOptions(trackingToken: string) {
  return {
    name: cookieName(trackingToken),
    value: createTrackingCookieValue(trackingToken),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: "/",
  };
}
