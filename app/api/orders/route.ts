import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  findOrCreateCustomer,
  orderWithCustomerInclude,
  serializeOrder,
} from "@/lib/customers";
import { initializeOrderExtras } from "@/lib/orderExtras";
import { isValidOrderDeadline } from "@/lib/order-deadline";
import {
  ensureWorkflowStages,
  getDefaultStage,
  normalizeStatusSlug,
} from "@/lib/workflow";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const orders = await prisma.order.findMany({
      include: orderWithCustomerInclude,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders.map(serializeOrder));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const stages = await ensureWorkflowStages();
    const defaultStage = getDefaultStage(stages);
    const status = normalizeStatusSlug(body.status ?? defaultStage.slug, stages);

    if (!isValidOrderDeadline(body.deadline)) {
      return NextResponse.json(
        { error: "Every job needs a completion date." },
        { status: 400 }
      );
    }

    const customer = await findOrCreateCustomer(
      body.customerName,
      body.customerPhone,
      body.customerId
    );

    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        projectType: body.projectType,
        quantity: body.quantity ? Number(body.quantity) : null,
        unitPrice:
          body.unitPrice != null && body.unitPrice !== ""
            ? Number(body.unitPrice)
            : null,
        color: body.color || null,
        deadline: body.deadline ? new Date(body.deadline) : null,
        filesExpected: body.filesExpected ?? false,
        notes: body.notes || null,
        orderNumber: body.orderNumber || null,
        priority: body.priority ?? "Medium",
        status,
      },
      include: orderWithCustomerInclude,
    });

    await initializeOrderExtras(order.id, order.projectType, order.status);

    return NextResponse.json(serializeOrder(order));
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }
}
