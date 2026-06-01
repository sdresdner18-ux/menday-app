import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const notes = await prisma.orderNote.findMany({
      where: { orderId: params.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      notes.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch notes" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { content } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: "Note content required" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: params.id } });
    if (!order) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const note = await prisma.orderNote.create({
      data: {
        orderId: params.id,
        content: content.trim(),
      },
    });

    return NextResponse.json({
      ...note,
      createdAt: note.createdAt.toISOString(),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to add note" }, { status: 500 });
  }
}
