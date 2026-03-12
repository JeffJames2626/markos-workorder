import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  createWorkOrder,
  getWorkOrdersByUser,
  getAllWorkOrders,
} from "@/lib/db/queries/work-orders";
import { serializePrisma } from "@/lib/utils";
import { z } from "zod";

const PartSchema = z.object({
  category: z.string(),
  itemName: z.string(),
  quantity: z.number().int().min(1),
  isCustom: z.boolean(),
});

const CreateWorkOrderSchema = z.object({
  clientId: z.string().optional(),
  clientName: z.string().min(1),
  address: z.string(),
  phone: z.string().optional(),
  serviceType: z.string().optional(),
  date: z.string(),
  zones: z.number().optional(),
  completed: z.enum(["Y", "N", "P"]),
  techName: z.string().min(1),
  clockInTime: z.number().optional(),
  clockOutTime: z.number().optional(),
  billableSecs: z.number().int().min(0),
  pausedSecs: z.number().int().min(0),
  description: z.string().optional(),
  repairs: z.string().optional(),
  techSig: z.string().optional(),
  techSigDate: z.string().optional(),
  clientSig: z.string().optional(),
  clientSigDate: z.string().optional(),
  clientAbsent: z.boolean(),
  parts: z.array(PartSchema),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders =
    session.user.role === "admin"
      ? await getAllWorkOrders()
      : await getWorkOrdersByUser(session.user.id);

  return NextResponse.json(serializePrisma(orders));
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const parsed = CreateWorkOrderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const order = await createWorkOrder({
    ...parsed.data,
    userId: session.user.id,
  });

  return NextResponse.json(serializePrisma(order), { status: 201 });
}
