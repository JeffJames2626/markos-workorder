import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  getPendingWorkOrders,
  getPendingWorkOrdersByUser,
  getAllTechs,
} from "@/lib/db/queries/work-orders";
import { getAllClients } from "@/lib/db/queries/clients";
import { serializePrisma } from "@/lib/utils";
import { PendingOrders } from "@/components/home/PendingOrders";
import { BottomNav } from "@/components/layout/BottomNav";
import { Avatar } from "@heroui/react";

export default async function WorkOrderHome() {
  const session = await auth();
  if (!session) redirect("/login");

  const isAdmin = session.user.role === "admin";
  const raw = isAdmin
    ? await getPendingWorkOrders()
    : await getPendingWorkOrdersByUser(session.user.id);

  const orders = serializePrisma(raw);
  const initials = session.user.name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "?";
  const clients = await getAllClients();
  const techs = isAdmin ? await getAllTechs() : [];

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <main className="flex-1 w-full max-w-[480px] mx-auto px-3 overflow-y-auto pb-28 pt-6">

        {/* Header */}
        <section className="flex items-center justify-between pt-4 pb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Marko's Sprinklers"
            style={{ height: 40, width: "auto" }}
          />
          <Avatar color="accent" variant="soft">
            <Avatar.Fallback>{initials}</Avatar.Fallback>
          </Avatar>
        </section>

        {/* Pending work orders */}
        <section className="pt-2">
          <h2 className="text-xs font-medium tracking-tight text-foreground mb-4">
            Pending Work Orders
          </h2>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <PendingOrders orders={orders as any} isAdmin={isAdmin} techs={techs} />
        </section>

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
