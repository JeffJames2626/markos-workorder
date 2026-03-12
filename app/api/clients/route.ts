import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllClients, createClient } from "@/lib/db/queries/clients";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clients = await getAllClients();
  return NextResponse.json(clients);
}

const CreateClientSchema = z.object({
  name: z.string().min(1),
  address: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = CreateClientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const client = await createClient(parsed.data);
  return NextResponse.json(client, { status: 201 });
}
