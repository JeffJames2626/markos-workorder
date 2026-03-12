import { prisma } from "../index";

export interface CreateWorkOrderInput {
  userId: string;
  clientId?: string;
  clientName: string;
  address: string;
  phone?: string;
  serviceType?: string;
  date: string;
  zones?: number;
  completed: string;
  techName: string;
  clockInTime?: number;
  clockOutTime?: number;
  billableSecs: number;
  pausedSecs: number;
  description?: string;
  repairs?: string;
  techSig?: string;
  techSigDate?: string;
  clientSig?: string;
  clientSigDate?: string;
  clientAbsent: boolean;
  parts: Array<{
    category: string;
    itemName: string;
    quantity: number;
    isCustom: boolean;
  }>;
}

export async function createWorkOrder(input: CreateWorkOrderInput) {
  const { parts, ...data } = input;

  return prisma.workOrder.create({
    data: {
      ...data,
      clockInTime: data.clockInTime ? BigInt(data.clockInTime) : null,
      clockOutTime: data.clockOutTime ? BigInt(data.clockOutTime) : null,
      parts: {
        create: parts,
      },
    },
    include: { parts: true },
  });
}

export async function getWorkOrdersByUser(userId: string) {
  return prisma.workOrder.findMany({
    where: { userId },
    include: { parts: true },
    orderBy: { submittedAt: "desc" },
  });
}

export async function getAllWorkOrders() {
  return prisma.workOrder.findMany({
    include: { parts: true },
    orderBy: { submittedAt: "desc" },
  });
}

export async function getWorkOrderById(id: string) {
  return prisma.workOrder.findUnique({
    where: { id },
    include: { parts: true },
  });
}

export async function deleteWorkOrder(id: string, userId: string, isAdmin: boolean) {
  if (isAdmin) {
    await prisma.workOrder.delete({ where: { id } });
  } else {
    await prisma.workOrder.delete({ where: { id, userId } });
  }
}

export async function markEmailSent(id: string) {
  await prisma.workOrder.update({
    where: { id },
    data: { emailSent: true },
  });
}
