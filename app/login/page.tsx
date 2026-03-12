import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/workorder");

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col gap-8">

        {/* Brand */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground">
            Marko&apos;s <span className="text-accent">Sprinklers</span>
          </h1>
          <p className="mt-1 text-sm text-muted">
            Work Order System
          </p>
        </div>

        <LoginForm />

      </div>
    </main>
  );
}
