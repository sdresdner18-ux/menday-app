import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeTeamMember, teamMemberColors } from "@/lib/teamMembers";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const existing = await prisma.teamMember.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const name =
      body.name !== undefined ? String(body.name).trim() : existing.name;
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const role =
      body.role !== undefined ? body.role?.trim() || null : existing.role;
    const color =
      body.color !== undefined &&
      (teamMemberColors as readonly string[]).includes(body.color)
        ? body.color
        : existing.color;

    const member = await prisma.teamMember.update({
      where: { id: params.id },
      data: { name, role, color },
    });

    return NextResponse.json(serializeTeamMember(member));
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update team member" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const existing = await prisma.teamMember.findUnique({
      where: { id: params.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.teamMember.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete team member" },
      { status: 500 }
    );
  }
}
