import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureWorkflowStages } from "@/lib/workflow";

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const orderedIds = body.orderedIds as string[] | undefined;

    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json({ error: "orderedIds is required" }, { status: 400 });
    }

    const stages = await ensureWorkflowStages();
    if (orderedIds.length !== stages.length) {
      return NextResponse.json({ error: "Invalid stage order" }, { status: 400 });
    }

    const archive = stages.find((s) => s.stageType === "Archive");
    if (archive && orderedIds[orderedIds.length - 1] !== archive.id) {
      return NextResponse.json(
        { error: "Archive stage must remain last" },
        { status: 400 }
      );
    }

    await prisma.$transaction(
      orderedIds.map((id, position) =>
        prisma.workflowStage.update({
          where: { id },
          data: { position },
        })
      )
    );

    return NextResponse.json(await ensureWorkflowStages());
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to reorder stages" }, { status: 500 });
  }
}
