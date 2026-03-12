"use client";

import { useState } from "react";
import { Card, Input, Switch, Button, Separator } from "@heroui/react";
import type { WizardData, SignoffData } from "./types";
import { fmtSecs, fmtTime, fmtHrs } from "@/lib/utils";

interface StepReviewProps {
  data: WizardData;
  partsArray: { category: string; itemName: string; quantity: number }[];
  onChange: (signoff: SignoffData) => void;
  onSubmit: () => Promise<void>;
}

export function StepReview({ data, partsArray, onChange, onSubmit }: StepReviewProps) {
  const [submitting, setSubmitting] = useState(false);
  const { signoff } = data;

  const set = <K extends keyof SignoffData>(key: K, value: SignoffData[K]) => {
    onChange({ ...signoff, [key]: value });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    await onSubmit();
    setSubmitting(false);
  };

  const hrs = fmtHrs(data.timer.billableSecs);

  return (
    <div className="flex flex-col gap-5">
      {/* Job Summary */}
      <Card variant="default">
        <Card.Header>
          <Card.Title>Job Summary</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="flex flex-col gap-2 text-sm">
            <Row label="Client" value={data.job.clientName} />
            <Row label="Address" value={data.job.address} />
            {data.job.phone && <Row label="Phone" value={data.job.phone} />}
            {data.job.serviceType && <Row label="Service" value={data.job.serviceType} />}
            <Row label="Date" value={data.job.date} />
            <Row label="Technician" value={data.techName} />
            <Row
              label="Status"
              value={data.job.completed === "Y" ? "Done" : data.job.completed === "N" ? "Return Visit" : "Partial"}
            />
          </div>
        </Card.Content>
      </Card>

      {/* Time Summary */}
      <Card variant="default">
        <Card.Header>
          <Card.Title>Time</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="flex flex-col gap-2 text-sm">
            {data.timer.clockInTime && (
              <Row label="Clock in" value={fmtTime(data.timer.clockInTime)} />
            )}
            {data.timer.clockOutTime && (
              <Row label="Clock out" value={fmtTime(data.timer.clockOutTime)} />
            )}
            <Row label="Billable" value={hrs ? `${hrs} hrs` : fmtSecs(data.timer.billableSecs)} />
            {data.timer.pausedSecs > 0 && (
              <Row label="Non-billable" value={fmtSecs(data.timer.pausedSecs)} />
            )}
          </div>
        </Card.Content>
      </Card>

      {/* Parts */}
      {partsArray.length > 0 && (
        <Card variant="default">
          <Card.Header>
            <Card.Title>Parts ({partsArray.length})</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="flex flex-col gap-1.5">
              {partsArray.map((p) => (
                <div key={`${p.category}||${p.itemName}`} className="flex justify-between text-sm">
                  <span className="text-foreground">{p.itemName}</span>
                  <span className="text-muted">x{p.quantity}</span>
                </div>
              ))}
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Notes */}
      {(data.notes.description || data.notes.repairs || data.notes.zones) && (
        <Card variant="default">
          <Card.Header>
            <Card.Title>Notes</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="flex flex-col gap-2 text-sm">
              {data.notes.zones && <Row label="Zones" value={String(data.notes.zones)} />}
              {data.notes.description && (
                <div>
                  <span className="text-muted block mb-1">Description</span>
                  <p className="text-foreground">{data.notes.description}</p>
                </div>
              )}
              {data.notes.repairs && (
                <div>
                  <span className="text-muted block mb-1">Repairs needed</span>
                  <p className="text-foreground">{data.notes.repairs}</p>
                </div>
              )}
            </div>
          </Card.Content>
        </Card>
      )}

      <Separator />

      {/* Signatures */}
      <Card variant="default">
        <Card.Header>
          <Card.Title>Technician Signature</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="flex flex-col gap-3">
            <Input
              aria-label="Technician signature"
              placeholder="Type your name"
              value={signoff.techSig}
              onChange={(e) => set("techSig", e.target.value)}
              fullWidth
            />
            <Input
              aria-label="Signature date"
              type="date"
              value={signoff.techSigDate}
              onChange={(e) => set("techSigDate", e.target.value)}
              fullWidth
            />
            {signoff.techSig && (
              <div className="py-2 px-3 rounded-xl bg-surface-secondary">
                <p className="text-lg font-medium italic text-foreground">{signoff.techSig}</p>
              </div>
            )}
          </div>
        </Card.Content>
      </Card>

      <Card variant="default">
        <Card.Header>
          <Card.Title>Client Signature</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="flex flex-col gap-3">
            <Switch
              isSelected={signoff.clientAbsent}
              onChange={(v) => set("clientAbsent", v)}
            >
              No client present
            </Switch>

            {signoff.clientAbsent ? (
              <div className="py-2 px-3 rounded-xl bg-warning/10">
                <p className="text-sm text-warning">
                  Client was not present for sign-off.
                </p>
              </div>
            ) : (
              <>
                <Input
                  aria-label="Client signature"
                  placeholder="Client name"
                  value={signoff.clientSig}
                  onChange={(e) => set("clientSig", e.target.value)}
                  fullWidth
                />
                <Input
                  aria-label="Client signature date"
                  type="date"
                  value={signoff.clientSigDate}
                  onChange={(e) => set("clientSigDate", e.target.value)}
                  fullWidth
                />
                {signoff.clientSig && (
                  <div className="py-2 px-3 rounded-xl bg-surface-secondary">
                    <p className="text-lg font-medium italic text-foreground">{signoff.clientSig}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </Card.Content>
      </Card>

      {/* Submit */}
      <Button
        variant="primary"
        fullWidth
        isPending={submitting}
        isDisabled={submitting}
        onPress={handleSubmit}
      >
        {submitting ? "Submitting..." : "Submit Work Order"}
      </Button>
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
