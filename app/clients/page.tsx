import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAllClients } from "@/lib/db/queries/clients";
import { ClientsPage } from "@/components/admin/ClientsPage";
import { BottomNav } from "@/components/layout/BottomNav";

export default async function Clients() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "admin") redirect("/workorder");

  const clients = await getAllClients();

  return (
    <div className="min-h-dvh flex flex-col bg-black">
      <main className="flex-1 w-full max-w-[480px] mx-auto px-4 overflow-y-auto pb-24 pt-6">
        <ClientsPage clients={clients} />
      </main>
      <BottomNav
        role={session.user.role}
        userName={session.user.name}
        userEmail={session.user.email}
      />
    </div>
  );
}
