import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MessageChannel, MessageDirection } from "@prisma/client";

const VALID_CHANNELS: MessageChannel[] = ["WhatsApp", "SMS", "Manual"];
const VALID_DIRECTIONS: MessageDirection[] = ["Outbound", "Inbound"];

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const messages = await prisma.orderMessage.findMany({
      where: { orderId: params.id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(
      messages.map((m) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { body, direction, channel } = await req.json();

    if (!body?.trim()) {
      return NextResponse.json({ error: "Message body required" }, { status: 400 });
    }

    if (!VALID_DIRECTIONS.includes(direction)) {
      return NextResponse.json({ error: "Invalid direction" }, { status: 400 });
    }

    if (!VALID_CHANNELS.includes(channel)) {
      return NextResponse.json({ error: "Invalid channel" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: params.id } });
    if (!order) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const message = await prisma.orderMessage.create({
      data: {
        orderId: params.id,
        direction,
        channel,
        body: body.trim(),
      },
    });

    return NextResponse.json({
      ...message,
      createdAt: message.createdAt.toISOString(),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to add message" }, { status: 500 });
  }
}
