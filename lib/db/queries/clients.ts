import { prisma } from "../index";

export async function getAllClients() {
  return prisma.client.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getClientById(id: string) {
  return prisma.client.findUnique({ where: { id } });
}

export async function createClient(data: { name: string; address?: string; phone?: string; email?: string }) {
  return prisma.client.create({ data });
}

export async function updateClient(id: string, data: { name?: string; address?: string; phone?: string; email?: string }) {
  return prisma.client.update({ where: { id }, data });
}

export async function deleteClient(id: string) {
  return prisma.client.delete({ where: { id } });
}
