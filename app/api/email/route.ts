import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getWorkOrderById, markEmailSent } from "@/lib/db/queries/work-orders";
import { sendWorkOrderEmail } from "@/lib/email";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { workOrderId } = await request.json();
  if (!workOrderId) {
    return NextResponse.json({ error: "workOrderId required" }, { status: 400 });
  }

  const order = await getWorkOrderById(workOrderId);
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (
    session.user.role !== "admin" &&
    order.userId !== session.user.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await sendWorkOrderEmail({
      clientName: order.clientName,
      address: order.address,
      phone: order.phone,
      techName: order.techName,
      date: order.date,
      zones: order.zones,
      completed: order.completed,
      serviceType: order.serviceType,
      clockInTime: order.clockInTime ? Number(order.clockInTime) : null,
      clockOutTime: order.clockOutTime ? Number(order.clockOutTime) : null,
      billableSecs: order.billableSecs,
      pausedSecs: order.pausedSecs,
      description: order.description,
      repairs: order.repairs,
      parts: order.parts,
    });

    await markEmailSent(order.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Email send failed:", err);
    return NextResponse.json({ error: "Email failed" }, { status: 500 });
  }
}
