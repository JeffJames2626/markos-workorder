import { prisma } from "../index";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function getAllUsers() {
  return prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      passwordHash: true,
      inviteToken: true,
      inviteExpires: true,
      createdAt: true,
    },
  });
}

export async function createUser(data: {
  email: string;
  name: string;
  password: string;
  role: string;
}) {
  const passwordHash = await bcrypt.hash(data.password, 10);
  return prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash,
      role: data.role,
    },
  });
}

export async function createInvitedUser(data: {
  email: string;
  name: string;
  role: string;
}) {
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const user = await prisma.user.create({
    data: {
      email: data.email,
      name: data.name,
      role: data.role,
      inviteToken: token,
      inviteExpires: expires,
    },
  });
  return { user, token };
}

export async function getUserByInviteToken(token: string) {
  return prisma.user.findUnique({ where: { inviteToken: token } });
}

export async function completeUserAccount(token: string, password: string) {
  const user = await prisma.user.findUnique({ where: { inviteToken: token } });
  if (!user) return null;
  if (user.inviteExpires && user.inviteExpires < new Date()) return null;

  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      inviteToken: null,
      inviteExpires: null,
    },
  });
}

export async function updateUser(
  id: string,
  data: { email?: string; name?: string; role?: string; password?: string }
) {
  const updateData: Record<string, unknown> = {};
  if (data.email !== undefined) updateData.email = data.email;
  if (data.name !== undefined) updateData.name = data.name;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.password !== undefined) {
    updateData.passwordHash = await bcrypt.hash(data.password, 10);
  }
  return prisma.user.update({ where: { id }, data: updateData });
}

export async function deleteUser(id: string) {
  return prisma.user.delete({ where: { id } });
}
