"use client";

import { Card, TextField, NumberField, TextArea, Label } from "@heroui/react";
import { PhotoUploader, type PhotoItem } from "@/components/PhotoUploader";
import type { NotesData } from "./types";

interface StepNotesProps {
  data: NotesData;
  onChange: (data: NotesData) => void;
}

export function StepNotes({ data, onChange }: StepNotesProps) {
  const set = <K extends keyof NotesData>(key: K, value: NotesData[K]) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="flex flex-col gap-5">
      <Card variant="default">
        <Card.Header>
          <Card.Title>Job Details</Card.Title>
        </Card.Header>
        <Card.Content>
          <div className="flex flex-col gap-4">
            <NumberField
              fullWidth
              minValue={0}
              value={data.zones ?? undefined}
              onChange={(val) => set("zones", isNaN(val) ? null : val)}
            >
              <Label>Number of Zones</Label>
              <NumberField.Group>
                <NumberField.DecrementButton />
                <NumberField.Input />
                <NumberField.IncrementButton />
              </NumberField.Group>
            </NumberField>

            <TextField
              fullWidth
              value={data.description}
              onChange={(val) => set("description", val)}
            >
              <Label>Description of Work</Label>
              <TextArea
                placeholder="Describe the work performed..."
                rows={4}
              />
            </TextField>

            <TextField
              fullWidth
              value={data.repairs}
              onChange={(val) => set("repairs", val)}
            >
              <Label>Additional Repairs Needed</Label>
              <TextArea
                placeholder="Any additional repairs needed..."
                rows={3}
              />
            </TextField>
          </div>
        </Card.Content>
      </Card>

      <Card variant="default">
        <Card.Header>
          <Card.Title>Photos</Card.Title>
        </Card.Header>
        <Card.Content>
          <PhotoUploader
            photos={data.photos as PhotoItem[]}
            uploadUrl="/api/photos/upload"
            onPhotosChange={(photos) =>
              set("photos", photos.map((p) => ({ url: p.url, pathname: p.pathname })))
            }
          />
        </Card.Content>
      </Card>
    </div>
  );
}
