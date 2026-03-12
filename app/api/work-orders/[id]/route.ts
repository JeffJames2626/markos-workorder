import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getWorkOrderById,
  deleteWorkOrder,
} from "@/lib/db/queries/work-orders";
import { serializePrisma } from "@/lib/utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const order = await getWorkOrderById(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (
    session.user.role !== "admin" &&
    order.userId !== session.user.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json(serializePrisma(order));
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await deleteWorkOrder(id, session.user.id, session.user.role === "admin");

  return NextResponse.json({ success: true });
}
