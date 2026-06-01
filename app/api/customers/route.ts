import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeCustomer } from "@/lib/customers";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const customers = await prisma.customer.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json(customers.map(serializeCustomer));
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
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

    const customer = await prisma.customer.create({
      data: {
        name,
        phone: body.phone?.trim() || null,
        notes: body.notes?.trim() || null,
      },
    });

    return NextResponse.json(serializeCustomer(customer));
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create customer" },
      { status: 500 }
    );
  }
}
