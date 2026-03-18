import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getWorkOrderById,
  deleteWorkOrder,
  updateWorkOrder,
  syncWorkOrderParts,
} from "@/lib/db/queries/work-orders";
import { serializePrisma } from "@/lib/utils";
import { notifyAdmins, notifyUser } from "@/lib/push";
import { sendReturnVisitEmail } from "@/lib/email";
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
  clientName: z.string().min(1).optional(),
  address: z.string().optional(),
  phone: z.string().nullable().optional(),
  serviceType: z.string().nullable().optional(),
  date: z.string().optional(),
  zones: z.number().nullable().optional(),
  description: z.string().nullable().optional(),
  repairs: z.string().nullable().optional(),
  clockInTime: z.number().nullable().optional(),
  clockOutTime: z.number().nullable().optional(),
  billableSecs: z.number().int().min(0).optional(),
  clientSig: z.string().nullable().optional(),
  clientSigDate: z.string().nullable().optional(),
  clientAbsent: z.boolean().optional(),
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = {};
  if (parsed.data.completed !== undefined) updateData.completed = parsed.data.completed;
  if (parsed.data.userId !== undefined) updateData.userId = parsed.data.userId;
  if (parsed.data.techName !== undefined) updateData.techName = parsed.data.techName;
  if (parsed.data.clientName !== undefined) updateData.clientName = parsed.data.clientName;
  if (parsed.data.address !== undefined) updateData.address = parsed.data.address;
  if (parsed.data.phone !== undefined) updateData.phone = parsed.data.phone;
  if (parsed.data.serviceType !== undefined) updateData.serviceType = parsed.data.serviceType;
  if (parsed.data.date !== undefined) updateData.date = parsed.data.date;
  if (parsed.data.zones !== undefined) updateData.zones = parsed.data.zones;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.repairs !== undefined) updateData.repairs = parsed.data.repairs;
  if (parsed.data.clockInTime !== undefined) {
    updateData.clockInTime = parsed.data.clockInTime ? BigInt(parsed.data.clockInTime) : null;
  }
  if (parsed.data.clockOutTime !== undefined) {
    updateData.clockOutTime = parsed.data.clockOutTime ? BigInt(parsed.data.clockOutTime) : null;
  }
  if (parsed.data.billableSecs !== undefined) updateData.billableSecs = parsed.data.billableSecs;
  if (parsed.data.clientSig !== undefined) updateData.clientSig = parsed.data.clientSig;
  if (parsed.data.clientSigDate !== undefined) updateData.clientSigDate = parsed.data.clientSigDate;
  if (parsed.data.clientAbsent !== undefined) updateData.clientAbsent = parsed.data.clientAbsent;

  // Sync parts if provided
  if (parsed.data.parts !== undefined) {
    await syncWorkOrderParts(id, parsed.data.parts);
  }

  const updated = await updateWorkOrder(id, updateData);

  // --- Push notifications (fire-and-forget) ---
  const orderUrl = `/history/${id}`;

  // Notify tech when a work order is reassigned to them
  if (parsed.data.userId && parsed.data.userId !== order.userId) {
    notifyUser(
      parsed.data.userId,
      "Work Order Assigned",
      `A work order for ${order.clientName} has been assigned to you`,
      orderUrl
    ).catch(() => {});
  }

  // Notify admins when a work order is updated (status change, time logged, parts, acknowledgement)
  const statusChanged = parsed.data.completed !== undefined && parsed.data.completed !== order.completed;
  const timeLogged = parsed.data.clockOutTime !== undefined;
  const partsChanged = parsed.data.parts !== undefined;
  const acknowledged = parsed.data.clientSig !== undefined || parsed.data.clientAbsent !== undefined;
  const isReassign = !!parsed.data.userId;

  if (!isAdmin && (statusChanged || timeLogged || partsChanged || acknowledged)) {
    const statusLabel = statusChanged
      ? { Y: "Done", N: "Return Visit", P: "Pending" }[parsed.data.completed!] ?? parsed.data.completed
      : null;
    const description = statusChanged
      ? `Status changed to ${statusLabel} for ${order.clientName}`
      : timeLogged
        ? `Time logged for ${order.clientName}`
        : partsChanged
          ? `Parts updated for ${order.clientName}`
          : `Client acknowledgement updated for ${order.clientName}`;

    notifyAdmins(
      "Work Order Updated",
      `${session.user.name}: ${description}`,
      orderUrl
    ).catch(() => {});
  }

  // Also notify admins when admin reassigns (so other admins are aware)
  if (isAdmin && isReassign) {
    notifyAdmins(
      "Work Order Reassigned",
      `${order.clientName} reassigned to ${parsed.data.techName}`,
      orderUrl
    ).catch(() => {});
  }

  // Send return visit email when status changes to "N"
  if (statusChanged && parsed.data.completed === "N") {
    sendReturnVisitEmail({
      clientName: order.clientName,
      address: order.address,
      phone: order.phone,
      techName: order.techName,
      date: order.date,
      zones: order.zones,
      completed: "N",
      serviceType: order.serviceType,
      clockInTime: order.clockInTime ? Number(order.clockInTime) : null,
      clockOutTime: order.clockOutTime ? Number(order.clockOutTime) : null,
      billableSecs: order.billableSecs,
      pausedSecs: order.pausedSecs,
      description: order.description,
      repairs: order.repairs,
      parts: order.parts,
    }).catch(() => {});
  }

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
