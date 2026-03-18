import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCustomPartsByUser } from "@/lib/db/queries/parts";
import { getAllClients } from "@/lib/db/queries/clients";
import { PartsListPage } from "@/components/parts/PartsListPage";
import { BottomNav } from "@/components/layout/BottomNav";

export default async function Parts() {
  const session = await auth();
  if (!session) redirect("/login");

  const customParts = await getCustomPartsByUser(session.user.id);
  const clients = await getAllClients();

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <main className="flex-1 w-full max-w-[480px] mx-auto px-4 overflow-y-auto pb-24 pt-6">
        <PartsListPage customParts={customParts} />
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
