import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { getWorkOrderById } from "@/lib/db/queries/work-orders";
import { serializePrisma } from "@/lib/utils";
import { OrderDetail } from "@/components/history/OrderDetail";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { id } = await params;
  const raw = await getWorkOrderById(id);
  if (!raw) notFound();

  if (session.user.role !== "admin" && raw.userId !== session.user.id) {
    redirect("/history");
  }

  const order = serializePrisma(raw);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <OrderDetail order={order as any} isAdmin={session.user.role === "admin"} />;
}
