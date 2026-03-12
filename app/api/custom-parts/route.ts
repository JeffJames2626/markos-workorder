import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getCustomPartsByUser, createCustomPart } from "@/lib/db/queries/parts";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parts = await getCustomPartsByUser(session.user.id);
  return NextResponse.json(parts);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { category, itemName } = await request.json();
  if (!category || !itemName) {
    return NextResponse.json({ error: "category and itemName required" }, { status: 400 });
  }

  const part = await createCustomPart(session.user.id, category, itemName);
  return NextResponse.json(part, { status: 201 });
}
