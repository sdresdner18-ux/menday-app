import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  findOrCreateCustomer,
  orderWithCustomerInclude,
  serializeOrder,
} from "@/lib/customers";
import { logStatusChange } from "@/lib/orderExtras";
import {
  ensureWorkflowStages,
  getArchiveStage,
  normalizeStatusSlug,
} from "@/lib/workflow";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: orderWithCustomerInclude,
    });
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(serializeOrder(order));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const stages = await ensureWorkflowStages();
    const archiveStage = getArchiveStage(stages);

    const existing = await prisma.order.findUnique({
      where: { id: params.id },
      include: orderWithCustomerInclude,
    });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const existingCustomer = existing.customer ?? {
      id: existing.customerId ?? "",
      name: existing.customerName,
      phone: existing.customerPhone,
    };

    let customerId = existing.customerId ?? existingCustomer.id ?? null;
    let customerName = existingCustomer.name;
    let customerPhone = existingCustomer.phone;

    if (
      body.customerName !== undefined ||
      body.customerPhone !== undefined ||
      body.customerId !== undefined
    ) {
      const customer = await findOrCreateCustomer(
        body.customerName ?? existingCustomer.name,
        body.customerPhone !== undefined
          ? body.customerPhone
          : existingCustomer.phone,
        body.customerId ?? customerId
      );
      customerId = customer.id;
      customerName = customer.name;
      customerPhone = customer.phone;
    }

    const nextStatus =
      body.status !== undefined
        ? normalizeStatusSlug(String(body.status), stages)
        : undefined;

    if (nextStatus && !stages.some((s) => s.slug === nextStatus)) {
      return NextResponse.json({ error: "Invalid workflow stage" }, { status: 400 });
    }

    const nextPaymentReceived =
      body.paymentReceived !== undefined
        ? Boolean(body.paymentReceived)
        : existing.paymentReceived;

    if (nextStatus === archiveStage.slug && !nextPaymentReceived) {
      return NextResponse.json(
        { error: "Mark payment as received before completing this order." },
        { status: 400 }
      );
    }

    const paymentUpdate: {
      paymentReceived?: boolean;
      paymentReceivedAt?: Date | null;
    } = {};

    if (body.paymentReceived !== undefined) {
      paymentUpdate.paymentReceived = Boolean(body.paymentReceived);
      paymentUpdate.paymentReceivedAt = body.paymentReceived ? new Date() : null;
    }

    if (nextStatus === archiveStage.slug) {
      paymentUpdate.paymentReceived = true;
      if (!existing.paymentReceivedAt) {
        paymentUpdate.paymentReceivedAt = new Date();
      }
    }

    if (
      nextStatus !== undefined &&
      nextStatus !== archiveStage.slug &&
      existing.status === archiveStage.slug
    ) {
      paymentUpdate.paymentReceived = false;
      paymentUpdate.paymentReceivedAt = null;
    }

    const updated = await prisma.order.update({
      where: { id: params.id },
      data: {
        ...(customerId && { customerId }),
        ...(body.customerName !== undefined ||
        body.customerPhone !== undefined ||
        body.customerId !== undefined
          ? { customerName, customerPhone }
          : {}),
        ...(body.projectType !== undefined && { projectType: body.projectType }),
        ...(body.quantity !== undefined && {
          quantity: body.quantity ? Number(body.quantity) : null,
        }),
        ...(body.unitPrice !== undefined && {
          unitPrice:
            body.unitPrice != null && body.unitPrice !== ""
              ? Number(body.unitPrice)
              : null,
        }),
        ...(body.color !== undefined && { color: body.color || null }),
        ...(body.deadline !== undefined && {
          deadline: body.deadline ? new Date(body.deadline) : null,
        }),
        ...(body.filesExpected !== undefined && { filesExpected: body.filesExpected }),
        ...(body.notes !== undefined && { notes: body.notes || null }),
        ...(body.orderNumber !== undefined && { orderNumber: body.orderNumber || null }),
        ...(body.priority !== undefined && { priority: body.priority }),
        ...(nextStatus !== undefined && { status: nextStatus }),
        ...paymentUpdate,
      },
      include: orderWithCustomerInclude,
    });

    if (nextStatus !== undefined && nextStatus !== existing.status) {
      await logStatusChange(params.id, nextStatus, existing.status);
    }

    return NextResponse.json(serializeOrder(updated));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    await prisma.order.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}
