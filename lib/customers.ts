import { Customer, Order, Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export type OrderWithCustomer = Order & { customer: Customer | null };

export function serializeCustomer(customer: Customer) {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    notes: customer.notes,
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
  };
}

function resolveCustomerSnapshot(order: OrderWithCustomer) {
  if (order.customer) {
    return order.customer;
  }

  return {
    id: order.customerId ?? "",
    name: order.customerName,
    phone: order.customerPhone,
    notes: null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export function serializeOrder(order: OrderWithCustomer) {
  const customer = resolveCustomerSnapshot(order);

  return {
    id: order.id,
    customerId: order.customerId ?? customer.id,
    customerName: customer.name,
    customerPhone: customer.phone,
    projectType: order.projectType,
    quantity: order.quantity,
    unitPrice: order.unitPrice != null ? Number(order.unitPrice) : null,
    color: order.color,
    deadline: order.deadline ? order.deadline.toISOString() : null,
    filesExpected: order.filesExpected,
    notes: order.notes,
    orderNumber: order.orderNumber,
    priority: order.priority,
    status: order.status,
    paymentReceived: order.paymentReceived,
    paymentReceivedAt: order.paymentReceivedAt
      ? order.paymentReceivedAt.toISOString()
      : null,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    customer: serializeCustomer(customer),
  };
}

export const orderWithCustomerInclude = {
  customer: true,
} satisfies Prisma.OrderInclude;

export async function findOrCreateCustomer(
  name: string,
  phone?: string | null,
  customerId?: string | null
) {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("Customer name is required");
  }

  const phoneValue = phone?.trim() || null;

  if (customerId) {
    const existing = await prisma.customer.findUnique({
      where: { id: customerId },
    });
    if (existing) {
      return prisma.customer.update({
        where: { id: customerId },
        data: {
          name: trimmedName,
          phone: phoneValue,
        },
      });
    }
  }

  if (phoneValue) {
    const byPhone = await prisma.customer.findFirst({
      where: { phone: phoneValue },
    });
    if (byPhone) {
      return prisma.customer.update({
        where: { id: byPhone.id },
        data: { name: trimmedName },
      });
    }
  }

  const byName = await prisma.customer.findFirst({
    where: {
      name: {
        equals: trimmedName,
        mode: "insensitive",
      },
    },
  });

  if (byName) {
    if (phoneValue && !byName.phone) {
      return prisma.customer.update({
        where: { id: byName.id },
        data: { phone: phoneValue },
      });
    }
    return byName;
  }

  return prisma.customer.create({
    data: {
      name: trimmedName,
      phone: phoneValue,
    },
  });
}
