import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  ensureWorkflowStages,
  serializeWorkflowStage,
  slugifyStageLabel,
  STAGE_COLOR_PALETTE,
} from "@/lib/workflow";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const stages = await ensureWorkflowStages();
    return NextResponse.json(stages);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to load workflow stages" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const label = String(body.label ?? "").trim();
    if (!label) {
      return NextResponse.json({ error: "Stage name is required" }, { status: 400 });
    }

    const stages = await ensureWorkflowStages();
    const payment = stages.find((s) => s.stageType === "Payment");
    const insertAt = payment?.position ?? stages.length - 1;

    let baseSlug = slugifyStageLabel(label);
    let slug = baseSlug;
    let suffix = 2;
    while (stages.some((s) => s.slug === slug)) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const color =
      body.color ??
      STAGE_COLOR_PALETTE[stages.length % STAGE_COLOR_PALETTE.length];

    await prisma.$transaction(async (tx) => {
      await tx.workflowStage.updateMany({
        where: { position: { gte: insertAt } },
        data: { position: { increment: 1 } },
      });

      await tx.workflowStage.create({
        data: {
          slug,
          label,
          position: insertAt,
          stageType: "Normal",
          color,
        },
      });
    });

    const updated = await ensureWorkflowStages();
    const created = updated.find((s) => s.slug === slug);
    return NextResponse.json(created ?? updated[updated.length - 1]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create stage" }, { status: 500 });
  }
}
