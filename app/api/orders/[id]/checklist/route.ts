import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { itemId, checked } = await req.json();

    if (!itemId || typeof checked !== "boolean") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const item = await prisma.checklistItem.findFirst({
      where: { id: itemId, orderId: params.id },
    });

    if (!item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.checklistItem.update({
      where: { id: itemId },
      data: { checked },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update checklist" }, { status: 500 });
  }
}
