import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getWorkOrderById,
  deleteWorkOrder,
  updateWorkOrder,
  syncWorkOrderParts,
} from "@/lib/db/queries/work-orders";
import { serializePrisma } from "@/lib/utils";
import { z } from "zod";

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

const PartSchema = z.object({
  category: z.string(),
  itemName: z.string(),
  quantity: z.number().int().min(1),
  isCustom: z.boolean(),
});

const PatchSchema = z.object({
  completed: z.enum(["Y", "N", "P"]).optional(),
  userId: z.string().optional(),
  techName: z.string().optional(),
  clockInTime: z.number().nullable().optional(),
  clockOutTime: z.number().nullable().optional(),
  billableSecs: z.number().int().min(0).optional(),
  parts: z.array(PartSchema).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const order = await getWorkOrderById(id);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Techs can only update their own orders (status + time); admins can do anything
  const isAdmin = session.user.role === "admin";
  if (!isAdmin && order.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  // Only admins can reassign
  if ((parsed.data.userId || parsed.data.techName) && !isAdmin) {
    return NextResponse.json({ error: "Only admins can reassign" }, { status: 403 });
  }

  const updateData: Parameters<typeof updateWorkOrder>[1] = {};
  if (parsed.data.completed !== undefined) updateData.completed = parsed.data.completed;
  if (parsed.data.userId !== undefined) updateData.userId = parsed.data.userId;
  if (parsed.data.techName !== undefined) updateData.techName = parsed.data.techName;
  if (parsed.data.clockInTime !== undefined) {
    updateData.clockInTime = parsed.data.clockInTime ? BigInt(parsed.data.clockInTime) : null;
  }
  if (parsed.data.clockOutTime !== undefined) {
    updateData.clockOutTime = parsed.data.clockOutTime ? BigInt(parsed.data.clockOutTime) : null;
  }
  if (parsed.data.billableSecs !== undefined) updateData.billableSecs = parsed.data.billableSecs;

  // Sync parts if provided
  if (parsed.data.parts !== undefined) {
    await syncWorkOrderParts(id, parsed.data.parts);
  }

  const updated = await updateWorkOrder(id, updateData);
  return NextResponse.json(serializePrisma(updated));
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
