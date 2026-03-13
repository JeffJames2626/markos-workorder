"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Label, TextField, TextArea, Input } from "@heroui/react";

interface NotesEditorProps {
  orderId: string;
  zones: number | null;
  description: string | null;
  repairs: string | null;
}

export function NotesEditor({ orderId, zones, description, repairs }: NotesEditorProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editZones, setEditZones] = useState(zones !== null ? String(zones) : "");
  const [editDescription, setEditDescription] = useState(description ?? "");
  const [editRepairs, setEditRepairs] = useState(repairs ?? "");

  const hasContent = description || repairs || zones;

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/work-orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          zones: editZones ? parseInt(editZones, 10) : null,
          description: editDescription.trim() || null,
          repairs: editRepairs.trim() || null,
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
    setEditZones(zones !== null ? String(zones) : "");
    setEditDescription(description ?? "");
    setEditRepairs(repairs ?? "");
    setEditing(false);
  };

  if (!editing) {
    return (
      <Card variant="default">
        <Card.Header>
          <div className="flex items-center justify-between w-full">
            <Card.Title>Notes</Card.Title>
            <button
              onClick={() => setEditing(true)}
              className="text-xs font-medium text-accent px-2 py-1 rounded-lg active:bg-accent-soft transition-colors"
            >
              Edit
            </button>
          </div>
        </Card.Header>
        <Card.Content>
          {!hasContent ? (
            <p className="text-sm text-muted">No notes added</p>
          ) : (
            <div className="flex flex-col gap-2 text-sm">
              {zones && <Row label="Zones" value={String(zones)} />}
              {description && (
                <div>
                  <span className="text-muted block mb-1">Description</span>
                  <p className="text-foreground">{description}</p>
                </div>
              )}
              {repairs && (
                <div>
                  <span className="text-muted block mb-1">Repairs needed</span>
                  <p className="text-foreground">{repairs}</p>
                </div>
              )}
            </div>
          )}
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card variant="default">
      <Card.Header>
        <div className="flex items-center justify-between w-full">
          <Card.Title>Notes</Card.Title>
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
          <TextField fullWidth value={editZones} onChange={setEditZones}>
            <Label>Number of Zones</Label>
            <Input placeholder="e.g. 6" type="number" />
          </TextField>

          <TextField fullWidth value={editDescription} onChange={setEditDescription}>
            <Label>Description of Work</Label>
            <TextArea placeholder="Describe the work performed..." rows={3} />
          </TextField>

          <TextField fullWidth value={editRepairs} onChange={setEditRepairs}>
            <Label>Additional Repairs Needed</Label>
            <TextArea placeholder="Any follow-up repairs..." rows={2} />
          </TextField>
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
