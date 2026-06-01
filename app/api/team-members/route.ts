import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeTeamMember, teamMemberColors } from "@/lib/teamMembers";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const members = await prisma.teamMember.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(members.map(serializeTeamMember));
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch team members" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const color = (teamMemberColors as readonly string[]).includes(body.color)
      ? body.color
      : teamMemberColors[0];

    const member = await prisma.teamMember.create({
      data: {
        name,
        role: body.role?.trim() || null,
        color,
      },
    });

    return NextResponse.json(serializeTeamMember(member));
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create team member" },
      { status: 500 }
    );
  }
}
