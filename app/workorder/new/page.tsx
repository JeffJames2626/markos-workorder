import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAllClients } from "@/lib/db/queries/clients";
import { WizardShell } from "@/components/wizard/WizardShell";

export default async function NewWorkOrderPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const clients = await getAllClients();

  return (
    <WizardShell
      techName={session.user.name}
      clients={clients}
    />
  );
}
