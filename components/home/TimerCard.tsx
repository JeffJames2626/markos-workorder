"use client";

import { useState, useEffect, useRef, useCallback, type Key } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  ListBox,
  Label,
  Button,
  Input,
  TextField,
  Modal,
  useOverlayState,
} from "@heroui/react";

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

const JOB_TYPES = [
  { id: "repair", name: "Repair" },
  { id: "install", name: "Install" },
  { id: "winterize", name: "Winterize" },
  { id: "startup", name: "Start Up" },
  { id: "inspection", name: "Inspection" },
  { id: "other", name: "Other" },
];

export function TimerCard({ clients: initialClients }: { clients: Client[] }) {
  const router = useRouter();
  const [clients, setClients] = useState(initialClients);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [jobType, setJobType] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const clockInRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // New client modal
  const addModal = useOverlayState();
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [saving, setSaving] = useState("");

  const selectedName = clients.find((c) => c.id === selectedId)?.name;

  const tick = useCallback(() => {
    if (clockInRef.current === null) return;
    setElapsed(Math.floor((Date.now() - clockInRef.current) / 1000));
  }, []);

  const handleToggle = () => {
    if (running) {
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
      if (jobType) params.set("jobType", jobType);
      router.push(`/workorder/new?${params.toString()}`);
    } else {
      clockInRef.current = Date.now();
      setElapsed(0);
      setRunning(true);
      intervalRef.current = setInterval(tick, 500);
    }
  };

  const canSaveClient =
    newName.trim() && newAddress.trim() && newEmail.trim() && newPhone.trim();

  const handleAddClient = async () => {
    if (!canSaveClient) return;
    setSaving("saving");
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          address: newAddress.trim(),
          email: newEmail.trim(),
          phone: newPhone.trim(),
        }),
      });
      if (!res.ok) throw new Error();
      const created = await res.json();
      setClients((prev) => [...prev, { id: created.id, name: created.name }]);
      setSelectedId(created.id);
      addModal.close();
      setNewName("");
      setNewAddress("");
      setNewEmail("");
      setNewPhone("");
    } catch {
      setSaving("error");
      return;
    }
    setSaving("");
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <>
      <div className="bg-surface rounded-xl p-4 flex flex-col gap-4">
        {/* Client dropdown + add button */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Select
              aria-label="Client"
              placeholder="Client"
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
          <Button
            variant="ghost"
            size="sm"
            onPress={() => {
              setNewName("");
              setNewAddress("");
              setNewEmail("");
              setNewPhone("");
              setSaving("");
              addModal.open();
            }}
            aria-label="Add new client"
            className="shrink-0 self-center"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New
          </Button>
        </div>

        {/* Job type dropdown */}
        <Select
          aria-label="Job type"
          placeholder="Job type"
          fullWidth
          selectedKey={jobType}
          onSelectionChange={(key: Key | null) =>
            setJobType(key as string | null)
          }
        >
          <Label className="sr-only">Job type</Label>
          <Select.Trigger>
            <Select.Value />
            <Select.Indicator />
          </Select.Trigger>
          <Select.Popover>
            <ListBox>
              {JOB_TYPES.map((j) => (
                <ListBox.Item key={j.id} id={j.id} textValue={j.name}>
                  {j.name}
                  <ListBox.ItemIndicator />
                </ListBox.Item>
              ))}
            </ListBox>
          </Select.Popover>
        </Select>

        {/* Timer row */}
        <div className="flex items-center justify-between">
          <span
            className={`text-[40px] font-bold tracking-tight leading-none tabular-nums ${
              running ? "text-foreground" : "text-muted"
            }`}
          >
            {formatElapsed(elapsed)}
          </span>

          {/* Play / Stop button */}
          <button
            onClick={handleToggle}
            aria-label={running ? "Stop timer" : "Start timer"}
            className={`flex items-center justify-center w-14 h-14 rounded-full active:scale-95 transition-all ${
              running ? "bg-danger" : "bg-background"
            }`}
          >
            {running ? (
              <svg width="18" height="18" viewBox="0 0 20 20" className="fill-danger-foreground">
                <rect x="3" y="3" width="14" height="14" rx="2" />
              </svg>
            ) : (
              <svg width="18" height="20" viewBox="0 0 22 26" className="fill-foreground ml-1">
                <path d="M2 1.5L20.5 13L2 24.5V1.5Z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Add Client Modal */}
      <Modal.Backdrop isOpen={addModal.isOpen} onOpenChange={addModal.setOpen}>
        <Modal.Container placement="center">
          <Modal.Dialog className="sm:max-w-[400px]">
            <Modal.CloseTrigger />
            <Modal.Header>
              <Modal.Heading>New Client</Modal.Heading>
              <p className="text-sm text-muted">All fields are required.</p>
            </Modal.Header>
            <Modal.Body>
              <div className="flex flex-col gap-4">
                <TextField fullWidth value={newName} onChange={setNewName}>
                  <Label>Name</Label>
                  <Input placeholder="Client name" />
                </TextField>
                <TextField fullWidth value={newAddress} onChange={setNewAddress}>
                  <Label>Address</Label>
                  <Input placeholder="Service address" />
                </TextField>
                <TextField fullWidth value={newEmail} onChange={setNewEmail}>
                  <Label>Email</Label>
                  <Input placeholder="Email address" type="email" />
                </TextField>
                <TextField fullWidth value={newPhone} onChange={setNewPhone}>
                  <Label>Phone</Label>
                  <Input placeholder="Phone number" type="tel" />
                </TextField>
                {saving === "error" && (
                  <p className="text-sm text-danger">Failed to create client. Try again.</p>
                )}
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button slot="close" variant="secondary">Cancel</Button>
              <Button
                variant="primary"
                isPending={saving === "saving"}
                isDisabled={!canSaveClient || saving === "saving"}
                onPress={handleAddClient}
              >
                {saving === "saving" ? "Adding..." : "Add Client"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </>
  );
}
