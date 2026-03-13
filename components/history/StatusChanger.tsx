"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = [
  { value: "P", label: "Pending", color: "bg-accent text-accent-foreground" },
  { value: "Y", label: "Done", color: "bg-success text-success-foreground" },
  { value: "N", label: "Return Visit", color: "bg-warning text-warning-foreground" },
] as const;

interface StatusChangerProps {
  orderId: string;
  currentStatus: string;
}

export function StatusChanger({ orderId, currentStatus }: StatusChangerProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);

  const handleChange = async (newStatus: string) => {
    if (newStatus === status) return;
    setStatus(newStatus);
    setSaving(true);
    try {
      await fetch(`/api/work-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: newStatus }),
      });
      router.refresh();
    } catch {
      setStatus(status); // revert
    }
    setSaving(false);
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted">Status</p>
      <div className="flex gap-2">
        {STATUSES.map((s) => {
          const isActive = status === s.value;
          return (
            <button
              key={s.value}
              onClick={() => handleChange(s.value)}
              disabled={saving}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-medium transition-all active:scale-95 disabled:opacity-50 ${
                isActive
                  ? s.color
                  : "bg-surface text-muted"
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
