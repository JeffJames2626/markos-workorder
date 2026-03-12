import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getWorkOrdersByUser, getAllWorkOrders } from "@/lib/db/queries/work-orders";
import { getAllClients } from "@/lib/db/queries/clients";
import { serializePrisma } from "@/lib/utils";
import { TimerCard } from "@/components/home/TimerCard";
import { RecentActivity } from "@/components/home/RecentActivity";
import { BottomNav } from "@/components/layout/BottomNav";

export default async function WorkOrderHome() {
  const session = await auth();
  if (!session) redirect("/login");

  const raw =
    session.user.role === "admin"
      ? await getAllWorkOrders()
      : await getWorkOrdersByUser(session.user.id);

  const orders = serializePrisma(raw.slice(0, 5));
  const firstName = session.user.name?.split(" ")[0] ?? "there";
  const clients = await getAllClients();

  return (
    <div className="min-h-dvh flex flex-col bg-black">
      <main className="flex-1 w-full max-w-[480px] mx-auto px-4 overflow-y-auto pb-24 pt-8">

        {/* Welcome */}
        <section className="flex flex-col items-center gap-1">
          <p className="text-xs font-medium tracking-tight text-white/90">
            Welcome back
          </p>
          <h1 className="text-[30px] font-semibold tracking-tight leading-[34px] text-white">
            {firstName}
          </h1>
        </section>

        {/* Timer card with client select */}
        <section className="pt-8">
          <TimerCard clients={clients} />
        </section>

        {/* Activity feed */}
        <section className="pt-8">
          <h2 className="text-xs font-medium tracking-tight text-white mb-4">
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
