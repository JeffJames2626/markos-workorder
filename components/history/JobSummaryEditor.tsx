"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Input, Label, TextField, Select, ListBox } from "@heroui/react";

const SERVICE_TYPES = [
  "Sprinkler Turn On",
  "Sprinkler Adjustment",
  "Sprinkler Repair",
  "Sprinkler Blowout",
  "Backflow Test",
];

interface JobSummaryEditorProps {
  orderId: string;
  clientName: string;
  address: string;
  phone: string | null;
  serviceType: string | null;
  date: string;
  techName: string;
}

export function JobSummaryEditor({
  orderId,
  clientName,
  address,
  phone,
  serviceType,
  date,
  techName,
}: JobSummaryEditorProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editAddress, setEditAddress] = useState(address);
  const [editPhone, setEditPhone] = useState(phone ?? "");
  const [editService, setEditService] = useState(serviceType ?? "");
  const [editDate, setEditDate] = useState(date);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/work-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: editAddress,
          phone: editPhone || null,
          serviceType: editService || null,
          date: editDate,
        }),
      });
      if (!res.ok) throw new Error();
      setEditing(false);
      router.refresh();
    } catch {
      // stay in edit mode
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setEditAddress(address);
    setEditPhone(phone ?? "");
    setEditService(serviceType ?? "");
    setEditDate(date);
    setEditing(false);
  };

  if (!editing) {
    return (
      <Card variant="default">
        <Card.Header>
          <div className="flex items-center justify-between w-full">
            <Card.Title>Job Summary</Card.Title>
            <button
              onClick={() => setEditing(true)}
              className="text-xs font-medium text-accent px-2 py-1 rounded-lg active:bg-accent-soft transition-colors"
            >
              Edit
            </button>
          </div>
        </Card.Header>
        <Card.Content>
          <div className="flex flex-col gap-2 text-sm">
            <Row label="Client" value={clientName} />
            <Row label="Address" value={address} />
            {phone && <Row label="Phone" value={phone} />}
            {serviceType && <Row label="Service" value={serviceType} />}
            <Row label="Date" value={date} />
            <Row label="Technician" value={techName} />
          </div>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card variant="default">
      <Card.Header>
        <div className="flex items-center justify-between w-full">
          <Card.Title>Job Summary</Card.Title>
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="text-xs font-medium text-muted px-2 py-1 rounded-lg active:bg-default transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-xs font-medium text-accent px-2 py-1 rounded-lg active:bg-accent-soft transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </Card.Header>
      <Card.Content>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Client</span>
            <span className="text-foreground">{clientName}</span>
          </div>

          <TextField fullWidth value={editAddress} onChange={setEditAddress}>
            <Label>Address</Label>
            <Input placeholder="Service address" />
          </TextField>

          <TextField fullWidth value={editPhone} onChange={setEditPhone}>
            <Label>Phone</Label>
            <Input placeholder="Phone number" type="tel" />
          </TextField>

          <Select
            aria-label="Service type"
            placeholder="Service type"
            fullWidth
            selectedKey={editService}
            onSelectionChange={(key) => setEditService(key as string)}
          >
            <Label>Service Type</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {SERVICE_TYPES.map((s) => (
                  <ListBox.Item key={s} id={s} textValue={s}>
                    {s}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>

          <TextField fullWidth value={editDate} onChange={setEditDate}>
            <Label>Date</Label>
            <Input placeholder="MM/DD/YYYY" />
          </TextField>

          <div className="flex flex-col gap-1 text-sm">
            <span className="text-muted">Technician</span>
            <span className="text-foreground">{techName}</span>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted">{label}</span>
      <span className="text-foreground text-right">{value}</span>
    </div>
  );
}
