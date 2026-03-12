"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatElapsed(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export function StartButton({ client }: { client?: string }) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const clockInRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tick = useCallback(() => {
    if (clockInRef.current === null) return;
    setElapsed(Math.floor((Date.now() - clockInRef.current) / 1000));
  }, []);

  const handleStart = () => {
    clockInRef.current = Date.now();
    setElapsed(0);
    setRunning(true);
    intervalRef.current = setInterval(tick, 500);
  };

  const handleEnd = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const clockIn = clockInRef.current;
    const clockOut = Date.now();
    const billableSecs = elapsed;
    setRunning(false);
    const params = new URLSearchParams({
      clockIn: String(clockIn),
      clockOut: String(clockOut),
      billableSecs: String(billableSecs),
    });
    if (client) params.set("client", client);
    router.push(`/workorder/new?${params.toString()}`);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div style={{ width: "100%" }}>
      <button
        onClick={running ? handleEnd : handleStart}
        aria-label={running ? "End timer" : "Start timer"}
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "1",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--color-surface)",
          border: running ? "3px solid var(--color-accent)" : "2px solid var(--color-border)",
          boxShadow: running
            ? "0 0 40px color-mix(in oklab, var(--color-accent) 30%, transparent)"
            : "none",
          cursor: "pointer",
          transition: "box-shadow 0.3s ease, border-color 0.3s ease",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        {/* Spinning arc while running */}
        {running && (
          <svg
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              animation: "timer-spin 2.5s linear infinite",
            }}
            viewBox="0 0 100 100"
          >
            <circle
              cx="50" cy="50" r="48.5"
              fill="none" stroke="var(--color-accent)" strokeWidth="1"
              strokeDasharray="25 280" strokeLinecap="round"
              opacity="0.4"
            />
          </svg>
        )}

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", userSelect: "none" }}>
          {/* Label */}
          <span className={`text-sm${running ? "text-accent opacity-60" : "text-muted"}`}>
            Total Time
          </span>

          {/* Timer */}
          <span
            className={`font-medium mt-2 ${running ? "text-accent" : "text-foreground"}`}
            style={{ fontSize: "clamp(2.5rem, 10vw, 3.5rem)", fontVariantNumeric: "tabular-nums", lineHeight: 1.1 }}
          >
            {formatElapsed(elapsed)}
          </span>

          {/* Tap hint / End pill */}
          {running ? (
            <span className="mt-5 text-sm font-boldtext-accent-foreground bg-accent px-6 py-1.5 rounded-full">
              End
            </span>
          ) : (
            <span className="mt-3 text-sm text-muted">
              tap to start
            </span>
          )}
        </div>
      </button>

      <style>{`
        @keyframes timer-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
