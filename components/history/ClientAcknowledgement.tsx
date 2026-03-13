"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Checkbox } from "@heroui/react";

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

  const alreadySigned = !!clientSig;

  const handleAcknowledge = async (checked: boolean) => {
    setAcknowledged(checked);
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
          clientSig: checked ? clientName : null,
          clientSigDate: checked ? now : null,
          clientAbsent: false,
        }),
      });
      router.refresh();
    } catch {
      setAcknowledged(!checked);
    }
    setSaving(false);
  };

  const handleAbsent = async (checked: boolean) => {
    setAbsent(checked);
    setSaving(true);
    try {
      await fetch(`/api/work-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientAbsent: checked,
          clientSig: null,
          clientSigDate: null,
        }),
      });
      if (checked) setAcknowledged(false);
      router.refresh();
    } catch {
      setAbsent(!checked);
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
          {/* Acknowledgement text + checkbox */}
          <div className="rounded-xl bg-surface p-4">
            <p className="text-sm text-foreground leading-relaxed mb-4">
              I, <span className="font-medium">{clientName}</span>, acknowledge
              that the services described in this work order have been performed
              to my satisfaction. I understand that any additional repairs or
              follow-up work identified will be addressed in a separate work
              order.
            </p>
            <Checkbox
              isSelected={acknowledged}
              isDisabled={saving || absent}
              onChange={(checked) => handleAcknowledge(!!checked)}
            >
              <span className="text-sm font-medium">
                I acknowledge the services performed
              </span>
            </Checkbox>
            {acknowledged && clientSigDate && (
              <p className="text-xs text-muted mt-2 ml-7">
                Acknowledged on {clientSigDate}
              </p>
            )}
          </div>

          {/* Client not present */}
          <div className="rounded-xl bg-surface p-4">
            <Checkbox
              isSelected={absent}
              isDisabled={saving || acknowledged}
              onChange={(checked) => handleAbsent(!!checked)}
            >
              <span className="text-sm font-medium">Client was not present</span>
            </Checkbox>
            {absent && (
              <p className="text-xs text-warning mt-2 ml-7">
                Work order completed without client sign-off.
              </p>
            )}
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
