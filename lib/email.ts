import { Resend } from "resend";
import { fmtHrs, fmtTime } from "./utils";

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY environment variable is not set");
  return new Resend(key);
}

interface EmailWorkOrderData {
  clientName: string;
  address: string;
  phone?: string | null;
  techName: string;
  date: string;
  zones?: number | null;
  completed: string;
  serviceType?: string | null;
  clockInTime?: number | null;
  clockOutTime?: number | null;
  billableSecs: number;
  pausedSecs: number;
  description?: string | null;
  repairs?: string | null;
  parts: Array<{ category: string; itemName: string; quantity: number }>;
}

function buildEmailText(data: EmailWorkOrderData): string {
  const totalSecs = data.billableSecs + data.pausedSecs;
  const billableHrs = fmtHrs(data.billableSecs);
  const pausedHrs = fmtHrs(data.pausedSecs);
  const totalHrs = fmtHrs(totalSecs);

  const timeStr = billableHrs
    ? `Clock In:        ${fmtTime(data.clockInTime)}\nClock Out:       ${fmtTime(data.clockOutTime)}\nBillable Time:   ${billableHrs} hrs\nNon-Billable:    ${pausedHrs ?? "0.00"} hrs (breaks/travel)\nTotal on Site:   ${totalHrs} hrs`
    : "Not recorded";

  const partsStr =
    data.parts.length > 0
      ? data.parts
          .map((p) => `  • ${p.itemName} (${p.category}) x${p.quantity}`)
          .join("\n")
      : "None";

  const completedLabel =
    data.completed === "Y"
      ? "Yes"
      : data.completed === "N"
      ? "Return Visit"
      : "Pending";

  return `MARKO'S SPRINKLERS — SERVICE WORK ORDER
==========================================
Client:     ${data.clientName}
Address:    ${data.address}
Phone:      ${data.phone ?? "—"}
Tech:       ${data.techName}
Date:       ${data.date}
Zones:      ${data.zones ?? "—"}
Completed:  ${completedLabel}

TIME ON SITE
------------
${timeStr}

DESCRIPTION
-----------
${data.description ?? "—"}

PARTS USED
----------
${partsStr}

ADDITIONAL REPAIRS
------------------
${data.repairs ?? "—"}
==========================================
Sent from Marko's Sprinklers Work Order App`.trim();
}

export async function sendInviteEmail(data: {
  email: string;
  name: string;
  token: string;
}) {
  const from = process.env.RESEND_FROM_EMAIL ?? "workorders@markossprinklers.com";
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const link = `${baseUrl}/complete-account?token=${data.token}`;

  const result = await getResend().emails.send({
    from,
    to: [data.email],
    subject: "You're invited to Marko's Sprinklers",
    text: `Hi ${data.name},\n\nYou've been invited to Marko's Sprinklers Work Order App.\n\nClick the link below to set your password and complete your account:\n\n${link}\n\nThis link expires in 7 days.\n\n— Marko's Sprinklers`,
  });

  return result;
}

export async function sendReturnVisitEmail(data: EmailWorkOrderData) {
  const from = process.env.RESEND_FROM_EMAIL ?? "workorders@markossprinklers.com";
  const recipients = [
    "info@markossprinklers.com",
    "jeff@automatedlawnandpest.com",
  ];

  const result = await getResend().emails.send({
    from,
    to: recipients,
    subject: `Return Visit Needed — ${data.clientName} — ${data.date}`,
    text: buildEmailText(data),
  });

  return result;
}

export async function sendWorkOrderEmail(data: EmailWorkOrderData) {
  const recipient = process.env.RECIPIENT_EMAIL ?? "Jeff@automatedlawnandpest.com";
  const from = process.env.RESEND_FROM_EMAIL ?? "workorders@markossprinklers.com";

  const result = await getResend().emails.send({
    from,
    to: [recipient],
    subject: `Work Order — ${data.clientName} — ${data.date}`,
    text: buildEmailText(data),
  });

  return result;
}
