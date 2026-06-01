import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { trackingCookieOptions } from "@/lib/tracking-auth";
import { checkRateLimit } from "@/lib/tracking-rate-limit";
import { verifyPhoneLastFour } from "@/lib/tracking-server";

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const rateKey = `${params.token}:${forwarded ?? "unknown"}`;
    if (!checkRateLimit(rateKey)) {
      return NextResponse.json(
        { error: "Too many attempts. Please wait a minute and try again." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const lastFour =
      typeof body.lastFour === "string" ? body.lastFour.replace(/\D/g, "") : "";

    if (lastFour.length !== 4) {
      return NextResponse.json(
        { error: "Enter the last 4 digits of your phone number." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { trackingToken: params.token },
      select: { customerPhone: true },
    });

    if (!order) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    if (!verifyPhoneLastFour(order.customerPhone, lastFour)) {
      return NextResponse.json(
        { error: "That didn't match — try again." },
        { status: 401 }
      );
    }

    const cookie = trackingCookieOptions(params.token);
    const response = NextResponse.json({ verified: true });
    response.cookies.set(cookie);
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
