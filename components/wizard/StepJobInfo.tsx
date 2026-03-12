"use client";

import { Key } from "react";
import { Card, Select, ListBox, Label } from "@heroui/react";
import type { JobInfo, Client } from "./types";
import { SERVICE_TYPES, COMPLETED_OPTIONS } from "./types";

interface StepJobInfoProps {
  data: JobInfo;
  clients: Client[];
  preselectedClient: Client | null;
  onChange: (data: JobInfo) => void;
}

export function StepJobInfo({ data, clients, preselectedClient, onChange }: StepJobInfoProps) {
  const set = <K extends keyof JobInfo>(key: K, value: JobInfo[K]) => {
    onChange({ ...data, [key]: value });
  };

  const handleClientSelect = (key: Key | null) => {
    const client = clients.find((c) => c.id === key);
    if (client) {
      onChange({
        ...data,
        clientId: client.id,
        clientName: client.name,
        address: client.address ?? "",
        phone: client.phone ?? "",
      });
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Client — only show selector if not pre-selected */}
      {preselectedClient ? (
        <Card variant="default">
          <Card.Header>
            <Card.Title>Client</Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Name</span>
                <span className="text-foreground font-medium">{preselectedClient.name}</span>
              </div>
              {preselectedClient.address && (
                <div className="flex justify-between">
                  <span className="text-muted">Address</span>
                  <span className="text-foreground text-right">{preselectedClient.address}</span>
                </div>
              )}
              {preselectedClient.phone && (
                <div className="flex justify-between">
                  <span className="text-muted">Phone</span>
                  <span className="text-foreground">{preselectedClient.phone}</span>
                </div>
              )}
            </div>
          </Card.Content>
        </Card>
      ) : (
        <Select
          aria-label="Client"
          placeholder="Select a client"
          fullWidth
          selectedKey={data.clientId || null}
          onSelectionChange={handleClientSelect}
        >
          <Label>Client</Label>
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
      )}

      {/* Service Type */}
      <Select
        aria-label="Service Type"
        placeholder="Select service type"
        fullWidth
        selectedKey={data.serviceType || null}
        onSelectionChange={(key) => set("serviceType", key as string)}
      >
        <Label>Service Type</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {SERVICE_TYPES.map((type) => (
              <ListBox.Item key={type} id={type} textValue={type}>
                {type}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>

      {/* Status */}
      <Select
        aria-label="Status"
        placeholder="Select status"
        fullWidth
        selectedKey={data.completed}
        onSelectionChange={(key) => set("completed", key as "Y" | "N" | "P")}
      >
        <Label>Status</Label>
        <Select.Trigger>
          <Select.Value />
          <Select.Indicator />
        </Select.Trigger>
        <Select.Popover>
          <ListBox>
            {COMPLETED_OPTIONS.map((opt) => (
              <ListBox.Item key={opt.value} id={opt.value} textValue={opt.label}>
                {opt.label}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </Select.Popover>
      </Select>
    </div>
  );
}
