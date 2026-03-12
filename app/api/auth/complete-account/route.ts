import { NextResponse } from "next/server";
import { getUserByInviteToken, completeUserAccount } from "@/lib/db/queries/users";
import { z } from "zod";

const CompleteSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const user = await getUserByInviteToken(token);
  if (!user) {
    return NextResponse.json({ error: "Invalid or expired invite" }, { status: 404 });
  }
  if (user.inviteExpires && user.inviteExpires < new Date()) {
    return NextResponse.json({ error: "Invite has expired" }, { status: 410 });
  }

  return NextResponse.json({ name: user.name, email: user.email });
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = CompleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const user = await completeUserAccount(parsed.data.token, parsed.data.password);
  if (!user) {
    return NextResponse.json({ error: "Invalid or expired invite" }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
