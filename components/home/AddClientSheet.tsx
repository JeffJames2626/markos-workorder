"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, TextField, Label, Input } from "@heroui/react";

interface AddClientSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddClientSheet({ isOpen, onClose }: AddClientSheetProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setName("");
    setAddress("");
    setEmail("");
    setPhone("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          address: address.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      reset();
      onClose();
      router.refresh();
    } catch {
      // stay open on error
    }
    setSaving(false);
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
          <h2 className="text-lg font-semibold text-overlay-foreground">Add Client</h2>
          <p className="text-xs text-muted mt-0.5">Create a new client</p>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4 overflow-y-auto">
          <TextField fullWidth value={name} onChange={setName}>
            <Label>Name</Label>
            <Input placeholder="Client name" />
          </TextField>
          <TextField fullWidth value={address} onChange={setAddress}>
            <Label>Address</Label>
            <Input placeholder="Service address" />
          </TextField>
          <TextField fullWidth value={email} onChange={setEmail}>
            <Label>Email</Label>
            <Input placeholder="Email address" type="email" />
          </TextField>
          <TextField fullWidth value={phone} onChange={setPhone}>
            <Label>Phone</Label>
            <Input placeholder="Phone number" type="tel" />
          </TextField>

          <Button
            variant="primary"
            fullWidth
            isPending={saving}
            isDisabled={!name.trim() || saving}
            onPress={handleSubmit}
          >
            {saving ? "Saving..." : "Add Client"}
          </Button>
        </div>

        <div style={{ height: "calc(12px + env(safe-area-inset-bottom, 0px))" }} />
      </div>
    </div>
  );
}
