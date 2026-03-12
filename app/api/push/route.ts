import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { saveSubscription, removeSubscription } from "@/lib/push";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only admins subscribe to push notifications
  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Only admins receive push notifications" }, { status: 403 });
  }

  const { subscription } = await request.json();
  await saveSubscription(session.user.id, subscription);

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { endpoint } = await request.json();
  await removeSubscription(endpoint);

  return NextResponse.json({ success: true });
}
