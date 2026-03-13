"use client";

import { useState, type Key } from "react";
import { useRouter } from "next/navigation";
import {
  Select,
  ListBox,
  Label,
  Button,
  Input,
  TextField,
  TextArea,
  Modal,
  useOverlayState,
} from "@heroui/react";

type Client = { id: string; name: string; address?: string | null; phone?: string | null };

interface QuickCreateSheetProps {
  clients: Client[];
  techName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickCreateSheet({ clients: initialClients, techName, isOpen, onClose }: QuickCreateSheetProps) {
  const router = useRouter();
  const [clients, setClients] = useState(initialClients);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // New client modal
  const addModal = useOverlayState();
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [saving, setSaving] = useState("");

  const selectedClient = clients.find((c) => c.id === selectedId);
  const canSaveClient = newName.trim() && newAddress.trim() && newEmail.trim() && newPhone.trim();

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
      setClients((prev) => [...prev, { id: created.id, name: created.name, address: created.address, phone: created.phone }]);
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
    <>
      {/* Backdrop + sheet — hidden while add-client modal is open */}
      <div className={`fixed inset-0 z-[60] ${addModal.isOpen ? "invisible" : ""}`} onClick={handleClose}>
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
            {/* Client select + add */}
            <div className="flex gap-2">
              <div className="flex-1">
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
