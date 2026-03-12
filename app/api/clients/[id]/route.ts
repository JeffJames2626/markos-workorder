import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { updateClient, deleteClient } from "@/lib/db/queries/clients";
import { z } from "zod";

const UpdateClientSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = UpdateClientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const client = await updateClient(id, parsed.data);
  return NextResponse.json(client);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await deleteClient(id);
  return NextResponse.json({ success: true });
}
