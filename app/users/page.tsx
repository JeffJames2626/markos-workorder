import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAllUsers } from "@/lib/db/queries/users";
import { getAllClients } from "@/lib/db/queries/clients";
import { serializePrisma } from "@/lib/utils";
import { UsersPage } from "@/components/admin/UsersPage";
import { BottomNav } from "@/components/layout/BottomNav";

export default async function Users() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "admin") redirect("/workorder");

  const users = serializePrisma(await getAllUsers());
  const clients = await getAllClients();

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <main className="flex-1 w-full max-w-[480px] mx-auto px-4 overflow-y-auto pb-24 pt-6">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <UsersPage users={users as any} currentUserId={session.user.id} />
      </main>
      <BottomNav
        role={session.user.role}
        userName={session.user.name}
        userEmail={session.user.email}
        clients={clients}
        techName={session.user.name}
      />
    </div>
  );
}
