"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, Button, Separator } from "@heroui/react";
import { fmtSecs, fmtHrs, fmtTime } from "@/lib/utils";
import { WorkOrderTimer } from "./WorkOrderTimer";
import { StatusChanger } from "./StatusChanger";
import { PartsEditor } from "./PartsEditor";
import { ClientAcknowledgement } from "./ClientAcknowledgement";

interface Part {
  id: string;
  category: string;
  itemName: string;
  quantity: number;
  isCustom: boolean;
}

interface Order {
  id: string;
  clientName: string;
  address: string;
  phone: string | null;
  serviceType: string | null;
  date: string;
  techName: string;
  completed: string;
  clockInTime: number | null;
  clockOutTime: number | null;
  billableSecs: number;
  pausedSecs: number;
  zones: number | null;
  description: string | null;
  repairs: string | null;
  techSig: string | null;
  techSigDate: string | null;
  clientSig: string | null;
  clientSigDate: string | null;
  clientAbsent: boolean;
  parts: Part[];
}

export function OrderDetail({ order, isAdmin }: { order: Order; isAdmin: boolean }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const hrs = fmtHrs(order.billableSecs);

  const statusLabel =
    order.completed === "Y" ? "Done" : order.completed === "N" ? "Return Visit" : "Partial";

  const handleDelete = async () => {
    if (!confirm("Delete this work order? This cannot be undone.")) return;
    setDeleting(true);
    await fetch(`/api/work-orders/${order.id}`, { method: "DELETE" });
    router.push("/history");
    router.refresh();
  };

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <div className="w-full max-w-[480px] mx-auto px-5 py-6 flex flex-col gap-5">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-muted self-start"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back
        </button>

        {/* Timer */}
        <WorkOrderTimer
          orderId={order.id}
          existingClockIn={order.clockInTime}
          existingClockOut={order.clockOutTime}
          existingBillableSecs={order.billableSecs}
        />

        {/* Status */}
        <StatusChanger orderId={order.id} currentStatus={order.completed} />

        {/* Job Summary */}
        <Card variant="default">
          <Card.Header>
            <Card.Title>Job Summary</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="flex flex-col gap-2 text-sm">
              <Row label="Client" value={order.clientName} />
              <Row label="Address" value={order.address} />
              {order.phone && <Row label="Phone" value={order.phone} />}
              {order.serviceType && <Row label="Service" value={order.serviceType} />}
              <Row label="Date" value={order.date} />
              <Row label="Technician" value={order.techName} />
            </div>
          </Card.Content>
        </Card>

        {/* Time */}
        <Card variant="default">
          <Card.Header>
            <Card.Title>Time</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="flex flex-col gap-2 text-sm">
              {order.clockInTime && <Row label="Clock in" value={fmtTime(order.clockInTime)} />}
              {order.clockOutTime && <Row label="Clock out" value={fmtTime(order.clockOutTime)} />}
              <Row label="Billable" value={hrs ? `${hrs} hrs` : fmtSecs(order.billableSecs)} />
              {order.pausedSecs > 0 && <Row label="Non-billable" value={fmtSecs(order.pausedSecs)} />}
            </div>
          </Card.Content>
        </Card>

        {/* Parts */}
        <PartsEditor orderId={order.id} parts={order.parts} />

        {/* Notes */}
        {(order.description || order.repairs || order.zones) && (
          <Card variant="default">
            <Card.Header>
              <Card.Title>Notes</Card.Title>
            </Card.Header>
            <Card.Content>
              <div className="flex flex-col gap-2 text-sm">
                {order.zones && <Row label="Zones" value={String(order.zones)} />}
                {order.description && (
                  <div>
                    <span className="text-muted block mb-1">Description</span>
                    <p className="text-foreground">{order.description}</p>
                  </div>
                )}
                {order.repairs && (
                  <div>
                    <span className="text-muted block mb-1">Repairs needed</span>
                    <p className="text-foreground">{order.repairs}</p>
                  </div>
                )}
              </div>
            </Card.Content>
          </Card>
        )}

        {/* Client Acknowledgement */}
        <ClientAcknowledgement
          orderId={order.id}
          clientName={order.clientName}
          clientSig={order.clientSig}
          clientSigDate={order.clientSigDate}
          clientAbsent={order.clientAbsent}
        />

        {/* Delete */}
        {isAdmin && (
          <>
            <Separator />
            <Button
              variant="ghost"
              fullWidth
              isPending={deleting}
              onPress={handleDelete}
              className="text-danger"
            >
              {deleting ? "Deleting..." : "Delete Work Order"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className="text-foreground text-right">{value}</span>
    </div>
  );
}
