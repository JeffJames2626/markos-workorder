import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getWorkOrdersByUser, getAllWorkOrders } from "@/lib/db/queries/work-orders";
import { serializePrisma } from "@/lib/utils";
import { HistoryList } from "@/components/history/HistoryList";
import { BottomNav } from "@/components/layout/BottomNav";

export default async function HistoryPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const isAdmin = session.user.role === "admin";
  const raw = isAdmin ? await getAllWorkOrders() : await getWorkOrdersByUser(session.user.id);
  const orders = serializePrisma(raw);

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <main className="flex-1 w-full max-w-[480px] mx-auto px-4 overflow-y-auto pb-24 pt-6">
        <h1 className="text-xl font-semibold text-foreground mb-5">
          {isAdmin ? "All Work Orders" : "My Work Orders"}
        </h1>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <HistoryList orders={orders as any} isAdmin={isAdmin} />
      </main>
      <BottomNav
        role={session.user.role}
        userName={session.user.name}
        userEmail={session.user.email}
      />
    </div>
  );
}
