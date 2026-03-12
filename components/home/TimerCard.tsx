"use client";

import { useState, useEffect, useRef, useCallback, type Key } from "react";
import { useRouter } from "next/navigation";
import { Select, ListBox, Label } from "@heroui/react";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatElapsed(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

type Client = {
  id: string;
  name: string;
};

export function TimerCard({ clients }: { clients: Client[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const clockInRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const selectedName = clients.find((c) => c.id === selectedId)?.name;

  const tick = useCallback(() => {
    if (clockInRef.current === null) return;
    setElapsed(Math.floor((Date.now() - clockInRef.current) / 1000));
  }, []);

  const handleToggle = () => {
    if (running) {
      // Stop timer → navigate to wizard
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
      if (selectedId) params.set("clientId", selectedId);
      if (selectedName) params.set("client", selectedName);
      router.push(`/workorder/new?${params.toString()}`);
    } else {
      // Start timer
      clockInRef.current = Date.now();
      setElapsed(0);
      setRunning(true);
      intervalRef.current = setInterval(tick, 500);
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="bg-[#171717] rounded-xl p-4 flex flex-col gap-4">
      {/* Timer row */}
      <div className="flex items-center justify-between">
        <span
          className={`text-[40px] font-bold tracking-tight leading-none tabular-nums ${
            running ? "text-white" : "text-white/40"
          }`}
        >
          {formatElapsed(elapsed)}
        </span>

        {/* Play / Stop button */}
        <button
          onClick={handleToggle}
          aria-label={running ? "Stop timer" : "Start timer"}
          className="flex items-center justify-center w-14 h-14 rounded-full bg-[#262626] active:scale-95 transition-transform"
        >
          {running ? (
            /* Stop icon (square) */
            <svg width="20" height="20" viewBox="0 0 20 20" fill="white">
              <rect x="3" y="3" width="14" height="14" rx="2" />
            </svg>
          ) : (
            /* Play icon (triangle) */
            <svg width="22" height="26" viewBox="0 0 22 26" fill="white">
              <path d="M2 1.5L20.5 13L2 24.5V1.5Z" />
            </svg>
          )}
        </button>
      </div>

      {/* Client dropdown */}
      <Select
        aria-label="Client"
        placeholder="Select a client"
        fullWidth
        selectedKey={selectedId}
        onSelectionChange={(key: Key | null) =>
          setSelectedId(key as string | null)
        }
      >
        <Label className="sr-only">Client</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {clients.map((c) => (
              <ListBox.Item key={c.id} id={c.id} textValue={c.name}>
                {c.name}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
    </div>
  );
}
