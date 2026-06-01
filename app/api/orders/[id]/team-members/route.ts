import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeOrderTeamMembers } from "@/lib/teamMembers";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: {
        teamAssignments: {
          include: { teamMember: true },
          orderBy: { assignedAt: "asc" },
        },
      },
    });
    if (!order) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(serializeOrderTeamMembers(order));
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch team assignments" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const teamMemberIds = Array.isArray(body.teamMemberIds)
      ? [...new Set(body.teamMemberIds.filter((id: unknown) => typeof id === "string"))]
      : [];

    if (teamMemberIds.length > 0) {
      const count = await prisma.teamMember.count({
        where: { id: { in: teamMemberIds } },
      });
      if (count !== teamMemberIds.length) {
        return NextResponse.json(
          { error: "One or more team members not found" },
          { status: 400 }
        );
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.orderTeamMember.deleteMany({ where: { orderId: params.id } });
      if (teamMemberIds.length > 0) {
        await tx.orderTeamMember.createMany({
          data: teamMemberIds.map((teamMemberId: string) => ({
            orderId: params.id,
            teamMemberId,
          })),
        });
      }
    });

    const updated = await prisma.order.findUniqueOrThrow({
      where: { id: params.id },
      include: {
        teamAssignments: {
          include: { teamMember: true },
          orderBy: { assignedAt: "asc" },
        },
      },
    });

    return NextResponse.json(serializeOrderTeamMembers(updated));
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update team assignments" },
      { status: 500 }
    );
  }
}
