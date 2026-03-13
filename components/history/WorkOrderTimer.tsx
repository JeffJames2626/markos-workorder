"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatElapsed(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

interface WorkOrderTimerProps {
  orderId: string;
  existingClockIn: number | null;
  existingClockOut: number | null;
  existingBillableSecs: number;
}

export function WorkOrderTimer({
  orderId,
  existingClockIn,
  existingClockOut,
  existingBillableSecs,
}: WorkOrderTimerProps) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(existingBillableSecs);
  const [saving, setSaving] = useState(false);
  const clockInRef = useRef<number | null>(existingClockIn);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startOffsetRef = useRef(existingBillableSecs);

  // If there's already a clock out, the timer is done
  const hasFinished = existingClockOut !== null && existingClockOut > 0;

  const tick = useCallback(() => {
    if (clockInRef.current === null) return;
    const nowElapsed = Math.floor((Date.now() - clockInRef.current) / 1000) + startOffsetRef.current;
    setElapsed(nowElapsed);
  }, []);

  const handleStart = () => {
    clockInRef.current = Date.now();
    setRunning(true);
    intervalRef.current = setInterval(tick, 500);
  };

  const handleStop = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const clockOut = Date.now();
    setRunning(false);
    setSaving(true);

    try {
      await fetch(`/api/work-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clockInTime: existingClockIn ?? clockInRef.current,
          clockOutTime: clockOut,
          billableSecs: elapsed,
        }),
      });
      router.refresh();
    } catch {
      // silent
    }
    setSaving(false);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="bg-surface rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted mb-1">Timer</p>
          <span
            className={`text-[32px] font-bold tracking-tight leading-none tabular-nums ${
              running ? "text-foreground" : "text-muted"
            }`}
          >
            {formatElapsed(elapsed)}
          </span>
        </div>

        {hasFinished ? (
          <div className="text-xs text-success font-medium px-3 py-1.5 rounded-full bg-success/10">
            Completed
          </div>
        ) : running ? (
          <button
            onClick={handleStop}
            disabled={saving}
            aria-label="Stop timer"
            className="flex items-center justify-center w-14 h-14 rounded-full bg-danger active:scale-95 transition-all disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" className="fill-danger-foreground">
              <rect x="3" y="3" width="14" height="14" rx="2" />
            </svg>
          </button>
        ) : (
          <button
            onClick={handleStart}
            aria-label="Start timer"
            className="flex items-center justify-center w-14 h-14 rounded-full bg-background active:scale-95 transition-all"
          >
            <svg width="18" height="20" viewBox="0 0 22 26" className="fill-foreground ml-1">
              <path d="M2 1.5L20.5 13L2 24.5V1.5Z" />
            </svg>
          </button>
        )}
      </div>
      {saving && <p className="text-xs text-muted">Saving time...</p>}
    </div>
  );
}
