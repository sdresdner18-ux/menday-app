import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isTrackingVerified } from "@/lib/tracking-auth";
import { serializePublicTrackingOrder } from "@/lib/tracking-server";
import { ensureWorkflowStages } from "@/lib/workflow";

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const order = await prisma.order.findUnique({
      where: { trackingToken: params.token },
      include: {
        statusHistory: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const verified = isTrackingVerified(params.token);

    if (!verified) {
      return NextResponse.json({
        verified: false,
        hasPhone: serializePublicTrackingOrder(
          order,
          await ensureWorkflowStages()
        ).hasPhone,
      });
    }

    const stages = await ensureWorkflowStages();
    return NextResponse.json({
      verified: true,
      order: serializePublicTrackingOrder(order, stages),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to load order" }, { status: 500 });
  }
}
