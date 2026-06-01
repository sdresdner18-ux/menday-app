import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeCustomer } from "@/lib/customers";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const existing = await prisma.customer.findUnique({
      where: { id: params.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const body = await req.json();
    const name =
      body.name !== undefined ? String(body.name).trim() : existing.name;
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const phone =
      body.phone !== undefined
        ? body.phone?.trim() || null
        : existing.phone;
    const notes =
      body.notes !== undefined
        ? body.notes?.trim() || null
        : existing.notes;

    const customer = await prisma.customer.update({
      where: { id: params.id },
      data: { name, phone, notes },
    });

    await prisma.order.updateMany({
      where: { customerId: params.id },
      data: { customerName: name, customerPhone: phone },
    });

    return NextResponse.json(serializeCustomer(customer));
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update customer" },
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
    const existing = await prisma.customer.findUnique({
      where: { id: params.id },
      include: { _count: { select: { orders: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    if (existing._count.orders > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete — ${existing._count.orders} order(s) are linked to this customer.`,
        },
        { status: 400 }
      );
    }

    await prisma.customer.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  }
}
