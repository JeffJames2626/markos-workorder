import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAllUsers, createUser, createInvitedUser } from "@/lib/db/queries/users";
import { sendInviteEmail } from "@/lib/email";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await getAllUsers();
  return NextResponse.json(users);
}

const CreateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  role: z.string().min(1),
  password: z.string().min(6).optional(),
  sendInvite: z.boolean().default(true),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = CreateUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { name, email, role, password, sendInvite } = parsed.data;

  // If a password is provided, create user directly (no invite needed)
  if (password) {
    const user = await createUser({ name, email, password, role });
    return NextResponse.json(user, { status: 201 });
  }

  // Otherwise, create invited user and send email
  const { user, token } = await createInvitedUser({ name, email, role });

  if (sendInvite) {
    try {
      await sendInviteEmail({ email, name, token });
    } catch {
      // User created but email failed — admin can resend later
      return NextResponse.json(
        { ...user, emailError: "User created but invite email failed to send" },
        { status: 201 }
      );
    }
  }

  return NextResponse.json(user, { status: 201 });
}
