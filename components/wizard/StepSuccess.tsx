"use client";

import { Button, Card } from "@heroui/react";
import { useRouter } from "next/navigation";
import { fmtHrs, fmtSecs } from "@/lib/utils";

interface StepSuccessProps {
  data: {
    clientName: string;
    date: string;
    billableSecs: number;
    partsCount: number;
  };
}

export function StepSuccess({ data }: StepSuccessProps) {
  const router = useRouter();
  const hrs = fmtHrs(data.billableSecs);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-background px-5">
      <div className="w-full max-w-[480px] flex flex-col items-center gap-6">
        {/* Success icon */}
        <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Order Submitted</h1>
          <p className="text-sm text-muted mt-1">Work order has been saved successfully.</p>
        </div>

        <Card variant="default" className="w-full">
          <Card.Content>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Client</span>
                <span className="text-foreground">{data.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Date</span>
                <span className="text-foreground">{data.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Billable</span>
                <span className="text-foreground">{hrs ? `${hrs} hrs` : fmtSecs(data.billableSecs)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Parts</span>
                <span className="text-foreground">{data.partsCount}</span>
              </div>
            </div>
          </Card.Content>
        </Card>

        <div className="flex gap-3 w-full">
          <Button
            variant="secondary"
            fullWidth
            onPress={() => router.push("/workorder")}
          >
            New Order
          </Button>
          <Button
            variant="primary"
            fullWidth
            onPress={() => router.push("/history")}
          >
            View History
          </Button>
        </div>
      </div>
    </div>
  );
}
