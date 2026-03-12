"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Input, Label, Select, ListBox, TextField } from "@heroui/react";
import { fmtHrs, fmtSecs } from "@/lib/utils";

interface WorkOrder {
  id: string;
  clientName: string;
  address: string;
  serviceType: string | null;
  date: string;
  techName: string;
  completed: string;
  billableSecs: number;
  submittedAt: string;
}

interface HistoryListProps {
  orders: WorkOrder[];
  isAdmin: boolean;
}

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "Y", label: "Done" },
  { value: "N", label: "Return Visit" },
  { value: "P", label: "Partial" },
] as const;

export function HistoryList({ orders, isAdmin }: HistoryListProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = orders.filter((o) => {
    if (statusFilter !== "all" && o.completed !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        o.clientName.toLowerCase().includes(q) ||
        o.address.toLowerCase().includes(q) ||
        o.techName.toLowerCase().includes(q) ||
        (o.serviceType?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  const statusLabel = (s: string) =>
    s === "Y" ? "Done" : s === "N" ? "Return Visit" : "Partial";

  const statusColor = (s: string) =>
    s === "Y" ? "text-success" : s === "N" ? "text-warning" : "text-accent";

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="flex flex-col gap-3">
        <TextField
          fullWidth
          value={search}
          onChange={setSearch}
        >
          <Label className="sr-only">Search</Label>
          <Input placeholder="Search client, address, tech..." />
        </TextField>

        {isAdmin && (
          <Select
            aria-label="Filter by status"
            placeholder="Filter by status"
            fullWidth
            selectedKey={statusFilter}
            onSelectionChange={(key) => setStatusFilter(key as string)}
          >
            <Label className="sr-only">Status</Label>
            <Select.Trigger>
              <Select.Value />
              <Select.Indicator />
            </Select.Trigger>
            <Select.Popover>
              <ListBox>
                {STATUS_FILTERS.map((f) => (
                  <ListBox.Item key={f.value} id={f.value} textValue={f.label}>
                    {f.label}
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        )}
      </div>

      {/* Results count */}
      <p className="text-xs text-white/50">
        {filtered.length} order{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Order list */}
      {filtered.length === 0 ? (
        <div className="py-12 text-center text-white/40 text-sm">
          No work orders found.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((order) => {
            const hrs = fmtHrs(order.billableSecs);
            return (
              <Card
                key={order.id}
                variant="default"
                className="cursor-pointer active:scale-[0.98] transition-transform"
                onClick={() => router.push(`/history/${order.id}`)}
              >
                <Card.Content>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {order.clientName}
                        </p>
                        <p className="text-xs text-muted mt-0.5">
                          {order.address}
                        </p>
                      </div>
                      <span className={`text-xs font-medium ${statusColor(order.completed)}`}>
                        {statusLabel(order.completed)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted">
                      <span>{order.date}</span>
                      {order.serviceType && (
                        <span className="text-foreground/60">{order.serviceType}</span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      {isAdmin && (
                        <span className="text-muted">{order.techName}</span>
                      )}
                      <span className="text-foreground font-medium ml-auto">
                        {hrs ? `${hrs} hrs` : fmtSecs(order.billableSecs)}
                      </span>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
