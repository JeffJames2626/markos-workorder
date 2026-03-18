import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const part = await prisma.customPart.findUnique({ where: { id } });
  if (!part) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Users can only delete their own custom parts; admins can delete any
  if (session.user.role !== "admin" && part.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.customPart.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
