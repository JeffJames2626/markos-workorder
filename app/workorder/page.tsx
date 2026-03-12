import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getWorkOrdersByUser, getAllWorkOrders } from "@/lib/db/queries/work-orders";
import { getAllClients } from "@/lib/db/queries/clients";
import { serializePrisma } from "@/lib/utils";
import { TimerCard } from "@/components/home/TimerCard";
import { RecentActivity } from "@/components/home/RecentActivity";
import { BottomNav } from "@/components/layout/BottomNav";
import { Avatar } from "@heroui/react";

export default async function WorkOrderHome() {
  const session = await auth();
  if (!session) redirect("/login");

  const raw =
    session.user.role === "admin"
      ? await getAllWorkOrders()
      : await getWorkOrdersByUser(session.user.id);

  const orders = serializePrisma(raw.slice(0, 5));
  const initials = session.user.name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "?";
  const clients = await getAllClients();

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <main className="flex-1 w-full max-w-[480px] mx-auto px-3 overflow-y-auto pb-28 pt-6">

        {/* Header */}
        <section className="flex items-center justify-between pt-4 pb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <div style={{ height: 40, width: 48, overflow: "hidden" }}>
            <img
              src="/logo.png"
              alt="Marko's Sprinklers"
              style={{ width: 48, marginTop: -2 }}
            />
          </div>
          <Avatar color="accent" variant="soft">
            <Avatar.Fallback>{initials}</Avatar.Fallback>
          </Avatar>
        </section>

        {/* Timer card with client & job type selects */}
        <section className="pt-2">
          <TimerCard clients={clients} />
        </section>

        {/* Activity feed */}
        <section className="pt-6">
          <h2 className="text-xs font-medium tracking-tight text-foreground mb-4">
            Recent activity
          </h2>
          <RecentActivity orders={orders} />
        </section>

      </main>

      <BottomNav
        role={session.user.role}
        userName={session.user.name}
        userEmail={session.user.email}
      />
    </div>
  );
}
