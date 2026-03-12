import { prisma } from "../index";

export async function getCustomPartsByUser(userId: string) {
  return prisma.customPart.findMany({ where: { userId } });
}

export async function createCustomPart(userId: string, category: string, itemName: string) {
  return prisma.customPart.upsert({
    where: { userId_category_itemName: { userId, category, itemName } },
    update: {},
    create: { userId, category, itemName },
  });
}
