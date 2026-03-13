"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@heroui/react";

interface ClientAcknowledgementProps {
  orderId: string;
  clientName: string;
  clientSig: string | null;
  clientSigDate: string | null;
  clientAbsent: boolean;
}

export function ClientAcknowledgement({
  orderId,
  clientName,
  clientSig,
  clientSigDate,
  clientAbsent: initialAbsent,
}: ClientAcknowledgementProps) {
  const router = useRouter();
  const [acknowledged, setAcknowledged] = useState(!!clientSig);
  const [absent, setAbsent] = useState(initialAbsent);
  const [saving, setSaving] = useState(false);

  const handleAcknowledge = async () => {
    const next = !acknowledged;
    setAcknowledged(next);
    setSaving(true);
    try {
      const now = new Date().toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });
      await fetch(`/api/work-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientSig: next ? clientName : null,
          clientSigDate: next ? now : null,
          clientAbsent: false,
        }),
      });
      if (next) setAbsent(false);
      router.refresh();
    } catch {
      setAcknowledged(!next);
    }
    setSaving(false);
  };

  const handleAbsent = async () => {
    const next = !absent;
    setAbsent(next);
    setSaving(true);
    try {
      await fetch(`/api/work-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientAbsent: next,
          clientSig: null,
          clientSigDate: null,
        }),
      });
      if (next) setAcknowledged(false);
      router.refresh();
    } catch {
      setAbsent(!next);
    }
    setSaving(false);
  };

  return (
    <Card variant="default">
      <Card.Header>
        <Card.Title>Client Acknowledgement</Card.Title>
      </Card.Header>
      <Card.Content>
        <div className="flex flex-col gap-4">
          {/* Acknowledgement */}
          <div className="rounded-xl bg-surface p-4">
            <p className="text-sm text-foreground leading-relaxed mb-4">
              I, <span className="font-medium">{clientName}</span>, acknowledge
              that the services described in this work order have been performed
              to my satisfaction. I understand that any additional repairs or
              follow-up work identified will be addressed in a separate work
              order.
            </p>
            <label className={`flex items-center gap-3 ${saving || absent ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}>
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={handleAcknowledge}
                disabled={saving || absent}
                className="w-5 h-5 rounded border-2 border-border accent-accent shrink-0"
              />
              <span className="text-sm font-medium text-foreground">
                I acknowledge the services performed
              </span>
            </label>
            {acknowledged && clientSigDate && (
              <p className="text-xs text-muted mt-2 ml-8">
                Acknowledged on {clientSigDate}
              </p>
            )}
          </div>

          {/* Client not present */}
          <div className="rounded-xl bg-surface p-4">
            <label className={`flex items-center gap-3 ${saving || acknowledged ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}>
              <input
                type="checkbox"
                checked={absent}
                onChange={handleAbsent}
                disabled={saving || acknowledged}
                className="w-5 h-5 rounded border-2 border-border accent-accent shrink-0"
              />
              <span className="text-sm font-medium text-foreground">
                Client was not present
              </span>
            </label>
            {absent && (
              <p className="text-xs text-warning mt-2 ml-8">
                Work order completed without client sign-off.
              </p>
            )}
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
