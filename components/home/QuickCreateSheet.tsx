"use client";

import { useState, type Key } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  ListBox,
  Label,
  Button,
  TextField,
  TextArea,
} from "@heroui/react";

type Client = { id: string; name: string; address?: string | null; phone?: string | null };

interface QuickCreateSheetProps {
  clients: Client[];
  techName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickCreateSheet({ clients, techName, isOpen, onClose }: QuickCreateSheetProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedClient = clients.find((c) => c.id === selectedId);

  const handleSubmit = async () => {
    if (!selectedClient) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/work-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClient.id,
          clientName: selectedClient.name,
          address: selectedClient.address ?? "",
          phone: selectedClient.phone ?? "",
          date: new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }),
          completed: "P",
          techName,
          billableSecs: 0,
          pausedSecs: 0,
          clientAbsent: true,
          description: notes.trim() || undefined,
          parts: [],
        }),
      });
      if (!res.ok) throw new Error();
      setSelectedId(null);
      setNotes("");
      onClose();
      router.refresh();
    } catch {
      // stay open on error
    }
    setSubmitting(false);
  };

  const handleClose = () => {
    setSelectedId(null);
    setNotes("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]" onClick={handleClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="absolute bottom-0 left-0 right-0 bg-overlay rounded-t-2xl flex flex-col animate-in slide-in-from-bottom duration-200"
        style={{ maxHeight: "85dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <div className="px-5 pb-2">
          <h2 className="text-lg font-semibold text-overlay-foreground">New Work Order</h2>
          <p className="text-xs text-muted mt-0.5">Create a pending work order</p>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4 overflow-y-auto">
          {/* Client select */}
          <Select
            aria-label="Client"
            placeholder="Select a client"
            fullWidth
            selectedKey={selectedId}
            onSelectionChange={(key: Key | null) => setSelectedId(key as string | null)}
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

          {/* Notes */}
          <TextField fullWidth value={notes} onChange={setNotes}>
            <Label>Job Notes</Label>
            <TextArea placeholder="Describe the job..." rows={3} />
          </TextField>

          {/* Submit */}
          <Button
            variant="primary"
            fullWidth
            isPending={submitting}
            isDisabled={!selectedClient || submitting}
            onPress={handleSubmit}
          >
            {submitting ? "Creating..." : "Create Work Order"}
          </Button>
        </div>

        {/* Bottom safe area */}
        <div style={{ height: "calc(12px + env(safe-area-inset-bottom, 0px))" }} />
      </div>
    </div>
  );
}
