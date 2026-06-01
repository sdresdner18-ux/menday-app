import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureWorkflowStages, serializeWorkflowStage } from "@/lib/workflow";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const existing = await prisma.workflowStage.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Stage not found" }, { status: 404 });
    }

    const label =
      body.label !== undefined ? String(body.label).trim() : existing.label;
    if (!label) {
      return NextResponse.json({ error: "Stage name is required" }, { status: 400 });
    }

    const color =
      body.color !== undefined ? String(body.color).trim() : existing.color;

    const updated = await prisma.workflowStage.update({
      where: { id: params.id },
      data: { label, color },
    });

    if (existing.stageType === "Archive" || existing.stageType === "Payment") {
      // Keep slug stable for system stages; only label/color change
    }

    if (label !== existing.label) {
      await prisma.statusHistory.updateMany({
        where: { statusSlug: existing.slug },
        data: { statusLabel: label },
      });
    }

    return NextResponse.json(serializeWorkflowStage(updated));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update stage" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const existing = await prisma.workflowStage.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Stage not found" }, { status: 404 });
    }

    if (existing.stageType !== "Normal") {
      return NextResponse.json(
        { error: "Payment and archive stages cannot be removed" },
        { status: 400 }
      );
    }

    const orderCount = await prisma.order.count({
      where: { status: existing.slug },
    });

    if (orderCount > 0) {
      return NextResponse.json(
        {
          error: `Move or complete ${orderCount} order(s) before removing this stage.`,
        },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.workflowStage.delete({ where: { id: params.id } });
      const remaining = await tx.workflowStage.findMany({
        orderBy: { position: "asc" },
      });
      await Promise.all(
        remaining.map((stage, position) =>
          tx.workflowStage.update({
            where: { id: stage.id },
            data: { position },
          })
        )
      );
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete stage" }, { status: 500 });
  }
}
