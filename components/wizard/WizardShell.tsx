"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@heroui/react";
import type { WizardData, Client } from "./types";
import { StepJobInfo } from "./StepJobInfo";
import { StepTime } from "./StepTime";
import { StepParts } from "./StepParts";
import { StepNotes } from "./StepNotes";
import { StepReview } from "./StepReview";
import { StepSuccess } from "./StepSuccess";

function today() {
  return new Date().toISOString().slice(0, 10);
}

interface WizardShellProps {
  techName: string;
  clients: Client[];
}

type StepId = "job" | "time" | "parts" | "notes" | "review";

const STEP_LABELS: Record<StepId, string> = {
  job: "Job Info",
  time: "Time",
  parts: "Parts",
  notes: "Notes",
  review: "Review",
};

export function WizardShell({ techName, clients }: WizardShellProps) {
  const searchParams = useSearchParams();

  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    clientName: string;
    date: string;
    billableSecs: number;
    partsCount: number;
  } | null>(null);

  // Resolve pre-selected client from URL params
  const preClientId = searchParams.get("clientId") ?? "";
  const preClient = preClientId
    ? clients.find((c) => c.id === preClientId) ?? null
    : null;

  // Timer was used if clockIn and clockOut are both in URL params
  const hasTimerData =
    searchParams.has("clockIn") && searchParams.has("clockOut");

  // Build dynamic steps — skip Time when timer was already used
  const steps: StepId[] = hasTimerData
    ? ["job", "parts", "notes", "review"]
    : ["job", "time", "parts", "notes", "review"];

  const [data, setData] = useState<WizardData>(() => ({
    job: {
      clientName: preClient?.name ?? searchParams.get("client") ?? "",
      clientId: preClient?.id ?? "",
      address: preClient?.address ?? "",
      phone: preClient?.phone ?? "",
      serviceType: "",
      date: today(),
      completed: "Y",
    },
    timer: {
      clockInTime: searchParams.get("clockIn") ? Number(searchParams.get("clockIn")) : null,
      clockOutTime: searchParams.get("clockOut") ? Number(searchParams.get("clockOut")) : null,
      billableSecs: searchParams.get("billableSecs") ? Number(searchParams.get("billableSecs")) : 0,
      pausedSecs: 0,
    },
    parts: {},
    notes: {
      zones: null,
      description: "",
      repairs: "",
      photos: [],
    },
    signoff: {
      techSig: "",
      techSigDate: today(),
      clientSig: "",
      clientSigDate: today(),
      clientAbsent: false,
    },
    techName,
  }));

  const update = <K extends keyof WizardData>(key: K, value: WizardData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  // Validation: step 0 (job) requires clientName and date
  const canNext = () => {
    if (steps[step] === "job") {
      return data.job.clientName.trim() !== "" && data.job.date !== "";
    }
    return true;
  };

  const partsArray = Object.entries(data.parts)
    .filter(([, qty]) => qty > 0)
    .map(([key, qty]) => {
      const [category, itemName] = key.split("||");
      return { category, itemName, quantity: qty, isCustom: false };
    });

  const handleSubmit = async () => {
    const body = {
      clientId: data.job.clientId || undefined,
      clientName: data.job.clientName,
      address: data.job.address,
      phone: data.job.phone || undefined,
      serviceType: data.job.serviceType || undefined,
      date: data.job.date,
      zones: data.notes.zones ?? undefined,
      completed: data.job.completed,
      techName: data.techName,
      clockInTime: data.timer.clockInTime ?? undefined,
      clockOutTime: data.timer.clockOutTime ?? undefined,
      billableSecs: data.timer.billableSecs,
      pausedSecs: data.timer.pausedSecs,
      description: data.notes.description || undefined,
      repairs: data.notes.repairs || undefined,
      techSig: data.signoff.techSig || undefined,
      techSigDate: data.signoff.techSigDate || undefined,
      clientSig: data.signoff.clientSig || undefined,
      clientSigDate: data.signoff.clientSigDate || undefined,
      clientAbsent: data.signoff.clientAbsent,
      parts: partsArray,
    };

    const res = await fetch("/api/work-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const order = await res.json();

      // Associate uploaded photos with the work order
      if (data.notes.photos.length > 0) {
        try {
          await fetch(`/api/work-orders/${order.id}/photos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ photos: data.notes.photos }),
          });
        } catch {
          // Photo association failure is non-fatal
        }
      }

      // Attempt email (non-fatal)
      try {
        await fetch("/api/email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workOrderId: order.id }),
        });
      } catch {
        // Email failure is non-fatal
      }
    }

    setSubmittedData({
      clientName: data.job.clientName,
      date: data.job.date,
      billableSecs: data.timer.billableSecs,
      partsCount: partsArray.length,
    });
    setSubmitted(true);
  };

  if (submitted && submittedData) {
    return <StepSuccess data={submittedData} />;
  }

  const currentStepId = steps[step];
  const totalSteps = steps.length;
  const isLastStep = currentStepId === "review";

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      {/* Progress bar */}
      <div className="w-full max-w-[480px] mx-auto px-5 pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            {STEP_LABELS[currentStepId]}
          </span>
          <span className="text-xs text-muted">
            {step + 1} of {totalSteps}
          </span>
        </div>
        <div className="h-1 rounded-full bg-default overflow-hidden">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 w-full max-w-[480px] mx-auto px-5 py-6 overflow-y-auto">
        {currentStepId === "job" && (
          <StepJobInfo
            data={data.job}
            clients={clients}
            preselectedClient={preClient}
            onChange={(job) => update("job", job)}
          />
        )}
        {currentStepId === "time" && (
          <StepTime
            data={data.timer}
            onChange={(timer) => update("timer", timer)}
          />
        )}
        {currentStepId === "parts" && (
          <StepParts
            data={data.parts}
            onChange={(parts) => update("parts", parts)}
          />
        )}
        {currentStepId === "notes" && (
          <StepNotes
            data={data.notes}
            onChange={(notes) => update("notes", notes)}
          />
        )}
        {currentStepId === "review" && (
          <StepReview
            data={data}
            partsArray={partsArray}
            onChange={(signoff) => update("signoff", signoff)}
            onSubmit={handleSubmit}
          />
        )}
      </div>

      {/* Navigation */}
      {!isLastStep && (
        <div className="w-full max-w-[480px] mx-auto px-5 pb-6 flex gap-3">
          {step > 0 && (
            <Button
              variant="secondary"
              fullWidth
              onPress={() => setStep((s) => s - 1)}
            >
              Back
            </Button>
          )}
          <Button
            variant="primary"
            fullWidth
            isDisabled={!canNext()}
            onPress={() => setStep((s) => s + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
